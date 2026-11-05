package com.example.StudyBuddy.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RequestCreateRequestDTO {
    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    @NotBlank(message = "Subject is required")
    @Size(max = 100, message = "Subject cannot exceed 100 characters")
    private String subject;

    @NotBlank(message = "Unit is required")
    @Size(max = 100, message = "Unit cannot exceed 100 characters")
    private String unit;

    @NotBlank(message = "Detail is required")
    private String detail;

}