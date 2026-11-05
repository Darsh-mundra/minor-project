package com.example.StudyBuddy.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceMessageDto {
    private Long id;
    private Long workspaceId;
    private Long authorId;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;
}
