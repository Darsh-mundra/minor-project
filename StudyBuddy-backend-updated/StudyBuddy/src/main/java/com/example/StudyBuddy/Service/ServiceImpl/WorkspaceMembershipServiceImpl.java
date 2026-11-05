package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.Repository.WorkspaceMemberRepository;
import com.example.StudyBuddy.Service.WorkspaceMembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WorkspaceMembershipServiceImpl implements WorkspaceMembershipService {

    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean isUserMemberOfWorkspace(Long userId, Long workspaceId) {
        if (userId == null || workspaceId == null) {
            return false;
        }
        return workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId);
    }
}