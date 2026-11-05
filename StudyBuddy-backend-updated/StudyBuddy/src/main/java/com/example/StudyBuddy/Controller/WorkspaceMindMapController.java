package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Response.WorkspaceMindMapNodeDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Service.WorkspaceMindMapService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/mindmap")
@RequiredArgsConstructor
public class WorkspaceMindMapController {

    private final WorkspaceMindMapService mindMapService;

    @PostMapping
    public ResponseEntity<WorkspaceMindMapNodeDto> addNode(
            Authentication authentication,
            @PathVariable Long workspaceId,
            @Valid @RequestBody WorkspaceMindMapNodeDto request) {
        WorkspaceMindMapNodeDto created = mindMapService.addNode((User) authentication, workspaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
