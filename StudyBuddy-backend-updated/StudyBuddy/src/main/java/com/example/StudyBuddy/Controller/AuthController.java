package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Request.*;
import com.example.StudyBuddy.DTO.Response.LoginResponseDTO;
import com.example.StudyBuddy.DTO.Response.RegisterResponseDTO;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.AuthService;
import com.example.StudyBuddy.Service.ForgotPasswordService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final ForgotPasswordService forgotPasswordService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request) {
        RegisterResponseDTO response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(
            @RequestParam String email,
            @RequestParam String otp) {
        String message = authService.verifyEmail(email, otp);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request,
            HttpSession session) {
        LoginResponseDTO response = authService.login(request);
        session.setAttribute("LOGGED_IN_USER_EMAIL", request.getEmail());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "Not signed in. Please login."
                    ));
        }

        return userRepository.findByEmail(authentication.getName())
                .<ResponseEntity<?>>map(user ->
                        ResponseEntity.ok(Map.of(
                                "id", user.getId(),
                                "fullName", user.getName(),
                                "email", user.getEmail(),
                                "role", user.getRole().name()
                        ))
                )
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("message", "User not found."))
                );
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<LoginResponseDTO> refreshToken(
            @Valid @RequestBody RefreshTokenRequestDTO request) {

        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendVerification(
            @RequestParam String email) {

        return ResponseEntity.ok(
                authService.resendVerificationEmail(email)
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO request) {

        try {
            String message = forgotPasswordService.forgotPassword(
                    request.getEmail()
            );

            return ResponseEntity.ok(Map.of("message", message));

        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message", "Unable to send email right now."
                    ));
        }
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<?> verifyOtp(
            @Valid @RequestBody VerifyResetOtpRequestDTO request) {

        try {
            String resetToken = forgotPasswordService.verifyOtp(
                    request.getEmail(),
                    request.getOtp()
            );

            return ResponseEntity.ok(Map.of(
                    "message", "OTP verified successfully.",
                    "resetToken", resetToken
            ));

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDTO request) {

        try {
            String message = forgotPasswordService.resetPassword(
                    request.getResetToken(),
                    request.getNewPassword()
            );

            return ResponseEntity.ok(Map.of("message", message));

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/verify-admin-otp")
    public ResponseEntity<Map<String, String>> verifyAdminOtp(
            @Valid @RequestBody AdminVerificationRequestDTO request) {

        boolean verified = authService.verifyAdminOtp(
                request.getEmail(),
                request.getOtp()
        );
        if (!verified) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message", "Admin verification failed."
                    ));
        }
        return ResponseEntity.ok(
                Map.of("message",
                        "Admin verification completed successfully.")
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody(required = false) RefreshTokenRequestDTO request,
            HttpSession session) {

        authService.logout(
                request == null ? null : request.getRefreshToken()
        );

        session.invalidate();

        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully.")
        );
    }
}
