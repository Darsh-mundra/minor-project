package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Response.DeckResponseDto;
import com.example.StudyBuddy.DTO.Response.FlashcardResponseDto;
import com.example.StudyBuddy.DTO.Request.GenerateFlashcardsRequest;
import com.example.StudyBuddy.Enum.FlashcardStatus;

import java.util.List;

public interface FlashcardService {

    DeckResponseDto generateAndSaveFlashcards(Long userId, GenerateFlashcardsRequest request);

    List<DeckResponseDto> getUserDecks(Long userId);

    DeckResponseDto getDeckById(Long userId, Long deckId);

    FlashcardResponseDto updateFlashcardStatus(Long userId, Long cardId, FlashcardStatus newStatus);
}