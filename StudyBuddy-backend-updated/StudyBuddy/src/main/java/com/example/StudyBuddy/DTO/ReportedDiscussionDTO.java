package com.example.StudyBuddy.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ReportedDiscussionDTO {
    private Long id;
    private String title;
    private String subject;
    private String authorName;
    private long reportsCount;
}
