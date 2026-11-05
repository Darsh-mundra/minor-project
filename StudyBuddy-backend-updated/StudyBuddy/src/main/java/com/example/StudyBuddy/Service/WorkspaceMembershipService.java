package com.example.StudyBuddy.Service;

public interface WorkspaceMembershipService {
    /**
     * Verifies whether a given user is an active member of the specified workspace.
     *
     * @param userId      the ID of the user
     * @param workspaceId the ID of the workspace
     * @return true if the user belongs to the workspace, false otherwise
     */
    boolean isUserMemberOfWorkspace(Long userId, Long workspaceId);
}