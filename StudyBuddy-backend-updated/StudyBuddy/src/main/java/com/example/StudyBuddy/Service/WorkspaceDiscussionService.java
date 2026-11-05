package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Response.WorkspaceMessageDto;
import com.example.StudyBuddy.Entity.User;

public interface WorkspaceDiscussionService {

    /**
     * Posts a new discussion message to a workspace, enforcing creator-only posting permissions and expiry checks.
     */
    WorkspaceMessageDto postMessage(User sender, Long workspaceId, String content);
}
