package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.Entity.User;

import java.util.Map;

public interface WorkspaceAiService {
    Map<String, String> askAiAssistant(User user, Long workspaceId, String question);
}