package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Response.WorkspaceResourceShareResponse;
import com.example.StudyBuddy.DTO.Response.WorkspaceResourceShareFileResponse;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.Workspace;
import com.example.StudyBuddy.Entity.WorkspaceResourceShare;
import com.example.StudyBuddy.Entity.WorkspaceResourceShareFile;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Repository.WorkspaceRepository;
import com.example.StudyBuddy.Repository.WorkspaceResourceShareFileRepository;
import com.example.StudyBuddy.Repository.WorkspaceResourceShareRepository;
import com.example.StudyBuddy.Service.WorkspaceMembershipService;
import com.example.StudyBuddy.Service.WorkspaceResourceShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceResourceShareServiceImpl implements WorkspaceResourceShareService {

    private final WorkspaceResourceShareRepository shareRepository;
    private final WorkspaceResourceShareFileRepository fileRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final WorkspaceMembershipService membershipService; // Existing workspace membership validator
    private final ClassroomStorageService storageService;

    @Transactional
    public WorkspaceResourceShareResponse createShare(
            Long workspaceId,
            String userEmail,
            String title,
            String description,
            List<MultipartFile> files) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        // Validate membership
        if (!membershipService.isUserMemberOfWorkspace(user.getId(), workspaceId)) {
            throw new SecurityException("Access denied: User is not a member of this workspace");
        }

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title cannot be blank");
        }

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("At least one PDF file must be attached to the post");
        }

        if (files.size() > 10) {
            throw new IllegalArgumentException("Cannot attach more than 10 files in a single post");
        }

        WorkspaceResourceShare share = WorkspaceResourceShare.builder()
                .workspace(workspace)
                .user(user)
                .title(title.trim())
                .description(description != null ? description.trim() : "")
                .files(new ArrayList<>())
                .build();

        List<ClassroomStorageService.StoredFileResult> storedResults = new ArrayList<>();

        try {
            for (MultipartFile file : files) {
                ClassroomStorageService.StoredFileResult result = storageService.storeFile(file);
                storedResults.add(result);

                WorkspaceResourceShareFile shareFile = WorkspaceResourceShareFile.builder()
                        .originalFilename(result.getOriginalFilename())
                        .storageFilename(result.getStorageFilename())
                        .storagePath(result.getStoragePath())
                        .fileSize(result.getFileSize())
                        .contentType(result.getContentType())
                        .build();

                share.addFile(shareFile);
            }

            WorkspaceResourceShare savedShare = shareRepository.save(share);
            return mapToResponse(savedShare);

        } catch (Exception e) {
            // Cleanup uploaded files on failure
            for (ClassroomStorageService.StoredFileResult res : storedResults) {
                storageService.deleteFileByPath(res.getStoragePath());
            }
            throw new RuntimeException("Failed to create resource share: " + e.getMessage(), e);
        }
    }

    private WorkspaceResourceShareResponse mapToResponse(WorkspaceResourceShare savedShare) {
        if (savedShare == null) {
            return null;
        }

        // Map associated files safely
        List<WorkspaceResourceShareFileResponse> fileResponses = new ArrayList<>();
        if (savedShare.getFiles() != null) {
            fileResponses = savedShare.getFiles().stream()
                    .map(file -> WorkspaceResourceShareFileResponse.builder()
                            .id(file.getId())
                            .originalFilename(file.getOriginalFilename())
                            .fileSize(file.getFileSize())
                            .contentType(file.getContentType())
                            .createdAt(file.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());
        }

        // Map author details safely
        WorkspaceResourceShareResponse.AuthorDto authorDto = null;
        if (savedShare.getUser() != null) {
            authorDto = WorkspaceResourceShareResponse.AuthorDto.builder()
                    .id(savedShare.getUser().getId())
                    .name(savedShare.getUser().getName())
                    .email(savedShare.getUser().getEmail())
                    .build();
        }

        // Build and return the response DTO
        return WorkspaceResourceShareResponse.builder()
                .id(savedShare.getId())
                .workspaceId(savedShare.getWorkspace() != null ? savedShare.getWorkspace().getId() : null)
                .author(authorDto)
                .title(savedShare.getTitle())
                .description(savedShare.getDescription())
                .files(fileResponses)
                .createdAt(savedShare.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<WorkspaceResourceShareResponse> getWorkspaceShares(Long workspaceId, String userEmail, Pageable pageable) {
        validateMembership(userEmail, workspaceId);
        return shareRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId, pageable)
                .map(this.mapToResponse);
    }

    @Transactional(readOnly = true)
    public WorkspaceResourceShareResponse getShareDetails(Long workspaceId, Long shareId, String userEmail) {
        validateMembership(userEmail, workspaceId);
        WorkspaceResourceShare share = shareRepository.findByIdAndWorkspaceIdWithDetails(shareId, workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Resource share not found in this workspace"));
        return mapToResponse(share);
    }

    @Transactional(readOnly = true)
    public Path getFileStreamPath(Long workspaceId, Long shareId, Long fileId, String userEmail) {
        validateMembership(userEmail, workspaceId);

        // Ensure share exists and belongs to workspace
        shareRepository.findByIdAndWorkspaceIdWithDetails(shareId, workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Resource share not found"));

        WorkspaceResourceShareFile file = fileRepository.findByIdAndShareId(fileId, shareId)
                .orElseThrow(() -> new IllegalArgumentException("File attachment not found"));

        return storageService.loadFileAsPath(file.getStorageFilename());
    }

    private void validateMembership(String userEmail, Long workspaceId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!membershipService.isUserMemberOfWorkspace(user.getId(), workspaceId)) {
            throw new SecurityException("Access denied: User is not a member of this workspace");
        }
    }

    private final java.util.function.Function<WorkspaceResourceShare, WorkspaceResourceShareResponse> mapToResponse = share ->
            WorkspaceResourceShareResponse.builder()
                    .id(share.getId())
                    .workspaceId(share.getWorkspace().getId())
                    .author(WorkspaceResourceShareResponse.AuthorDto.builder()
                            .id(share.getUser().getId())
                            .name(share.getUser().getName())
                            .email(share.getUser().getEmail())
                            .build())
                    .title(share.getTitle())
                    .description(share.getDescription())
                    .createdAt(share.getCreatedAt())
                    .files(share.getFiles().stream().map(f ->
                            WorkspaceResourceShareFileResponse.builder()
                                    .id(f.getId())
                                    .originalFilename(f.getOriginalFilename())
                                    .fileSize(f.getFileSize())
                                    .contentType(f.getContentType())
                                    .createdAt(f.getCreatedAt())
                                    .build()
                    ).collect(Collectors.toList()))
                    .build();
}