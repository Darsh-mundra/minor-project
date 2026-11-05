package com.example.StudyBuddy.Service.ServiceImpl;


import com.example.StudyBuddy.DTO.Response.WorkspaceMindMapNodeDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.Workspace;
import com.example.StudyBuddy.Entity.WorkspaceMindMapNode;
import com.example.StudyBuddy.Repository.WorkspaceMindMapNodeRepository;
import com.example.StudyBuddy.Repository.WorkspaceRepository;
import com.example.StudyBuddy.Service.WorkspaceMindMapService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WorkspaceMindMapServiceImpl implements WorkspaceMindMapService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMindMapNodeRepository mindMapNodeRepository;

    @Override
    @Transactional
    public WorkspaceMindMapNodeDto addNode(User user, Long workspaceId, WorkspaceMindMapNodeDto request) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new EntityNotFoundException("Workspace not found."));

        if (workspace.isExpired()) {
            throw new IllegalStateException("Cannot modify mind map in an expired workspace.");
        }

        boolean isAuthorized = workspace.getCreator().getId().equals(user.getId()) ||
                workspace.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(user.getId()));

        if (!isAuthorized) {
            throw new SecurityException("You are not authorized to modify this workspace's mind map.");
        }

        if (request.getLabel() == null || request.getLabel().isBlank()) {
            throw new IllegalArgumentException("Mind map node label cannot be empty.");
        }

        // Validate parent if provided

        if (request.getParentId() != null) {
            WorkspaceMindMapNode parentNode = mindMapNodeRepository
                    .findById(request.getParentId())
                    .orElseThrow(() ->
                            new EntityNotFoundException("Parent node not found."));

            if (!parentNode.getWorkspace().getId().equals(workspaceId)) {
                throw new IllegalArgumentException(
                        "Parent node must belong to the same workspace.");
            }
        }


        WorkspaceMindMapNode node = WorkspaceMindMapNode.builder()
                .workspace(workspace)
                .parentId(request.getParentId())
                .label(request.getLabel().trim())
                .notes(request.getNotes())
                .build();

        WorkspaceMindMapNode saved = mindMapNodeRepository.save(node);

        return WorkspaceMindMapNodeDto.builder()
                .id(saved.getId())
                .parentId(saved.getParentId())
                .label(saved.getLabel())
                .notes(saved.getNotes())
                .build();
    }
}
