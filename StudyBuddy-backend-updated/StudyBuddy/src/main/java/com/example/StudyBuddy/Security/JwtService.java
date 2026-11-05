package com.example.StudyBuddy.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private static final long ACCESS_EXPIRATION =
            15 * 60 * 1000L;

    private static final long REFRESH_EXPIRATION =
            7 * 24 * 60 * 60 * 1000L;

    private static final String ACCESS_TOKEN = "ACCESS";
    private static final String REFRESH_TOKEN = "REFRESH";

    private final SecretKey signingKey;

    public JwtService(@Value("${jwt.secret}") String secretKey) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "JWT secret must be configured."
            );
        }

        try {
            this.signingKey = Keys.hmacShaKeyFor(
                    secretKey.getBytes(StandardCharsets.UTF_8)
            );
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "JWT secret is too short for the configured signing algorithm.",
                    exception
            );
        }
    }

    public String generateToken(UserDetails userDetails) {
        return buildToken(
                userDetails,
                ACCESS_TOKEN,
                ACCESS_EXPIRATION,
                null
        );
    }

    public String generateToken(
            UserDetails userDetails,
            String sessionId
    ) {
        return buildToken(
                userDetails,
                ACCESS_TOKEN,
                ACCESS_EXPIRATION,
                sessionId
        );
    }

    public String generateRefreshToken(
            UserDetails userDetails,
            String sessionId
    ) {
        return buildToken(
                userDetails,
                REFRESH_TOKEN,
                REFRESH_EXPIRATION,
                sessionId
        );
    }

    private String buildToken(
            UserDetails userDetails,
            String type,
            long expiration,
            String sessionId
    ) {
        if (userDetails == null
                || userDetails.getUsername() == null
                || userDetails.getUsername().isBlank()) {
            throw new IllegalArgumentException(
                    "User details and username must not be empty."
            );
        }

        long now = System.currentTimeMillis();

        var builder = Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("type", type)
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiration));

        if (sessionId != null && !sessionId.isBlank()) {
            builder.claim("sid", sessionId);
        }

        return builder
                .signWith(signingKey)
                .compact();
    }

    public boolean isTokenValid(
            String token,
            UserDetails userDetails
    ) {
        return isValid(token, userDetails, ACCESS_TOKEN);
    }

    public boolean isRefreshTokenValid(
            String token,
            UserDetails userDetails
    ) {
        return isValid(token, userDetails, REFRESH_TOKEN);
    }

    private boolean isValid(
            String token,
            UserDetails userDetails,
            String expectedType
    ) {
        if (token == null || token.isBlank() || userDetails == null) {
            return false;
        }

        try {
            Claims claims = extractAllClaims(token);

            return expectedType.equals(
                    claims.get("type", String.class)
            )
                    && userDetails.getUsername() != null
                    && userDetails.getUsername().equals(
                    claims.getSubject()
            )
                    && claims.getExpiration() != null
                    && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractSessionId(String token) {
        return extractAllClaims(token).get("sid", String.class);
    }

    private Claims extractAllClaims(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException(
                    "JWT token must not be empty."
            );
        }

        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
