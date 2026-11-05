package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Request.LeaderboardEntryDto;
import com.example.StudyBuddy.DTO.Response.LeaderboardPageResponseDto;
import com.example.StudyBuddy.DTO.Response.UserRankResponseDto;
import com.example.StudyBuddy.Projection.QuizAttemptAggregationProjection;
import com.example.StudyBuddy.Repository.LeaderboardRepository;
import com.example.StudyBuddy.Service.LeaderboardService;
import com.example.StudyBuddy.Util.LeaderboardRankingCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardServiceImpl implements LeaderboardService {

    private final LeaderboardRepository leaderboardRepository;
    private final LeaderboardRankingCalculator rankingCalculator;

    @Transactional(readOnly = true)
    public LeaderboardPageResponseDto getGlobalLeaderboard(Long categoryId, LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        List<QuizAttemptAggregationProjection> raw = leaderboardRepository.aggregateStudentPerformance(categoryId, startDate, endDate);
        List<LeaderboardEntryDto> rankedEntries = rankingCalculator.computeRanks(raw);

        int totalElements = rankedEntries.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int start = Math.min(page * size, totalElements);
        int end = Math.min(start + size, totalElements);

        List<LeaderboardEntryDto> pagedContent = rankedEntries.subList(start, end);

        return LeaderboardPageResponseDto.builder()
                .content(pagedContent)
                .pageNumber(page)
                .pageSize(size)
                .totalElements(totalElements)
                .totalPages(totalPages == 0 ? 1 : totalPages)
                .last(end >= totalElements)
                .build();
    }

    @Transactional(readOnly = true)
    public UserRankResponseDto getStudentRank(Long userId, Long categoryId, LocalDateTime startDate, LocalDateTime endDate) {
        List<QuizAttemptAggregationProjection> raw = leaderboardRepository.aggregateStudentPerformance(categoryId, startDate, endDate);
        List<LeaderboardEntryDto> rankedEntries = rankingCalculator.computeRanks(raw);

        LeaderboardEntryDto userEntry = rankedEntries.stream()
                .filter(e -> e.getUserId().equals(userId))
                .findFirst()
                .orElse(null);

        if (userEntry == null) {
            return UserRankResponseDto.builder()
                    .userId(userId)
                    .ranked(false)
                    .rank(null)
                    .totalCompletedQuizzes(0)
                    .totalEarnedPoints(0.0)
                    .totalPossiblePoints(0.0)
                    .accuracyPercentage(0.0)
                    .totalCorrectAnswers(0)
                    .message("You have no completed AI quiz attempts yet. Complete a quiz to join the leaderboard!")
                    .build();
        }

        return UserRankResponseDto.builder()
                .userId(userEntry.getUserId())
                .displayName(userEntry.getDisplayName())
                .ranked(true)
                .rank(userEntry.getRank())
                .totalCompletedQuizzes(userEntry.getTotalCompletedQuizzes())
                .totalEarnedPoints(userEntry.getTotalEarnedPoints())
                .totalPossiblePoints(userEntry.getTotalPossiblePoints())
                .accuracyPercentage(userEntry.getAccuracyPercentage())
                .totalCorrectAnswers(userEntry.getTotalCorrectAnswers())
                .message("Successfully retrieved your leaderboard ranking.")
                .build();
    }
}
