package com.example.StudyBuddy.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AdminDiscussionDTO {
    private Long id;
    private String title;
    private String subject;
    private String authorName;
    private int answers;
    private LocalDateTime createdAt;
    private boolean isReported;
}
