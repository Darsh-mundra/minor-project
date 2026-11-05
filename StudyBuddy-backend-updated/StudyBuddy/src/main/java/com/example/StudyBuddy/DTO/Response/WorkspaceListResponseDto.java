package com.example.StudyBuddy.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceListResponseDto {
    private List<WorkspaceDetailResponseDto> userWorkspaces;
    private List<WorkspaceDetailResponseDto> exploreWorkspaces;
}