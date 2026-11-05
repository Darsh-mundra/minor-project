package com.example.StudyBuddy.DTO.Request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceJoinRequestDto {
    private String joinCode;
    private Long workspaceId;
}
