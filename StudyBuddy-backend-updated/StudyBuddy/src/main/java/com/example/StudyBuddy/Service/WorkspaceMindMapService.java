package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Response.WorkspaceMindMapNodeDto;
import com.example.StudyBuddy.Entity.User;

public interface WorkspaceMindMapService {
    WorkspaceMindMapNodeDto addNode(User user, Long workspaceId, WorkspaceMindMapNodeDto request);
}