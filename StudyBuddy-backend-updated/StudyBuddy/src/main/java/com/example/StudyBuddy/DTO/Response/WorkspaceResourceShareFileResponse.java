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
public class WorkspaceResourceShareFileResponse {
    private Long id;
    private String originalFilename;
    private Long fileSize;
    private String contentType;
    private LocalDateTime createdAt;
}
