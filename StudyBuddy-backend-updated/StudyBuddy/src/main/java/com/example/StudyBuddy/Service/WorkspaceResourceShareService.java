package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Response.WorkspaceResourceShareResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

public interface WorkspaceResourceShareService {

    WorkspaceResourceShareResponse createShare(
            Long workspaceId,
            String userEmail,
            String title,
            String description,
            List<MultipartFile> files
    );

    Page<WorkspaceResourceShareResponse> getWorkspaceShares(
            Long workspaceId,
            String userEmail,
            Pageable pageable
    );

    WorkspaceResourceShareResponse getShareDetails(
            Long workspaceId,
            Long shareId,
            String userEmail
    );

    Path getFileStreamPath(
            Long workspaceId,
            Long shareId,
            Long fileId,
            String userEmail
    );
}