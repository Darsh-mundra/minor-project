package com.example.StudyBuddy.DTO.Response;

import java.util.List;

public record AiFlashcardListResponse(List<AiCardItem> flashcards) {
    public record AiCardItem(String question, String answer) {}
}