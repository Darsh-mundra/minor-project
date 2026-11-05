package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.DTO.Request.LeaderboardEntryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardPageResponseDto {
    private List<LeaderboardEntryDto> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;
}