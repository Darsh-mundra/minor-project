package com.example.StudyBuddy.DTO.Request;

import com.example.StudyBuddy.Enum.Subject;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceCreateRequestDto {

    @NotBlank(message = "Workspace name is required.")
    @Size(max = 150, message = "Workspace name must not exceed 150 characters.")
    private String name;

    @Size(max = 1000, message = "Description must not exceed 1000 characters.")
    private String description;

    @NotNull(message = "Subject is required.")
    private Subject subject;

    @NotNull(message = "Exam date is required.")
    @FutureOrPresent(message = "Exam date must be in the present or future.")
    private LocalDate examDate;

    @NotNull(message = "Expiry date is required.")
    @Future(message = "Expiry date must be in the future.")
    private LocalDate expiryDate;

    @NotNull(message = "Maximum members count is required.")
    @Min(value = 2, message = "Maximum members must be at least 2.")
    @Max(value = 50, message = "Maximum members cannot exceed 50.")
    private Integer maxMembers;
}