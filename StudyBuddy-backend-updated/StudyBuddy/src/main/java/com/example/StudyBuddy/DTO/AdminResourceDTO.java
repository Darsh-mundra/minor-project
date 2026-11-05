package com.example.StudyBuddy.DTO;

import com.example.StudyBuddy.Enum.ResourceType;
import com.example.StudyBuddy.Enum.SubjectEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AdminResourceDTO {
    private Long id;
    private String title;
    private SubjectEnum subject;
    private ResourceType resourceType;
    private String uploaderName;
    private LocalDateTime uploadDate;
    private boolean isReported;
}
