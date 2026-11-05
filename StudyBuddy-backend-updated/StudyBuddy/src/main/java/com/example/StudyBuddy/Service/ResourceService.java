package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Request.ReportRequestDto;
import com.example.StudyBuddy.DTO.Request.ResourceSubmissionDto;
import com.example.StudyBuddy.DTO.Response.*;
import com.example.StudyBuddy.Entity.Resource;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.WorkspaceResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ResourceService {

    Resource submitResource(ResourceSubmissionDto dto, MultipartFile file, User uploader);

    void rateResource(Long resourceId, Integer ratingValue, User currentUser);

    boolean toggleBookmark(Long resourceId, User currentUser);

    Page<ResourceCardDto> getUserBookmarks(User currentUser, Pageable pageable);

    void reportResource(Long resourceId, ReportRequestDto dto, User currentUser);

    ResourceDownloadResponse incrementAndGetDownloadUrl(Long resourceId, User currentUser);

    Page<ResourceCardDto> getFilteredApprovedResources(
            String resourceType,
            String branch,
            String subject,
            String semester,
            String chapterUnit,
            String sortBy,
            Pageable pageable
    );

    Resource getApprovedResourceForDownload(Long resourceId);


    void shareResourceWithWorkspace(
            Long workspaceId,
            Long resourceId,
            User currentUser
    );

    org.springframework.core.io.Resource getWorkspaceResourcePreview(
            Long workspaceId,
            Long resourceId,
            User currentUser
    );

    Page<WorkspaceResourceResponseDto> getWorkspaceResources(
            Long workspaceId,
            User currentUser,
            Pageable pageable
    );

}