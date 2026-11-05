package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Request.QuizGenerateRequestDTO;
import com.example.StudyBuddy.DTO.Response.QuizHistoryItemDTO;
import com.example.StudyBuddy.DTO.Response.StudentResultSummaryDTO;
import com.example.StudyBuddy.Enum.QuizDifficulty;
import com.example.StudyBuddy.Service.GeminiQuizService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gemini-quizzes")
@RequiredArgsConstructor
public class GeminiQuizController {

    private final GeminiQuizService geminiQuizService;

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getName() != null;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateQuiz(
            Authentication authentication,
            @Valid @RequestBody QuizGenerateRequestDTO requestDTO) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(
                geminiQuizService.generateQuizQuestions(
                        authentication.getName(),
                        requestDTO
                )
        );
    }

    @GetMapping("/history")
    public ResponseEntity<?> getQuizHistory(
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<QuizHistoryItemDTO> history =
                geminiQuizService.getQuizHistory(authentication.getName());

        return ResponseEntity.ok(history);
    }

    @GetMapping("/history/{quizId}")
    public ResponseEntity<?> getQuizHistoryById(
            Authentication authentication,
            @PathVariable Long quizId) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            QuizHistoryItemDTO history =
                    geminiQuizService.getQuizHistoryById(
                            authentication.getName(), quizId);

            return ResponseEntity.ok(history);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{quizId}/questions")
    public ResponseEntity<?> getQuizQuestions(
            Authentication authentication,
            @PathVariable Long quizId) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            return ResponseEntity.ok(
                    geminiQuizService.getQuizQuestions(
                            authentication.getName(), quizId)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{quizId}/submit")
    public ResponseEntity<?> submitQuiz(
            Authentication authentication,
            @PathVariable Long quizId,
            @RequestBody Map<String, String> answers) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            return ResponseEntity.ok(
                    geminiQuizService.submitQuiz(
                            authentication.getName(), quizId, answers)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/results/student/{attemptId}")
    public ResponseEntity<QuizHistoryItemDTO> getStudentResult(
            Authentication authentication,
            @PathVariable Long attemptId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(geminiQuizService.getStudentQuizResult(email, attemptId));
    }

    @GetMapping("/results/teacher")
    public ResponseEntity<List<StudentResultSummaryDTO>> getTeacherQuizResults(
            Authentication authentication,
            @RequestParam String subject,
            @RequestParam String topic,
            @RequestParam QuizDifficulty difficulty
    ) {
        String teacherEmail = authentication.getName();
        List<StudentResultSummaryDTO> results = geminiQuizService.getTeacherQuizResultsForTopic(
                teacherEmail, subject, topic, difficulty
        );
        return ResponseEntity.ok(results);
    }
}