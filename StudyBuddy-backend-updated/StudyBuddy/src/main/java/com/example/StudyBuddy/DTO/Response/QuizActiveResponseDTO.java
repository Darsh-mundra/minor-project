package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.QuizDifficulty;
import com.example.StudyBuddy.Enum.QuizAttemptStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizActiveResponseDTO {
    private Long attemptId;
    private String subject;
    private String topic;
    private QuizDifficulty difficulty;
    private Integer questionCount;
    private QuizAttemptStatus status;
    private List<QuizQuestionResponseDTO> questions;
}