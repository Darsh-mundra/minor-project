package com.example.StudyBuddy.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequestDTO {

    @NotBlank
    private String resetToken;

    @NotBlank
    @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
    private String newPassword;
}