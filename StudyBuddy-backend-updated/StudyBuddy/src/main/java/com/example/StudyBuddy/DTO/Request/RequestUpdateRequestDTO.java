package com.example.StudyBuddy.DTO.Request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RequestUpdateRequestDTO {
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;
    @Size(max = 100, message = "Subject cannot exceed 100 characters")
    private String subject;
    @Size(max = 100, message = "Unit cannot exceed 100 characters")
    private String unit;
    private String detail;
}