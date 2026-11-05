package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.DTO.*;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AdminStatsResponseDTO {
    // Overview Statistics
    private long totalStudents;
    private long totalAdmins;
    private long disabledCount;
    private long totalResources;
    private long totalWorkspaces;
    private long reportedCount;
    private long totalProjects;
    private long totalDiscussions;
    private long totalQuizzes;
    private long totalOpportunities;

    // Collections
    private List<RecentActivityDTO> recentActivity;
    private List<ReportedResourceDTO> reportedResources;
    private List<ReportedDiscussionDTO> reportedDiscussions;
    private List<UserManagementDTO> users;
    private List<AdminResourceDTO> allResources;
    private List<AdminDiscussionDTO> allDiscussions;
    private List<AdminWorkspaceDTO> allWorkspaces;
    private List<AdminProjectDTO> allProjects;
}