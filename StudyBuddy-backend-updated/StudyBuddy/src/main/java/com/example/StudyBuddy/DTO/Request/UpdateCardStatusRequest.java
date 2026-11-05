package com.example.StudyBuddy.DTO.Request;

import com.example.StudyBuddy.Enum.FlashcardStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateCardStatusRequest {
    @NotNull(message = "New status is required")
    private FlashcardStatus status;
}