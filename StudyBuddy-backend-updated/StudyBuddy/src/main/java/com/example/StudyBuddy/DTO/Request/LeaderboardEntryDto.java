package com.example.StudyBuddy.DTO.Request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {
    private Long rank;
    private Long userId;
    private String displayName;
    private long totalCompletedQuizzes;
    private double totalEarnedPoints;
    private double totalPossiblePoints;
    private double accuracyPercentage;
    private long totalCorrectAnswers;
}