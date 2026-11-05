package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Response.WorkspaceMessageDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.Workspace;
import com.example.StudyBuddy.Entity.WorkspaceMessage;
import com.example.StudyBuddy.Repository.WorkspaceMessageRepository;
import com.example.StudyBuddy.Repository.WorkspaceRepository;
import com.example.StudyBuddy.Service.WorkspaceDiscussionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WorkspaceDiscussionServiceImpl implements WorkspaceDiscussionService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMessageRepository messageRepository;

    @Transactional
    public WorkspaceMessageDto postMessage(User sender, Long workspaceId, String content) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new EntityNotFoundException("Workspace not found."));

        if (workspace.isExpired()) {
            throw new IllegalStateException("Cannot post messages in an expired workspace.");
        }

        // Enforce creator-only posting rule
        if (!workspace.getCreator().getId().equals(sender.getId())) {
            throw new SecurityException("Only the workspace creator can post discussion messages.");
        }

        if (content == null || content.isBlank() || content.length() > 1000) {
            throw new IllegalArgumentException("Message content cannot be empty or exceed 1000 characters.");
        }

        WorkspaceMessage message = WorkspaceMessage.builder()
                .workspace(workspace)
                .author(sender)
                .content(content.trim())
                .build();

        WorkspaceMessage saved = messageRepository.save(message);

        return WorkspaceMessageDto.builder()
                .id(saved.getId())
                .workspaceId(workspace.getId())
                .authorId(sender.getId())
                .authorName(sender.getName())
                .content(saved.getContent())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}