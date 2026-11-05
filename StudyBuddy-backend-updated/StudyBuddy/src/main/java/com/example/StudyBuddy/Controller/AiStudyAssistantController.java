
package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Request.ChatRequestDto;
import com.example.StudyBuddy.DTO.Response.ConversationResponseDto;
import com.example.StudyBuddy.DTO.Response.MessageResponseDto;
import com.example.StudyBuddy.Entity.Conversation;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.AiStudyAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study-assistant")
public class AiStudyAssistantController {

    private final AiStudyAssistantService studyAssistantService;
    private final UserRepository userRepository;

    public AiStudyAssistantController(
            AiStudyAssistantService studyAssistantService,
            UserRepository userRepository) {
        this.studyAssistantService = studyAssistantService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "User is not authenticated");
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException(
                        "Authenticated user not found"));
    }

    @PostMapping("/conversations")
    public ResponseEntity<Conversation> createConversation(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        Conversation conversation =
                studyAssistantService.createConversation(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
    }


    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponseDto>> getConversations(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        List<ConversationResponseDto> conversations =
                studyAssistantService.getUserConversations(user)
                        .stream()
                        .map(ConversationResponseDto::from)
                        .toList();

        return ResponseEntity.ok(conversations);
    }


    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<MessageResponseDto>> getMessages(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        List<MessageResponseDto> messages =
                studyAssistantService.getConversationMessages(id, user);

        return ResponseEntity.ok(messages);
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<MessageResponseDto> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody ChatRequestDto request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        MessageResponseDto response =
                studyAssistantService.processMessage(
                        id, request.getMessage(), user);

        return ResponseEntity.ok(response);
    }
}
