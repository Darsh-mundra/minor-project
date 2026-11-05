package com.example.StudyBuddy.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AdminProjectDTO {
    private Long id;
    private String projectName;
    private String projectType;
    private String status;
    private String creatorName;
    private int members;
    private LocalDateTime createdAt;
}
