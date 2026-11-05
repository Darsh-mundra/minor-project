package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.Subject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceDetailResponseDto {
    private Long id;
    private String name;
    private String description;
    private Subject subject;
    private String creatorName;
    private Long creatorId;
    private LocalDate examDate;
    private LocalDate expiryDate;
    private Integer maxMembers;
    private Integer memberCount;
    private List<Long> memberIds;
    private List<WorkspaceMemberResponseDto> members;
    private String joinCode; // Null or omitted for non-creators
    private boolean readOnly;
    private boolean isCreator;
    private List<WorkspaceTaskDto> tasks;
    private List<WorkspaceMindMapNodeDto> mindMapNodes;
    private List<WorkspaceMessageDto> discussions;
    private Integer completedTaskCount;
    private Integer totalTaskCount;
    private Integer progressPercentage;
}