package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.QuizDifficulty;
import com.example.StudyBuddy.Enum.QuizAttemptStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizHistoryItemDTO {
    private Long attemptId;
    private String subject;
    private String topic;
    private QuizDifficulty difficulty;
    private Integer questionCount;
    private Integer correctAnswers;
    private Integer incorrectAnswers;
    private Integer unansweredQuestions;
    private Integer score;
    private Double percentage;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private QuizAttemptStatus status;
}