package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.Subject;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class DeckResponseDto {
    private Long id;
    private Subject subject;
    private String syllabus;
    private LocalDateTime createdAt;
    private List<FlashcardResponseDto> flashcards;
}