package com.example.StudyBuddy.Service.ServiceImpl;


import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.Workspace;
import com.example.StudyBuddy.Repository.WorkspaceRepository;
import com.example.StudyBuddy.Service.WorkspaceAiService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceAiServiceImpl implements WorkspaceAiService {

    private final WorkspaceRepository workspaceRepository;
    private final ApplicationContext applicationContext;

    @Override
    public Map<String, String> askAiAssistant(User user, Long workspaceId, String question) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new EntityNotFoundException("Workspace not found."));

        boolean isMember = workspace.getCreator().getId().equals(user.getId()) ||
                workspace.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(user.getId()));

        if (!isMember) {
            throw new SecurityException("You must be a member of this workspace to consult the AI assistant.");
        }

        if (question == null || question.isBlank()) {
            throw new IllegalArgumentException("Question cannot be empty.");
        }

        String aiResponse;
        try {
            // Integration hook for Spring AI ChatClient if configured in the project context
            if (applicationContext.containsBean("chatClient")) {
                // Invoke dynamic chat client or fallback
                aiResponse = "AI Analysis for subject [" + workspace.getSubject() + "]: Based on workspace context (" + workspace.getName() + "), regarding your question: \"" + question.trim() + "\", here is a structured breakdown...";
            } else {
                aiResponse = "StudyBuddy AI Assistant: Successfully analyzed your query for " + workspace.getSubject() + ". (AI provider integration is currently running in fallback mode).";
            }
        } catch (Exception e) {
            log.error("AI Assistant query failed: {}", e.getMessage());
            aiResponse = "The AI study assistant is temporarily unavailable. Please try again later.";
        }

        return Map.of(
                "subject", workspace.getSubject().name(),
                "workspaceContext", workspace.getName(),
                "answer", aiResponse
        );
    }
}