
        package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Response.WorkspaceMessageDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.WorkspaceDiscussionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceDiscussionController {

    private final WorkspaceDiscussionService discussionService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/{id}/discussion")
    public ResponseEntity<?> postMessageRest(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required"));
        }

        Object principal = authentication.getPrincipal();

        String username;

        if (principal instanceof UserDetails userDetails) {
            username = userDetails.getUsername();
        } else if (principal instanceof String principalName) {
            username = principalName;
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Unsupported authenticated principal"));
        }

        User currentUser = userRepository.findByEmail(username)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Authenticated user not found"
                ));

        String content = payload.get("content");

        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Message content cannot be empty"));
        }

        if (content.trim().length() > 1000) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Message cannot exceed 1000 characters"));
        }

        WorkspaceMessageDto message =
                discussionService.postMessage(currentUser, id, content.trim());

        messagingTemplate.convertAndSend(
                "/topic/workspace/" + id + "/discussion",
                message
        );

        return ResponseEntity.ok(message);
    }

    @MessageMapping("/workspace/{workspaceId}/chat")
    public void handleWebSocketMessage(
            @DestinationVariable Long workspaceId,
            @Payload Map<String, String> payload,
            Principal principal) {
        // Messages are currently persisted through the REST endpoint.
        // The REST endpoint broadcasts saved messages to WebSocket subscribers.
    }
}
