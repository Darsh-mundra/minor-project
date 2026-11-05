package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.QuizAttemptStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class StudentResultSummaryDTO {
    private Long userId;
    private String studentName;
    private String studentEmail;
    private int score;
    private int totalQuestions;
    private double percentage;
    private QuizAttemptStatus status;
    private LocalDateTime completedAt;
}