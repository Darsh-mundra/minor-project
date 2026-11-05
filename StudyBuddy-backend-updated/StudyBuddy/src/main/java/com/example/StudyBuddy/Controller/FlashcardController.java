package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.Config.SecurityConfig;
import com.example.StudyBuddy.DTO.Request.GenerateFlashcardsRequest;
import com.example.StudyBuddy.DTO.Request.UpdateCardStatusRequest;
import com.example.StudyBuddy.DTO.Response.DeckResponseDto;
import com.example.StudyBuddy.DTO.Response.FlashcardResponseDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.FlashcardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<DeckResponseDto> generateFlashcards(
            @AuthenticationPrincipal Object principal, // Adapt to your existing security principal type/extractor
            @Valid @RequestBody GenerateFlashcardsRequest request) {

        Long userId = extractUserId(principal);
        DeckResponseDto createdDeck = flashcardService.generateAndSaveFlashcards(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDeck);
    }

    @GetMapping
    public ResponseEntity<List<DeckResponseDto>> getUserDecks(@AuthenticationPrincipal Object principal) {
        Long userId = extractUserId(principal);
        List<DeckResponseDto> decks = flashcardService.getUserDecks(userId);
        return ResponseEntity.ok(decks);
    }

    @GetMapping("/{deckId}")
    public ResponseEntity<DeckResponseDto> getDeckById(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long deckId) {
        Long userId = extractUserId(principal);
        DeckResponseDto deck = flashcardService.getDeckById(userId, deckId);
        return ResponseEntity.ok(deck);
    }

    @PatchMapping("/cards/{cardId}/status")
    public ResponseEntity<FlashcardResponseDto> updateCardStatus(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long cardId,
            @Valid @RequestBody UpdateCardStatusRequest request) {
        Long userId = extractUserId(principal);
        FlashcardResponseDto updatedCard = flashcardService.updateFlashcardStatus(userId, cardId, request.getStatus());
        return ResponseEntity.ok(updatedCard);
    }

    private Long extractUserId(Object principal) {
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .map(User::getId)
                    .orElseThrow(() ->
                            new IllegalStateException("Authenticated user not found."));
        }

        throw new IllegalStateException("Invalid authenticated principal.");
    }
}