package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Request.WorkspaceCreateRequestDto;
import com.example.StudyBuddy.DTO.Request.WorkspaceJoinRequestDto;
import com.example.StudyBuddy.DTO.Response.WorkspaceDetailResponseDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.WorkspaceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final UserRepository userRepository;

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)
                && authentication.getName() != null;
    }

    private ResponseEntity<Map<String, String>> unauthorizedResponse() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Authentication required"));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user not found in database."
                        ));
    }

    @GetMapping
    public ResponseEntity<?> getWorkspaces(Authentication authentication) {
        if (!isAuthenticated(authentication)) {
            return unauthorizedResponse();
        }

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                workspaceService.getWorkspaces(user.getId())
        );
    }

    @PostMapping
    public ResponseEntity<?> createWorkspace(
            Authentication authentication,
            @Valid @RequestBody WorkspaceCreateRequestDto request) {

        if (!isAuthenticated(authentication)) {
            return unauthorizedResponse();
        }

        User user = getAuthenticatedUser(authentication);

        WorkspaceDetailResponseDto created =
                workspaceService.createWorkspace(user, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinWorkspace(
            Authentication authentication,
            @Valid @RequestBody WorkspaceJoinRequestDto request) {

        if (!isAuthenticated(authentication)) {
            return unauthorizedResponse();
        }

        User user = getAuthenticatedUser(authentication);

        WorkspaceDetailResponseDto joined =
                workspaceService.joinWorkspace(user, request);

        return ResponseEntity.ok(joined);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getWorkspaceById(
            Authentication authentication,
            @PathVariable Long id) {

        if (!isAuthenticated(authentication)) {
            return unauthorizedResponse();
        }

        User user = getAuthenticatedUser(authentication);

        WorkspaceDetailResponseDto workspace =
                workspaceService.getWorkspaceById(id, user.getId());

        return ResponseEntity.ok(workspace);
    }
}