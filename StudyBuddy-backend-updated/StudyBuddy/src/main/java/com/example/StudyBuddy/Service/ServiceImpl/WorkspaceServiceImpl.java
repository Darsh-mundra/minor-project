package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Request.WorkspaceCreateRequestDto;
import com.example.StudyBuddy.DTO.Request.WorkspaceJoinRequestDto;
import com.example.StudyBuddy.DTO.Response.*;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.Workspace;
import com.example.StudyBuddy.Entity.WorkspaceMember;
import com.example.StudyBuddy.Entity.WorkspaceTask;
import com.example.StudyBuddy.Enum.WorkspaceRole;
import com.example.StudyBuddy.Repository.*;
import com.example.StudyBuddy.Service.WorkspaceService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceTaskRepository taskRepository;
    private final WorkspaceMindMapNodeRepository mindMapNodeRepository;
    private final WorkspaceMessageRepository messageRepository;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public WorkspaceDetailResponseDto createWorkspace(User creator, WorkspaceCreateRequestDto request) {
        if (request.getExpiryDate().isBefore(request.getExamDate()) || request.getExpiryDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Expiry date must be valid and on or after the exam date.");
        }
        if (request.getMaxMembers() < 2 || request.getMaxMembers() > 50) {
            throw new IllegalArgumentException("Maximum members must be between 2 and 50.");
        }

        String joinCode = generateUniqueJoinCode();

        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .subject(request.getSubject())
                .examDate(request.getExamDate())
                .expiryDate(request.getExpiryDate())
                .maxMembers(request.getMaxMembers())
                .joinCode(joinCode)
                .creator(creator)
                .build();

        Workspace savedWorkspace = workspaceRepository.save(workspace);

        // Add creator as CREATOR member
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(savedWorkspace)
                .user(creator)
                .role(WorkspaceRole.CREATOR)
                .build();
        memberRepository.save(member);

        return mapToDetailDto(savedWorkspace, creator.getId());
    }

    @Transactional(readOnly = true)
    public WorkspaceListResponseDto getWorkspaces(Long userId) {
        List<Workspace> allWorkspaces = workspaceRepository.findAll();

        List<WorkspaceDetailResponseDto> userWorkspaces = allWorkspaces.stream()
                .filter(w -> w.getCreator().getId().equals(userId) ||
                        w.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(userId)))
                .map(w -> mapToDetailDto(w, userId))
                .collect(Collectors.toList());

        List<WorkspaceDetailResponseDto> exploreWorkspaces = allWorkspaces.stream()
                .filter(w -> !w.getCreator().getId().equals(userId) &&
                        w.getMembers().stream().noneMatch(m -> m.getUser().getId().equals(userId)) &&
                        !w.isExpired() &&
                        w.getMembers().size() < w.getMaxMembers())
                .map(w -> mapToDetailDto(w, userId))
                .collect(Collectors.toList());

        return WorkspaceListResponseDto.builder()
                .userWorkspaces(userWorkspaces)
                .exploreWorkspaces(exploreWorkspaces)
                .build();
    }

    @Transactional
    public WorkspaceDetailResponseDto joinWorkspace(User user, WorkspaceJoinRequestDto request) {
        Workspace workspace;
        if (request.getJoinCode() != null && !request.getJoinCode().isBlank()) {
            String code = request.getJoinCode().trim().toUpperCase();
            workspace = workspaceRepository.findByJoinCode(code)
                    .orElseThrow(() -> new EntityNotFoundException("Invalid join code."));
        } else if (request.getWorkspaceId() != null) {
            workspace = workspaceRepository.findById(request.getWorkspaceId())
                    .orElseThrow(() -> new EntityNotFoundException("Workspace not found."));
        } else {
            throw new IllegalArgumentException("Either joinCode or workspaceId must be provided.");
        }

        if (workspace.isExpired()) {
            throw new IllegalStateException("Cannot join an expired workspace.");
        }
        if (workspace.getMembers().size() >= workspace.getMaxMembers()) {
            throw new IllegalStateException("Workspace has reached maximum member capacity.");
        }

        boolean alreadyMember = workspace.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(user.getId()));
        if (alreadyMember) {
            throw new IllegalStateException("You are already a member of this workspace.");
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(user)
                .role(WorkspaceRole.MEMBER)
                .build();
        memberRepository.save(member);

        workspace.getMembers().add(member);
        return mapToDetailDto(workspace, user.getId());
    }

    @Transactional(readOnly = true)
    public WorkspaceDetailResponseDto getWorkspaceById(Long workspaceId, Long userId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new EntityNotFoundException("Workspace not found."));

        boolean isAuthorized = workspace.getCreator().getId().equals(userId) ||
                workspace.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(userId));

        if (!isAuthorized) {
            throw new SecurityException("You are not authorized to view this workspace.");
        }

        return mapToDetailDto(workspace, userId);
    }

    private String generateUniqueJoinCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
            }
            code = sb.toString();
        } while (workspaceRepository.existsByJoinCode(code));
        return code;
    }

    public WorkspaceDetailResponseDto mapToDetailDto(Workspace w, Long currentUserId) {
        boolean isCreator = w.getCreator().getId().equals(currentUserId);

        List<WorkspaceMemberResponseDto> memberDtos = w.getMembers().stream().map(m ->
                WorkspaceMemberResponseDto.builder()
                        .id(m.getUser().getId())
                        .fullName(m.getUser().getName())
                        .branch(null) // Populated if profile branch available
                        .semester(null)
                        .points(0L)
                        .isCreator(m.getRole() == WorkspaceRole.CREATOR)
                        .build()
        ).collect(Collectors.toList());

        List<WorkspaceTaskDto> taskDtos = w.getTasks().stream().map(t ->
                WorkspaceTaskDto.builder()
                        .id(t.getId())
                        .title(t.getTitle())
                        .assigneeName(t.getAssignee() != null ? t.getAssignee().getName() : "Unassigned")
                        .dueDate(t.getDueDate())
                        .completed(t.isCompleted())
                        .build()
        ).collect(Collectors.toList());

        List<WorkspaceMindMapNodeDto> mindMapDtos = w.getMindMapNodes().stream().map(n ->
                WorkspaceMindMapNodeDto.builder()
                        .id(n.getId())
                        .parentId(n.getParentId())
                        .label(n.getLabel())
                        .notes(n.getNotes())
                        .build()
        ).collect(Collectors.toList());

        List<WorkspaceMessageDto> messageDtos = w.getMessages().stream().map(msg ->
                WorkspaceMessageDto.builder()
                        .id(msg.getId())
                        .workspaceId(w.getId())
                        .authorId(msg.getAuthor().getId())
                        .authorName(msg.getAuthor().getName())
                        .content(msg.getContent())
                        .createdAt(msg.getCreatedAt())
                        .build()
        ).collect(Collectors.toList());

        long completedTasks = w.getTasks().stream().filter(WorkspaceTask::isCompleted).count();
        int totalTasks = w.getTasks().size();
        int progressPercentage = totalTasks > 0 ? (int) Math.round(((double) completedTasks / totalTasks) * 100.0) : 0;

        return WorkspaceDetailResponseDto.builder()
                .id(w.getId())
                .name(w.getName())
                .description(w.getDescription())
                .subject(w.getSubject())
                .creatorName(w.getCreator().getName())
                .creatorId(w.getCreator().getId())
                .examDate(w.getExamDate())
                .expiryDate(w.getExpiryDate())
                .maxMembers(w.getMaxMembers())
                .memberCount(w.getMembers().size())
                .memberIds(w.getMembers().stream().map(m -> m.getUser().getId()).collect(Collectors.toList()))
                .members(memberDtos)
                .joinCode(isCreator ? w.getJoinCode() : null) // Private to creator only
                .readOnly(w.isExpired())
                .isCreator(isCreator)
                .tasks(taskDtos)
                .mindMapNodes(mindMapDtos)
                .discussions(messageDtos)
                .completedTaskCount((int) completedTasks)
                .totalTaskCount(totalTasks)
                .progressPercentage(progressPercentage)
                .build();
    }
}