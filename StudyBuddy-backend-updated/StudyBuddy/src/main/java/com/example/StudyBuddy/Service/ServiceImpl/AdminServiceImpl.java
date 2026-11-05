package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.AdminResourceDTO;
import com.example.StudyBuddy.DTO.Response.AdminStatsResponseDTO;
import com.example.StudyBuddy.DTO.UserManagementDTO;
import com.example.StudyBuddy.DTO.AdminDiscussionDTO;
import com.example.StudyBuddy.DTO.AdminWorkspaceDTO;
import com.example.StudyBuddy.DTO.AdminProjectDTO;
import com.example.StudyBuddy.DTO.ReportedResourceDTO;
import com.example.StudyBuddy.DTO.ReportedDiscussionDTO;
import com.example.StudyBuddy.DTO.RecentActivityDTO;
import com.example.StudyBuddy.Enum.Role;
import com.example.StudyBuddy.Exception.ResourceNotFoundException;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.Resource;
import com.example.StudyBuddy.Entity.Discussion;
import com.example.StudyBuddy.Repository.*;
import com.example.StudyBuddy.Service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.BadRequestException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final DiscussionRepository discussionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final QuizRepository quizRepository;
    private final OpportunityRepository opportunityRepository;
    private final ReportRepository reportRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponseDTO getAdminStats() {
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);
        long disabledCount = userRepository.countByDisabledTrue();
        long totalResources = resourceRepository.count();
        long totalWorkspaces = workspaceRepository.count();
        long totalProjects = projectRepository.count();
        long totalDiscussions = discussionRepository.count();
        long totalQuizzes = quizRepository.count();
        long totalOpportunities = opportunityRepository.count();
        long reportedCount = reportRepository.count();

        // Fetch collections with optimized queries
        List<UserManagementDTO> users = userRepository.findAll().stream()
                .map(u -> new UserManagementDTO(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getPoints(), u.isDisabled()))
                .collect(Collectors.toList());

        List<AdminResourceDTO> allResources = resourceRepository.findAll().stream()
                .map(r -> new AdminResourceDTO(
                        r.getId(),
                        r.getTitle(),
                        r.getSubject(),
                        r.getResourceType(),
                        r.getUploader() != null ? r.getUploader().getName() : "Unknown",
                        r.getCreatedAt(),
                        r.getReports() != null && !r.getReports().isEmpty()))
                .collect(Collectors.toList());

        List<AdminDiscussionDTO> allDiscussions = discussionRepository.findAll().stream()
                .map(d -> new AdminDiscussionDTO(
                        d.getId(),
                        d.getTitle(),
                        d.getSubject(),
                        d.getAuthor() != null ? d.getAuthor().getName() : "Unknown",
                        d.getAnswers() != null ? d.getAnswers().size() : 0,
                        d.getCreatedAt(),
                        d.getReports() != null && !d.getReports().isEmpty()))
                .collect(Collectors.toList());

        List<AdminWorkspaceDTO> allWorkspaces = workspaceRepository.findAll().stream()
                .map(w -> new AdminWorkspaceDTO(
                        w.getId(),
                        w.getName(),
                        w.getSubject(),
                        w.getCreator() != null ? w.getCreator().getName() : "Unknown",
                        w.getMembers() != null ? w.getMembers().size() : 0,
                        w.getMaxMembers(),
                        w.isArchived()))
                .collect(Collectors.toList());

        List<AdminProjectDTO> allProjects = projectRepository.findAll().stream()
                .map(p -> new AdminProjectDTO(
                        p.getId(),
                        p.getProjectName(),
                        p.getProjectType(),
                        p.getStatus(),
                        p.getCreator() != null ? p.getCreator().getName() : "Unknown",
                        p.getMembers() != null ? p.getMembers().size() : 0,
                        p.getCreatedAt()))
                .collect(Collectors.toList());

        List<ReportedResourceDTO> reportedResources = resourceRepository.findReportedResources().stream()
                .map(r -> new ReportedResourceDTO(
                        r.getId(),
                        r.getTitle(),
                        r.getSubject(),
                        r.getUploader() != null ? r.getUploader().getName() : "Unknown",
                        r.getReports().size()))
                .collect(Collectors.toList());

        List<ReportedDiscussionDTO> reportedDiscussions = discussionRepository.findReportedDiscussions().stream()
                .map(d -> new ReportedDiscussionDTO(
                        d.getId(),
                        d.getTitle(),
                        d.getSubject(),
                        d.getAuthor() != null ? d.getAuthor().getName() : "Unknown",
                        d.getReports().size()))
                .collect(Collectors.toList());

        List<RecentActivityDTO> recentActivity = reportRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(rep -> new RecentActivityDTO("REPORT", "Content reported: " + rep.getTargetTitle(), rep.getCreatedAt()))
                .collect(Collectors.toList());

        return AdminStatsResponseDTO.builder()
                .totalStudents(totalStudents)
                .totalAdmins(totalAdmins)
                .disabledCount(disabledCount)
                .totalResources(totalResources)
                .totalWorkspaces(totalWorkspaces)
                .reportedCount(reportedCount)
                .totalProjects(totalProjects)
                .totalDiscussions(totalDiscussions)
                .totalQuizzes(totalQuizzes)
                .totalOpportunities(totalOpportunities)
                .recentActivity(recentActivity)
                .reportedResources(reportedResources)
                .reportedDiscussions(reportedDiscussions)
                .users(users)
                .allResources(allResources)
                .allDiscussions(allDiscussions)
                .allWorkspaces(allWorkspaces)
                .allProjects(allProjects)
                .build();
    }

    @Override
    @Transactional
    public void toggleUserDisabled(Long userId, String currentAdminEmail) throws BadRequestException {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (targetUser.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new BadRequestException("You cannot disable your own admin account.");
        }

        if (targetUser.getRole() == Role.ADMIN) {
            throw new AccessDeniedException("Administrators cannot disable another administrator account.");
        }

        targetUser.setDisabled(!targetUser.isDisabled());
        userRepository.save(targetUser);
        log.info("Admin {} toggled disabled status for user ID {} to {}", currentAdminEmail, userId, targetUser.isDisabled());
    }

    @Override
    @Transactional
    public void deleteResource(Long resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));
        reportRepository.deleteByTargetIdAndTargetType(resourceId, "RESOURCE");
        resourceRepository.delete(resource);
        log.info("Admin permanently deleted resource ID: {}", resourceId);
    }

    @Override
    @Transactional
    public void deleteDiscussion(Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion not found with ID: " + discussionId));
        reportRepository.deleteByTargetIdAndTargetType(discussionId, "DISCUSSION");
        discussionRepository.delete(discussion);
        log.info("Admin permanently deleted discussion ID: {}", discussionId);
    }
}