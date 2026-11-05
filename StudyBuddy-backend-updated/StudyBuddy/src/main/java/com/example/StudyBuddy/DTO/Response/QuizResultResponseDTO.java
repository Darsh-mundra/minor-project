package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.QuizDifficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResultResponseDTO {
    private Long attemptId;
    private String subject;
    private String topic;
    private QuizDifficulty difficulty;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer incorrectAnswers;
    private Integer unansweredQuestions;
    private Integer score;
    private Double percentage;
    private LocalDateTime completedAt;
    private List<QuizAnswerDetailDTO> answerDetails;
}