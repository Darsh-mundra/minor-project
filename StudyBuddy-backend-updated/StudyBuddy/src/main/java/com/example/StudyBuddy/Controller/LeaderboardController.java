package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Response.LeaderboardPageResponseDto;
import com.example.StudyBuddy.DTO.Response.UserRankResponseDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<LeaderboardPageResponseDto> getLeaderboard(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int clampedSize = Math.min(Math.max(size, 1), 100);
        int clampedPage = Math.max(page, 0);

        LeaderboardPageResponseDto response = leaderboardService.getGlobalLeaderboard(categoryId, startDate, endDate, clampedPage, clampedSize);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-rank")
    public ResponseEntity<UserRankResponseDto> getMyRank(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        UserRankResponseDto response = leaderboardService.getStudentRank(currentUser.getId(), categoryId, startDate, endDate);
        return ResponseEntity.ok(response);
    }
}
