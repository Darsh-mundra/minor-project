package com.example.StudyBuddy.Service;


import com.example.StudyBuddy.DTO.Response.LeaderboardPageResponseDto;
import com.example.StudyBuddy.DTO.Response.UserRankResponseDto;

import java.time.LocalDateTime;

public interface LeaderboardService {

    /**
     * Retrieves the global ranked student leaderboard with pagination and optional filters.
     */
    LeaderboardPageResponseDto getGlobalLeaderboard(
            Long categoryId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            int page,
            int size
    );

    /**
     * Retrieves the specific rank and performance statistics for a given student.
     */
    UserRankResponseDto getStudentRank(
            Long userId,
            Long categoryId,
            LocalDateTime startDate,
            LocalDateTime endDate
    );
}
