package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Request.GenerateFlashcardsRequest;
import com.example.StudyBuddy.DTO.Response.AiFlashcardListResponse;
import com.example.StudyBuddy.DTO.Response.DeckResponseDto;
import com.example.StudyBuddy.DTO.Response.FlashcardResponseDto;
import com.example.StudyBuddy.Entity.Deck;
import com.example.StudyBuddy.Entity.Flashcard;
import com.example.StudyBuddy.Enum.FlashcardStatus;
import com.example.StudyBuddy.Exception.ResourceNotFoundException;
import com.example.StudyBuddy.Repository.DeckRepository;
import com.example.StudyBuddy.Repository.FlashcardRepository;
import com.example.StudyBuddy.Service.FlashcardService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashcardServiceImpl implements FlashcardService {

    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public DeckResponseDto generateAndSaveFlashcards(Long userId, GenerateFlashcardsRequest request) {
        int targetCount = request.getNumberOfFlashcards().getCount();

        String prompt = String.format(
                """
                You are an expert educator.
                Generate exactly %d unique flashcards for the subject '%s'
                using the following syllabus/topic content:

                %s

                Requirements:
                1. Generate exactly %d flashcards.
                2. Each question must be concise and meaningful.
                3. Each answer must be short, accurate, and useful for revision.
                4. Avoid duplicate questions.
                5. Return only valid JSON without Markdown code fences.
                6. Follow this exact JSON structure:
                {
                  "flashcards": [
                    {
                      "question": "Question text",
                      "answer": "Answer text"
                    }
                  ]
                }
                """,
                targetCount,
                request.getSubject().name(),
                request.getSyllabus(),
                targetCount
        );

        String aiResponseJson;
        try {
            aiResponseJson = chatClient.prompt().user(prompt).call().content();
        } catch (Exception e) {
            log.error("AI provider invocation failed", e);
            throw new IllegalStateException("Failed to generate flashcards from the AI provider.");
        }

        AiFlashcardListResponse aiParsedResult = parseAndValidateAiResponse(aiResponseJson, targetCount);

        Deck deck = Deck.builder()
                .userId(userId)
                .subject(request.getSubject())
                .syllabus(request.getSyllabus())
                .build();

        List<Flashcard> cards = aiParsedResult.flashcards()
                .stream()
                .map(item -> Flashcard.builder()
                        .deck(deck)
                        .question(item.question().trim())
                        .answer(item.answer().trim())
                        .status(FlashcardStatus.UNREVIEWED)
                        .build())
                .toList();

        deck.setFlashcards(cards);
        Deck savedDeck = deckRepository.save(deck);
        return mapToDeckResponseDto(savedDeck);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckResponseDto> getUserDecks(Long userId) {
        return deckRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDeckResponseDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DeckResponseDto getDeckById(Long userId, Long deckId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found or unauthorized access"));
        return mapToDeckResponseDto(deck);
    }

    @Override
    @Transactional
    public FlashcardResponseDto updateFlashcardStatus(Long userId, Long cardId, FlashcardStatus newStatus) {
        if (newStatus == null || (newStatus != FlashcardStatus.MASTERED && newStatus != FlashcardStatus.NEED_REVIEW)) {
            throw new IllegalArgumentException("Status must be MASTERED or NEED_REVIEW.");
        }

        Flashcard card = flashcardRepository.findByIdAndDeckUserId(cardId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found or unauthorized access"));

        if (card.getStatus() != newStatus) {
            card.setStatus(newStatus);
        }

        return FlashcardResponseDto.builder()
                .id(card.getId())
                .question(card.getQuestion())
                .answer(card.getAnswer())
                .status(card.getStatus())
                .build();
    }

    private AiFlashcardListResponse parseAndValidateAiResponse(String jsonContent, int expectedCount) {
        if (jsonContent == null || jsonContent.isBlank()) {
            throw new IllegalStateException("AI returned an empty response.");
        }

        try {
            String cleanedJson = jsonContent.trim()
                    .replaceFirst("(?is)^\\s*```(?:json)?\\s*", "")
                    .replaceFirst("\\s*```\\s*$", "")
                    .trim();

            AiFlashcardListResponse response = objectMapper.readValue(cleanedJson, AiFlashcardListResponse.class);

            if (response == null || response.flashcards() == null || response.flashcards().size() != expectedCount) {
                throw new IllegalStateException("AI must return exactly " + expectedCount + " flashcards.");
            }

            return response;
        } catch (Exception e) {
            log.error("Failed to parse or validate AI-generated flashcards.");
            if (e instanceof IllegalStateException ise) throw ise;
            throw new IllegalStateException("Malformed or invalid response received from the AI generator.", e);
        }
    }

    private DeckResponseDto mapToDeckResponseDto(Deck deck) {
        List<FlashcardResponseDto> cardDtos = deck.getFlashcards()
                .stream()
                .filter(Objects::nonNull)
                .map(card -> FlashcardResponseDto.builder()
                        .id(card.getId())
                        .question(card.getQuestion())
                        .answer(card.getAnswer())
                        .status(card.getStatus())
                        .build())
                .toList();

        return DeckResponseDto.builder()
                .id(deck.getId())
                .subject(deck.getSubject())
                .syllabus(deck.getSyllabus())
                .createdAt(deck.getCreatedAt())
                .flashcards(cardDtos)
                .build();
    }
}