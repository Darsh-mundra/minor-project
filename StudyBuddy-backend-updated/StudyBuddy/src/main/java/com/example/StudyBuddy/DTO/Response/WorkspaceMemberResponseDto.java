package com.example.StudyBuddy.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceMemberResponseDto {
    private Long id;
    private String fullName;
    private String avatarUrl;
    private String branch;
    private String semester;
    private Long points;
    private boolean isCreator;
}