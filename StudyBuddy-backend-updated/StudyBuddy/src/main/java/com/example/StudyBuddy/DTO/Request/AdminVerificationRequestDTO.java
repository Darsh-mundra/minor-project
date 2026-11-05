package com.example.StudyBuddy.DTO.Request;

import jakarta.persistence.Column;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminVerificationRequestDTO {

    @NotBlank
    @Email
    String email;

    @NotBlank
    @Column(nullable = false)
    String otp;
}
