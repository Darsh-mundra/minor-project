package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Response.WorkspaceTaskDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.WorkspaceTaskService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/tasks")
@RequiredArgsConstructor
public class WorkspaceTaskController {

    private final WorkspaceTaskService taskService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<WorkspaceTaskDto> addTask(
            Authentication authentication,
            @PathVariable Long workspaceId,
            @Valid @RequestBody WorkspaceTaskDto request) {

        User currentUser = getAuthenticatedUser(authentication);

        WorkspaceTaskDto created =
                taskService.addTask(currentUser, workspaceId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }

    @PatchMapping("/{taskId}/toggle")
    public ResponseEntity<WorkspaceTaskDto> toggleTaskCompletion(
            Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long taskId) {

        User currentUser = getAuthenticatedUser(authentication);

        WorkspaceTaskDto updated =
                taskService.toggleTaskCompletion(
                        currentUser,
                        workspaceId,
                        taskId
                );

        return ResponseEntity.ok(updated);
    }

    private User getAuthenticatedUser(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserDetails userDetails)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user not found"
                ));
    }
}
