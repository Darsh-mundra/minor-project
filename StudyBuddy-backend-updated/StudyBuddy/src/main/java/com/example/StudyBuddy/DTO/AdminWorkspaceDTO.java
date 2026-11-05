package com.example.StudyBuddy.DTO;

import com.example.StudyBuddy.Enum.Subject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AdminWorkspaceDTO {
    private Long id;
    private String name;
    private Subject subject;
    private String creatorName;
    private int members;
    private int maxMembers;
    private boolean isArchived;
}
