package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Request.*;
import com.example.StudyBuddy.DTO.Response.LoginResponseDTO;
import com.example.StudyBuddy.DTO.Response.RegisterResponseDTO;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.UserSession;
import com.example.StudyBuddy.Enum.Role;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Repository.UserSessionRepository;
import com.example.StudyBuddy.Security.JwtService;
import com.example.StudyBuddy.Service.AuthService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.StudyBuddy.Entity.RefreshToken;
import com.example.StudyBuddy.Repository.RefreshTokenRepository;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Duration REGISTRATION_TTL =
            Duration.ofMinutes(15);

    private static final String REG_PREFIX = "AUTH:REGISTER:";
    private static final String OTP_PREFIX = "AUTH:OTP:";
    private static final String EMAIL_VERIFIED_PREFIX =
            "AUTH:EMAIL_VERIFIED:";
    private static final String ADMIN_OTP_PREFIX = "AUTH:ADMIN_OTP:";

    private static final Pattern OTP_PATTERN =
            Pattern.compile("\\d{6}");

    private static final HexFormat HEX_FORMAT = HexFormat.of();

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.admin.verification-email}")
    private String developerVerificationEmail;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserSessionRepository userSessionRepository;
    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Override
    public RegisterResponseDTO register(RegisterRequestDTO request) {
        String email = normalizeEmail(request.getEmail());

        validateRegistrationRequest(request);

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Email is already registered."
            );
        }

        String registrationKey = REG_PREFIX + email;
        String otpKey = OTP_PREFIX + email;
        String adminOtpKey = ADMIN_OTP_PREFIX + email;
        String emailVerifiedKey = EMAIL_VERIFIED_PREFIX + email;

        if (Boolean.TRUE.equals(redisTemplate.hasKey(registrationKey))) {
            throw new IllegalArgumentException(
                    "Registration already initiated. Please verify your email."
            );
        }

        String emailOtp = generateOtp();

        PendingRegistration pending = new PendingRegistration(
                request.getName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getRole()
        );

        try {
            String registrationJson =
                    objectMapper.writeValueAsString(pending);

            redisTemplate.opsForValue().set(
                    registrationKey, registrationJson, REGISTRATION_TTL
            );

            redisTemplate.opsForValue().set(
                    otpKey, hashOtp(emailOtp), REGISTRATION_TTL
            );

            sendOtpEmail(email, emailOtp);

            if (request.getRole() == Role.ADMIN) {
                String adminOtp = generateOtp();

                redisTemplate.opsForValue().set(
                        adminOtpKey, hashOtp(adminOtp), REGISTRATION_TTL
                );

                sendAdminVerificationEmail(
                        pending.name, email, adminOtp
                );
            }

            return RegisterResponseDTO.builder()
                    .message("OTP sent. Please verify your email.")
                    .email(email)
                    .expiresInMinutes(15)
                    .build();

        } catch (Exception exception) {
            redisTemplate.delete(registrationKey);
            redisTemplate.delete(otpKey);
            redisTemplate.delete(adminOtpKey);
            redisTemplate.delete(emailVerifiedKey);

            throw new IllegalStateException(
                    "Registration failed. Please try again.", exception
            );
        }
    }

    @Override
    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        RefreshToken storedToken = refreshTokenRepository
                .findByToken(hashRefreshToken(rawToken))
                .orElse(null);

        if (storedToken == null) {
            return;
        }

        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        userSessionRepository.findBySessionId(storedToken.getSessionId())
                .ifPresent(session -> {
                    session.setRevoked(true);
                    userSessionRepository.save(session);
                });
    }

    @Override
    @Transactional
    public String verifyEmail(String email, String otp) {
        email = normalizeEmail(email);
        validateOtp(otp, "Invalid OTP.");

        String registrationKey = REG_PREFIX + email;
        String otpKey = OTP_PREFIX + email;

        String registrationJson =
                redisTemplate.opsForValue().get(registrationKey);

        String storedOtpHash =
                redisTemplate.opsForValue().get(otpKey);

        if (registrationJson == null || storedOtpHash == null) {
            throw new IllegalArgumentException(
                    "OTP expired or registration not found. Please register again."
            );
        }

        if (!MessageDigest.isEqual(
                storedOtpHash.getBytes(StandardCharsets.UTF_8),
                hashOtp(otp).getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid OTP.");
        }

        try {
            PendingRegistration pending = objectMapper.readValue(
                    registrationJson, PendingRegistration.class
            );

            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException(
                        "Email is already registered."
                );
            }

            if (pending.role == Role.ADMIN) {
                redisTemplate.opsForValue().set(
                        EMAIL_VERIFIED_PREFIX + email,
                        "true",
                        REGISTRATION_TTL
                );

                return "Email OTP verified. Developer verification is required.";
            }

            User user = createVerifiedUser(pending, pending.role);
            userRepository.saveAndFlush(user);

            registerCleanupAfterCommit(
                    registrationKey, otpKey, null, null
            );

            return "Email verified and registration completed.";

        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException(
                    "Email is already registered.", exception
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Unable to read pending registration data.", exception
            );
        }
    }

    @Override
    public String resendVerificationEmail(String email) {
        email = normalizeEmail(email);

        String registrationKey = REG_PREFIX + email;
        String otpKey = OTP_PREFIX + email;

        String registrationJson =
                redisTemplate.opsForValue().get(registrationKey);

        if (registrationJson == null) {
            throw new IllegalArgumentException(
                    "Registration expired. Please register again."
            );
        }

        if (userRepository.existsByEmail(email)) {
            redisTemplate.delete(registrationKey);
            redisTemplate.delete(otpKey);

            throw new IllegalArgumentException(
                    "Email is already registered."
            );
        }

        String otp = generateOtp();
        System.out.println("otp" + otp);

        redisTemplate.opsForValue().set(
                otpKey, hashOtp(otp), REGISTRATION_TTL
        );

        redisTemplate.expire(registrationKey, REGISTRATION_TTL);

        try {
            sendOtpEmail(email, otp);
            return "Verification OTP resent successfully.";

        } catch (Exception exception) {
            redisTemplate.delete(otpKey);

            throw new IllegalStateException(
                    "Unable to resend OTP. Please try again.", exception
            );
        }
    }

    @Override
    @Transactional
    public boolean verifyAdminOtp(String email, String enteredOtp) {
        email = normalizeEmail(email);
        validateOtp(enteredOtp, "Invalid developer OTP.");

        String registrationKey = REG_PREFIX + email;
        String emailOtpKey = OTP_PREFIX + email;
        String adminOtpKey = ADMIN_OTP_PREFIX + email;
        String emailVerifiedKey = EMAIL_VERIFIED_PREFIX + email;

        String registrationJson =
                redisTemplate.opsForValue().get(registrationKey);

        if (registrationJson == null) {
            throw new IllegalArgumentException(
                    "Registration expired. Please register again."
            );
        }

        String emailVerified =
                redisTemplate.opsForValue().get(emailVerifiedKey);

        if (!"true".equals(emailVerified)) {
            throw new IllegalArgumentException(
                    "Please verify the email OTP first."
            );
        }

        String storedAdminOtpHash =
                redisTemplate.opsForValue().get(adminOtpKey);

        if (storedAdminOtpHash == null) {
            throw new IllegalArgumentException(
                    "Developer OTP expired or not found. Please register again."
            );
        }

        if (!MessageDigest.isEqual(
                storedAdminOtpHash.getBytes(StandardCharsets.UTF_8),
                hashOtp(enteredOtp).getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException(
                    "Invalid developer OTP."
            );
        }

        try {
            PendingRegistration pending = objectMapper.readValue(
                    registrationJson, PendingRegistration.class
            );

            if (pending.role != Role.ADMIN) {
                throw new IllegalArgumentException(
                        "This verification is only for Admin registration."
                );
            }

            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException(
                        "Email is already registered."
                );
            }

            User user = createVerifiedUser(pending, Role.ADMIN);
            userRepository.saveAndFlush(user);

            registerCleanupAfterCommit(
                    registrationKey,
                    emailOtpKey,
                    adminOtpKey,
                    emailVerifiedKey
            );

            return true;

        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException(
                    "Email is already registered.", exception
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Unable to read pending registration data.", exception
            );
        }
    }

    @Override
    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        String email = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException(
                    "Please verify your email before logging in.");
        }

        UserDetails userDetails = createUserDetails(user);
        String sessionId = UUID.randomUUID().toString();

        LocalDateTime now = LocalDateTime.now();

        UserSession userSession = UserSession.builder()
                .sessionId(sessionId)
                .user(user)
                .expiryTime(now.plusDays(7))
                .revoked(false)
                .build();

        userSessionRepository.save(userSession);

        String accessToken = jwtService.generateToken(userDetails, sessionId);
        String refreshToken =
                jwtService.generateRefreshToken(userDetails, sessionId);

        RefreshToken storedToken = RefreshToken.builder()
                .token(hashRefreshToken(refreshToken))
                .user(user)
                .sessionId(sessionId)
                .expiryDate(Instant.now().plusSeconds(7 * 24 * 60 * 60L))
                .revoked(false)
                .build();

        refreshTokenRepository.save(storedToken);

        return LoginResponseDTO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional
    public LoginResponseDTO refreshToken(RefreshTokenRequestDTO request) {
        String rawToken = request.getRefreshToken();

        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token is required.");
        }

        final String email;
        final String sessionId;

        try {
            email = normalizeEmail(jwtService.extractUsername(rawToken));
            sessionId = jwtService.extractSessionId(rawToken);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid refresh token.");
        }

        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("Invalid refresh token.");
        }

        RefreshToken storedToken = refreshTokenRepository
                .findByToken(hashRefreshToken(rawToken))
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Refresh token is invalid or revoked."));

        Instant now = Instant.now();

        if (storedToken.isRevoked()
                || !storedToken.getExpiryDate().isAfter(now)
                || !sessionId.equals(storedToken.getSessionId())) {
            throw new IllegalArgumentException(
                    "Refresh token is expired or revoked.");
        }

        UserSession userSession = userSessionRepository
                .findBySessionId(sessionId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Session is not valid."));

        if (userSession.isRevoked()
                || !userSession.getExpiryTime().isAfter(LocalDateTime.now())
                || !email.equalsIgnoreCase(userSession.getUser().getEmail())
                || !email.equalsIgnoreCase(storedToken.getUser().getEmail())) {
            throw new IllegalArgumentException("Session is expired or revoked.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found."));

        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("Email verification is required.");
        }

        UserDetails userDetails = createUserDetails(user);

        if (!jwtService.isRefreshTokenValid(rawToken, userDetails)) {
            throw new IllegalArgumentException(
                    "Refresh token is expired or invalid.");
        }

        // Rotate: old token cannot be reused.
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        String newAccessToken =
                jwtService.generateToken(userDetails, sessionId);
        String newRefreshToken =
                jwtService.generateRefreshToken(userDetails, sessionId);

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .token(hashRefreshToken(newRefreshToken))
                        .user(user)
                        .sessionId(sessionId)
                        .expiryDate(Instant.now().plusSeconds(7 * 24 * 60 * 60L))
                        .revoked(false)
                        .build()
        );

        userSession.setExpiryTime(LocalDateTime.now().plusDays(7));
        userSessionRepository.save(userSession);

        return LoginResponseDTO.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(900)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private void validateRegistrationRequest(
            RegisterRequestDTO request) {

        if (request.getRole() == null
                || (request.getRole() != Role.STUDENT
                && request.getRole() != Role.ADMIN)) {
            throw new IllegalArgumentException("Invalid role.");
        }

        if (request.getName() == null
                || request.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required.");
        }

        if (request.getPassword() == null
                || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required.");
        }
    }

    private void validateOtp(String otp, String errorMessage) {
        if (otp == null || !OTP_PATTERN.matcher(otp).matches()) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private User createVerifiedUser(
            PendingRegistration pending, Role role) {

        User user = new User();
        user.setName(pending.name);
        user.setEmail(pending.email);
        user.setPassword(pending.password);
        user.setRole(role);
        user.setEmailVerified(true);

        return user;
    }

    private UserDetails createUserDetails(User user) {
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();
    }

    private void sendAdminVerificationEmail(
            String adminName, String adminEmail, String adminOtp) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(developerVerificationEmail);
        message.setSubject("StudyBuddy Admin Registration Approval");

        message.setText(
                "Hello Developer,\n\n"
                        + "A new Admin registration requires verification.\n\n"
                        + "Name: " + adminName + "\n"
                        + "Registration Email: " + adminEmail + "\n\n"
                        + "Developer verification OTP: " + adminOtp + "\n\n"
                        + "This OTP expires in 15 minutes.\n"
                        + "If you did not expect this request, ignore this email."
        );

        mailSender.send(message);
    }

    private void sendOtpEmail(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("StudyBuddy Email Verification");

        message.setText(
                "Your StudyBuddy verification OTP is: " + otp
                        + "\n\nThis OTP expires in 15 minutes."
                        + "\nIf you did not initiate this registration, ignore this email."
        );

        mailSender.send(message);
    }

    private void registerCleanupAfterCommit(
            String registrationKey,
            String emailOtpKey,
            String adminOtpKey,
            String emailVerifiedKey) {

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        redisTemplate.delete(registrationKey);
                        redisTemplate.delete(emailOtpKey);

                        if (adminOtpKey != null) {
                            redisTemplate.delete(adminOtpKey);
                        }

                        if (emailVerifiedKey != null) {
                            redisTemplate.delete(emailVerifiedKey);
                        }
                    }
                }
        );
    }

    private String generateOtp() {
        return String.format(
                Locale.ROOT,
                "%06d",
                SECURE_RANDOM.nextInt(1_000_000)
        );
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            return HEX_FORMAT.formatHex(
                    digest.digest(otp.getBytes(StandardCharsets.UTF_8))
            );
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "Unable to process OTP.", exception
            );
        }
    }

    private String hashRefreshToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "Unable to process refresh token.", exception);
        }
    }

    public static class PendingRegistration {

        public String name;
        public String email;
        public String password;
        public Role role;

        public PendingRegistration() {
        }

        public PendingRegistration(
                String name,
                String email,
                String password,
                Role role) {
            this.name = name;
            this.email = email;
            this.password = password;
            this.role = role;
        }
    }
}
