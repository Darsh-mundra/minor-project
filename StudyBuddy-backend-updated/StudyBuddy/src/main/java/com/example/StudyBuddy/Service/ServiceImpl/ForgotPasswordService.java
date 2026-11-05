package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Repository.UserRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(10);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_OTP_ATTEMPTS = 5;

    public ForgotPasswordService(
            UserRepository userRepository,
            StringRedisTemplate redisTemplate,
            JavaMailSender mailSender,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    public String forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);
        String emailKey = hash(normalizedEmail);

        // Rate-limit OTP requests for each email.
        Boolean allowed = redisTemplate.opsForValue().setIfAbsent(
                "forgot:cooldown:" + emailKey,
                "1",
                RESEND_COOLDOWN
        );

        if (!Boolean.TRUE.equals(allowed)) {
            return "If the email is registered, an OTP will be sent.";
        }

        User user = userRepository.findByEmail(normalizedEmail).orElse(null);

        // Do not reveal whether an email is registered.
        if (user == null) {
            return "If the email is registered, an OTP will be sent.";
        }

        String otp = String.format(
                Locale.ROOT, "%06d", secureRandom.nextInt(1_000_000)
        );

        String otpKey = "forgot:otp:" + emailKey;
        String attemptsKey = "forgot:attempts:" + emailKey;

        // Store a hash of the OTP, not the raw OTP.
        redisTemplate.opsForValue().set(otpKey, hash(otp), OTP_TTL);
        redisTemplate.opsForValue().set(
                attemptsKey, "0", OTP_TTL
        );

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("StudyBuddy - Password Reset OTP");
            message.setText(
                    "Your StudyBuddy password reset OTP is: " + otp
                            + "\n\nThis OTP expires in 5 minutes."
                            + "\nIf you did not request this, ignore this email."
            );

            mailSender.send(message);
        } catch (RuntimeException ex) {
            redisTemplate.delete(otpKey);
            redisTemplate.delete(attemptsKey);
            redisTemplate.delete("forgot:cooldown:" + emailKey);
            throw new IllegalStateException(
                    "Unable to send OTP email. Check SMTP configuration.", ex
            );
        }

        return "If the email is registered, an OTP will be sent.";
    }

    public String verifyOtp(String email, String otp) {
        String emailKey = hash(normalizeEmail(email));
        String otpKey = "forgot:otp:" + emailKey;
        String attemptsKey = "forgot:attempts:" + emailKey;

        String storedOtpHash = redisTemplate.opsForValue().get(otpKey);

        if (storedOtpHash == null) {
            throw new IllegalArgumentException(
                    "OTP expired or invalid. Request a new OTP."
            );
        }

        Long attempts = redisTemplate.opsForValue().increment(attemptsKey);

        if (attempts == null || attempts > MAX_OTP_ATTEMPTS) {
            redisTemplate.delete(otpKey);
            redisTemplate.delete(attemptsKey);
            throw new IllegalArgumentException(
                    "Too many OTP attempts. Request a new OTP."
            );
        }

        if (!MessageDigest.isEqual(
                storedOtpHash.getBytes(StandardCharsets.UTF_8),
                hash(otp).getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid OTP.");
        }

        // OTP can only be used once.
        redisTemplate.delete(otpKey);
        redisTemplate.delete(attemptsKey);

        String resetToken = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                "forgot:reset:" + resetToken,
                normalizeEmail(email),
                RESET_TOKEN_TTL
        );

        return resetToken;
    }

    public String resetPassword(String resetToken, String newPassword) {
        if (resetToken == null || resetToken.isBlank()) {
            throw new IllegalArgumentException("Reset token is required.");
        }

        String tokenKey = "forgot:reset:" + resetToken;
        String email = redisTemplate.opsForValue().get(tokenKey);

        if (email == null) {
            throw new IllegalArgumentException(
                    "Reset token expired or invalid. Verify OTP again."
            );
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("Unable to reset password."));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Token is single-use.
        redisTemplate.delete(tokenKey);

        return "Password reset successfully. Please log in.";
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash value.", ex);
        }
    }
}