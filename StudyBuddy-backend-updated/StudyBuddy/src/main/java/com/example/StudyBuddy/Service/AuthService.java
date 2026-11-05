package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Request.LoginRequestDTO;
import com.example.StudyBuddy.DTO.Request.RefreshTokenRequestDTO;
import com.example.StudyBuddy.DTO.Request.RegisterRequestDTO;
import com.example.StudyBuddy.DTO.Response.LoginResponseDTO;
import com.example.StudyBuddy.DTO.Response.RegisterResponseDTO;

public interface AuthService {

    RegisterResponseDTO register(RegisterRequestDTO request);

    String verifyEmail(String email, String otp);

    String resendVerificationEmail(String email);

    LoginResponseDTO login(LoginRequestDTO request);

    LoginResponseDTO refreshToken(RefreshTokenRequestDTO request);

    boolean verifyAdminOtp(String email, String enteredOtp);

    void logout(String refreshToken);
}