package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Response.WorkspaceTaskDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.Workspace;
import com.example.StudyBuddy.Entity.WorkspaceTask;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Repository.WorkspaceRepository;
import com.example.StudyBuddy.Repository.WorkspaceTaskRepository;
import com.example.StudyBuddy.Service.WorkspaceTaskService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WorkspaceTaskServiceImpl implements WorkspaceTaskService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceTaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public WorkspaceTaskDto addTask(User user, Long workspaceId, WorkspaceTaskDto request) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new EntityNotFoundException("Workspace not found."));

        if (workspace.isExpired()) {
            throw new IllegalStateException("Cannot add tasks to an expired workspace.");
        }

        boolean isMember = workspace.getCreator().getId().equals(user.getId()) ||
                workspace.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(user.getId()));

        if (!isMember) {
            throw new SecurityException("You must be a workspace member to create tasks.");
        }

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Task title cannot be empty.");
        }

        User assignee;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new EntityNotFoundException("Assignee user not found."));

            boolean assigneeIsInWorkspace = workspace.getCreator().getId().equals(assignee.getId()) ||
                    workspace.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(assignee.getId()));

            if (!assigneeIsInWorkspace) {
                throw new IllegalArgumentException("Cannot assign task to a user who is not a member of this workspace.");
            }
        } else {
            assignee = null;
        }

        WorkspaceTask task = WorkspaceTask.builder()
                .workspace(workspace)
                .title(request.getTitle().trim())
                .assignee(assignee)
                .dueDate(request.getDueDate())
                .completed(false)
                .build();

        WorkspaceTask saved = taskRepository.save(task);

        return WorkspaceTaskDto.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .assigneeId(saved.getAssignee() != null ? saved.getAssignee().getId() : null)
                .assigneeName(saved.getAssignee() != null ? saved.getAssignee().getName() : "Unassigned")
                .dueDate(saved.getDueDate())
                .completed(saved.isCompleted())
                .build();
    }

    @Override
    @Transactional
    public WorkspaceTaskDto toggleTaskCompletion(User user, Long workspaceId, Long taskId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new EntityNotFoundException("Workspace not found."));

        if (workspace.isExpired()) {
            throw new IllegalStateException("Cannot modify tasks in an expired workspace.");
        }

        boolean isMember = workspace.getCreator().getId().equals(user.getId()) ||
                workspace.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(user.getId()));

        if (!isMember) {
            throw new SecurityException("You must be a workspace member to update task statuses.");
        }

        WorkspaceTask task = taskRepository.findById(taskId)
                .orElseThrow();

        if (!task.getWorkspace().getId().equals(workspaceId)) {
            throw new IllegalArgumentException("Task does not belong to this workspace.");
        }

        task.setCompleted(!task.isCompleted());
        WorkspaceTask updated = taskRepository.save(task);

        return WorkspaceTaskDto.builder()
                .id(updated.getId())
                .title(updated.getTitle())
                .assigneeId(updated.getAssignee() != null ? updated.getAssignee().getId() : null)
                .assigneeName(updated.getAssignee() != null ? updated.getAssignee().getName() : "Unassigned")
                .dueDate(updated.getDueDate())
                .completed(updated.isCompleted())
                .build();
    }
}