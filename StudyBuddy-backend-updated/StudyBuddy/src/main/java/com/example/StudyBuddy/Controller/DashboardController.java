
package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Response.*;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.ResourceService;
import com.example.StudyBuddy.Service.WorkspaceService;
import com.example.StudyBuddy.Service.GeminiQuizService;
import com.example.StudyBuddy.Service.OpportunityService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student")
public class DashboardController {

    private final UserRepository userRepository;
    private final ResourceService resourceService;
    private final WorkspaceService workspaceService;
    private final GeminiQuizService geminiQuizService;
    private final OpportunityService opportunityService;

    public DashboardController(
            UserRepository userRepository,
            ResourceService resourceService,
            WorkspaceService workspaceService,
            GeminiQuizService geminiQuizService,
            OpportunityService opportunityService
    ) {
        this.userRepository = userRepository;
        this.resourceService = resourceService;
        this.workspaceService = workspaceService;
        this.geminiQuizService = geminiQuizService;
        this.opportunityService = opportunityService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponseDto> getDashboard(
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalStateException("Authenticated user was not found")
                );

        DashboardResponseDto response =
                new DashboardResponseDto();

        // User profile
        response.setProfile(
                DashboardResponseDto.UserProfileDto
                        .fromEntity(currentUser)
        );

        // Latest 4 approved resources
        Page<ResourceCardDto> resources =
                resourceService.getFilteredApprovedResources(
                        null,
                        null,
                        null,
                        null,
                        null,
                        "recent",
                        PageRequest.of(0, 4)
                );

        response.setRecentResources(resources.getContent());

        // Existing workspace service
        WorkspaceListResponseDto workspaceData =
                workspaceService.getWorkspaces(currentUser.getId());

        response.setWorkspaceData(workspaceData);

        // Latest 3 quiz attempts for this user
        List<QuizHistoryItemDTO> attempts =
                geminiQuizService.getQuizHistory(email);

        response.setRecentAttempts(
                attempts.stream().limit(3).toList()
        );

        // Latest 3 opportunities
        Page<OpportunityResponseDto> opportunities =
                opportunityService.getOpportunities(
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        PageRequest.of(0, 3),
                        currentUser
                );

        response.setOpportunities(opportunities.getContent());

        return ResponseEntity.ok(response);
    }
}
