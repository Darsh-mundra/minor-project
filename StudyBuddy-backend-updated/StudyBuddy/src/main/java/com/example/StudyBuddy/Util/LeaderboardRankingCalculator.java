package com.example.StudyBuddy.Util;

import com.example.StudyBuddy.DTO.Request.LeaderboardEntryDto;
import com.example.StudyBuddy.Projection.QuizAttemptAggregationProjection;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class LeaderboardRankingCalculator {

    public List<LeaderboardEntryDto> computeRanks(List<QuizAttemptAggregationProjection> rawProjections) {
        List<LeaderboardEntryDto> entries = new ArrayList<>();

        for (QuizAttemptAggregationProjection p : rawProjections) {
            double earned = p.getTotalEarnedPoints() != null ? p.getTotalEarnedPoints() : 0.0;
            double possible = p.getTotalPossiblePoints() != null ? p.getTotalPossiblePoints() : 0.0;
            double accuracy = possible > 0.0 ? (earned / possible) * 100.0 : 0.0;

            entries.add(LeaderboardEntryDto.builder()
                    .userId(p.getUserId())
                    .displayName(p.getDisplayName() != null ? p.getDisplayName() : "Student_" + p.getUserId())
                    .totalCompletedQuizzes(p.getTotalCompletedQuizzes() != null ? p.getTotalCompletedQuizzes() : 0L)
                    .totalEarnedPoints(earned)
                    .totalPossiblePoints(possible)
                    .accuracyPercentage(Math.round(accuracy * 100.0) / 100.0)
                    .totalCorrectAnswers(p.getTotalCorrectAnswers() != null ? p.getTotalCorrectAnswers() : 0L)
                    .build());
        }

        // Sort by accuracy DESC, earned points DESC, completed quizzes DESC, userId ASC
        entries.sort(Comparator
                .comparingDouble(LeaderboardEntryDto::getAccuracyPercentage).reversed()
                .thenComparing(Comparator.comparingDouble(LeaderboardEntryDto::getTotalEarnedPoints).reversed())
                .thenComparing(Comparator.comparingLong(LeaderboardEntryDto::getTotalCompletedQuizzes).reversed())
                .thenComparing(LeaderboardEntryDto::getUserId)
        );

        // Assign Standard Competition Ranks (1224 tie handling)
        long currentRank = 1;
        for (int i = 0; i < entries.size(); i++) {
            if (i > 0) {
                LeaderboardEntryDto prev = entries.get(i - 1);
                LeaderboardEntryDto curr = entries.get(i);
                boolean isTie = Double.compare(curr.getAccuracyPercentage(), prev.getAccuracyPercentage()) == 0
                        && Double.compare(curr.getTotalEarnedPoints(), prev.getTotalEarnedPoints()) == 0
                        && curr.getTotalCompletedQuizzes() == prev.getTotalCompletedQuizzes();
                if (!isTie) {
                    currentRank = i + 1;
                }
            }
            entries.get(i).setRank(currentRank);
        }

        return entries;
    }
}
