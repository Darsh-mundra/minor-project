package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Response.WorkspaceTaskDto;
import com.example.StudyBuddy.Entity.User;

public interface WorkspaceTaskService {
    WorkspaceTaskDto addTask(User user, Long workspaceId, WorkspaceTaskDto request);
    WorkspaceTaskDto toggleTaskCompletion(User user, Long workspaceId, Long taskId);
}