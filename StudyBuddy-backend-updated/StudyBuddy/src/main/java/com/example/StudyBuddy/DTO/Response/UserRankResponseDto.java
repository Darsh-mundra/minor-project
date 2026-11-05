package com.example.StudyBuddy.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRankResponseDto {
    private Long rank; // null if unranked
    private Long userId;
    private String displayName;
    private boolean ranked;
    private long totalCompletedQuizzes;
    private double totalEarnedPoints;
    private double totalPossiblePoints;
    private double accuracyPercentage;
    private long totalCorrectAnswers;
    private String message;
}
