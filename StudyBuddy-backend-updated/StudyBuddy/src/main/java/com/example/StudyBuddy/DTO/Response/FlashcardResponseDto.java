package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.FlashcardStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FlashcardResponseDto {
    private Long id;
    private String question;
    private String answer;
    private FlashcardStatus status;
}