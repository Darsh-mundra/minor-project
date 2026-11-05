package com.example.StudyBuddy.Service;


import com.example.StudyBuddy.DTO.Request.WorkspaceCreateRequestDto;
import com.example.StudyBuddy.DTO.Request.WorkspaceJoinRequestDto;
import com.example.StudyBuddy.DTO.Response.WorkspaceDetailResponseDto;
import com.example.StudyBuddy.DTO.Response.WorkspaceListResponseDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.Workspace;

public interface WorkspaceService {

    WorkspaceDetailResponseDto createWorkspace(User creator, WorkspaceCreateRequestDto request);

    WorkspaceListResponseDto getWorkspaces(Long userId);

    WorkspaceDetailResponseDto joinWorkspace(User user, WorkspaceJoinRequestDto request);

    WorkspaceDetailResponseDto getWorkspaceById(Long workspaceId, Long userId);

    WorkspaceDetailResponseDto mapToDetailDto(Workspace w, Long currentUserId);
}
