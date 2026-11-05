
package com.example.StudyBuddy.Security;

import com.example.StudyBuddy.Entity.RefreshToken;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.UserSession;
import com.example.StudyBuddy.Enum.Role;
import com.example.StudyBuddy.Repository.RefreshTokenRepository;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Repository.UserSessionRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler
        extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        if (!(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
            redirectWithError(request, response, "oauth_login_failed");
            return;
        }

        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        Boolean emailVerified =
                oauth2User.getAttribute("email_verified");

        // Fail closed if Google does not confirm the email.
        if (email == null
                || email.isBlank()
                || !Boolean.TRUE.equals(emailVerified)) {
            redirectWithError(
                    request, response, "unverified_google_email");
            return;
        }

        email = email.trim().toLowerCase(Locale.ROOT);

        // Find an existing account or create a new STUDENT account.
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setName(
                    name != null && !name.isBlank()
                            ? name.trim()
                            : email.substring(0, email.indexOf('@'))
            );
            user.setRole(Role.STUDENT);

            // User.password is non-nullable in the existing entity.
            // Store only a BCrypt hash, never a plaintext password.
            user.setPassword(
                    passwordEncoder.encode(UUID.randomUUID().toString())
            );
        }

        // Google has verified ownership of this email.
        user.setEmailVerified(true);
        user = userRepository.saveAndFlush(user);

        // Match the UserDetails format used by AuthServiceImpl.
        UserDetails userDetails =
                org.springframework.security.core.userdetails.User
                        .withUsername(user.getEmail())
                        .password(user.getPassword())
                        .authorities("ROLE_" + user.getRole().name())
                        .build();

        // Create a persisted session, as in the normal login flow.
        String sessionId = UUID.randomUUID().toString();

        UserSession userSession = UserSession.builder()
                .sessionId(sessionId)
                .user(user)
                .expiryTime(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        userSessionRepository.save(userSession);

        String accessToken =
                jwtService.generateToken(userDetails, sessionId);

        String refreshToken =
                jwtService.generateRefreshToken(userDetails, sessionId);

        // Store only the refresh-token hash in the database.
        RefreshToken storedToken = RefreshToken.builder()
                .token(hashRefreshToken(refreshToken))
                .user(user)
                .sessionId(sessionId)
                .expiryDate(
                        Instant.now().plusSeconds(7 * 24 * 60 * 60L))
                .revoked(false)
                .build();

        refreshTokenRepository.save(storedToken);

        clearAuthenticationAttributes(request);

        /*
         * Use the URL fragment instead of query parameters.
         * The frontend must read the fragment and immediately remove it
         * from browser history after extracting the tokens.
         */
        String targetUrl = frontendUrl
                + "/oauth-success#accessToken=" + accessToken
                + "&refreshToken=" + refreshToken;

        getRedirectStrategy().sendRedirect(
                request, response, targetUrl);
    }

    private void redirectWithError(
            HttpServletRequest request,
            HttpServletResponse response,
            String error)
            throws IOException {

        clearAuthenticationAttributes(request);

        String targetUrl = frontendUrl
                + "/login?error=" + error;

        getRedirectStrategy().sendRedirect(
                request, response, targetUrl);
    }

    private String hashRefreshToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "Unable to process refresh token.", exception);
        }
    }
}
