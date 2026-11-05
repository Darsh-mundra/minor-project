package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Request.ReportRequestDto;
import com.example.StudyBuddy.DTO.Request.ResourceSubmissionDto;
import com.example.StudyBuddy.DTO.Response.*;
import com.example.StudyBuddy.Entity.*;
import com.example.StudyBuddy.Enum.*;
import com.example.StudyBuddy.Repository.*;
import com.example.StudyBuddy.Service.FileStorageService;
import com.example.StudyBuddy.Service.ResourceService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    // private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final RatingRepository ratingRepository;
    private final BookmarkRepository bookmarkRepository;
    private final ResourceReportRepository resourceReportRepository;
    private final ResourceDownloadRepository resourceDownloadRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceResourceRepository workspaceResourceRepository;


    @Override
    @Transactional
    public Resource submitResource(ResourceSubmissionDto dto, MultipartFile file, User uploader) {
        String normalizedTitle = dto.getTitle().trim().toLowerCase().replaceAll("\\s+", " ");
        if (resourceRepository.existsByNormalizedTitle(normalizedTitle)) {
            raiseDuplicateTitleError();
        }

        fileStorageService.validatePdfFile(file);

        String storagePath = fileStorageService.storeResourceFile(file);

        Resource resource = new Resource();

        resource.setTitle(dto.getTitle().trim());

        resource.setSubject(
                SubjectEnum.valueOf(
                        dto.getSubject().trim().toUpperCase().replaceAll("\\s+", "_")
                )
        );

        resource.setResourceType(
                ResourceType.valueOf(
                        dto.getResourceType().trim().toUpperCase().replaceAll("\\s+", "_")
                )
        );

        resource.setSemester(
                SemesterEnum.valueOf(
                        "SEMESTER_" + dto.getSemester().trim()
                )
        );

        resource.setChapterUnit(dto.getChapterUnit());
        String branchValue = dto.getBranch().trim();

        BranchEnum branch = switch (branchValue.toUpperCase()) {
            case "COMPUTER SCIENCE & ENGINEERING", "CSE" -> BranchEnum.CSE;
            case "INFORMATION TECHNOLOGY", "IT" -> BranchEnum.IT;
            case "COMPUTER SCIENCE AND INFORMATION TECHNOLOGY",
                 "CSIT" -> BranchEnum.CSIT;
            case "ELECTRONICS AND COMMUNICATION", "EC" -> BranchEnum.EC;
            case "CYBER SECURITY", "CYBER_SECURITY" -> BranchEnum.CYBER_SECURITY;
            case "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING",
                 "AI/ML", "AIML" -> BranchEnum.AIML;
            default -> throw new IllegalArgumentException(
                    "Invalid branch: " + branchValue
            );
        };

        resource.setBranch(branch);

        resource.setDescription(dto.getDescription());
        resource.setOriginalFilename(file.getOriginalFilename());
        resource.setFileSize(file.getSize());
        resource.setStorageFilePath(storagePath);
        resource.setUploader(uploader);
        resource.setStatus(ResourceStatus.APPROVED);

        try {
            resource = resourceRepository.save(resource);
        } catch (DataIntegrityViolationException e) {
            throw e;
        }

        return resource;
    }

    private void raiseDuplicateTitleError() {
        throw new IllegalArgumentException("Resource title is already taken. Two different resources cannot have the same title.");
    }

    @Override
    @Transactional
    public void rateResource(Long resourceId, Integer ratingValue, User currentUser) {
        Resource resource = resourceRepository.findByIdAndStatus(resourceId, ResourceStatus.APPROVED)
                .orElseThrow(() -> new EntityNotFoundException("Approved resource not found"));

        if (resource.getUploader().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Uploaders are not permitted to rate their own resources.");
        }

        Rating rating = ratingRepository.findByUserIdAndResourceId(currentUser.getId(), resourceId)
                .orElse(new Rating());

        if (rating.getId() == null) {
            rating.setUser(currentUser);
            rating.setResource(resource);
        }

        rating.setRatingValue(ratingValue);
        ratingRepository.save(rating);

        recalculateResourceRatings(resource);
    }


    private void recalculateResourceRatings(Resource resource) {
        List<Rating> ratings =
                ratingRepository.findByResourceId(resource.getId());

        double average = ratings.stream()
                .filter(rating -> rating.getRatingValue() != null)
                .mapToInt(Rating::getRatingValue)
                .average()
                .orElse(0.0);

        resource.setAverageRating(Math.round(average * 10.0) / 10.0);
        resource.setRatingCount((int) ratings.stream()
                .filter(rating -> rating.getRatingValue() != null)
                .count());

        resourceRepository.save(resource);
    }


    @Override
    @Transactional
    public boolean toggleBookmark(Long resourceId, User currentUser) {
        Resource resource = resourceRepository.findByIdAndStatus(resourceId, ResourceStatus.APPROVED)
                .orElseThrow(() -> new EntityNotFoundException("Approved resource not found"));

        Optional<Bookmark> existing = bookmarkRepository.findByUserIdAndResourceId(currentUser.getId(), resourceId);
        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
            return false;
        } else {
            Bookmark bookmark = new Bookmark();
            bookmark.setUser(currentUser);
            bookmark.setResource(resource);
            bookmarkRepository.save(bookmark);
            return true;
        }
    }

    @Override
    public Page<ResourceCardDto> getUserBookmarks(User currentUser, Pageable pageable) {
        Page<Bookmark> bookmarks = bookmarkRepository.findByUserId(currentUser.getId(), pageable);
        return bookmarks.map(b -> ResourceCardDto.fromEntity(b.getResource(), true));
    }

    @Override
    @Transactional
    public void reportResource(Long resourceId, ReportRequestDto dto, User currentUser) {
        Resource resource = resourceRepository.findByIdAndStatus(resourceId, ResourceStatus.APPROVED)
                .orElseThrow(() -> new EntityNotFoundException("Approved resource not found"));

        if (resource.getUploader().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You cannot report your own uploaded resource.");
        }

        boolean alreadyReported = resourceReportRepository.existsByReporterIdAndResourceIdAndStatus(
                currentUser.getId(), resourceId, RequestStatus.PENDING_MODERATION);
        if (alreadyReported) {
            throw new IllegalStateException("You already have a pending report submitted for this resource.");
        }

        ResourceReport report = new ResourceReport();
        report.setResource(resource);
        report.setReporter(currentUser);
        report.setCategory(dto.getCategory());
        report.setExplanation(dto.getExplanation());
        report.setStatus(RequestStatus.PENDING_MODERATION);

        resourceReportRepository.save(report);

        // notificationService.notifyModeratorsForReport(report);
    }

    @Override
    @Transactional
    public ResourceDownloadResponse incrementAndGetDownloadUrl(
            Long resourceId,
            User currentUser) {

        Resource resource = resourceRepository
                .findByIdAndStatus(resourceId, ResourceStatus.APPROVED)
                .orElseThrow(() ->
                        new EntityNotFoundException("Approved resource not found"));

        String downloadUrl =
                fileStorageService.generateSecureDownloadToken(resource);

        return new ResourceDownloadResponse(
                downloadUrl,
                resource.getOriginalFilename(),
                resource.getDownloadCount() == null
                        ? 0L
                        : resource.getDownloadCount()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Resource getApprovedResourceForDownload(Long resourceId) {
        return resourceRepository
                .findByIdAndStatus(resourceId, ResourceStatus.APPROVED)
                .orElseThrow(() ->
                        new EntityNotFoundException("Approved resource not found"));
    }

    @Override
    public Page<ResourceCardDto> getFilteredApprovedResources(
            String resourceType,
            String branch,
            String subject,
            String semester,
            String chapterUnit,
            String sortBy,
            Pageable pageable) {

        Pageable sortedPageable = pageable;
        if (sortBy != null && !sortBy.isBlank()) {
            org.springframework.data.domain.Sort sort = switch (sortBy.toLowerCase()) {
                case "rating", "averagerating" ->
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "averageRating");
                case "downloads", "downloadcount" ->
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "downloadCount");
                case "oldest" ->
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "createdAt");
                default ->
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt");
            };
            sortedPageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        }

        Page<Resource> resources = resourceRepository.findFilteredApprovedResources(
                ResourceStatus.APPROVED,
                resourceType != null && !resourceType.isBlank() ? resourceType : null,
                branch != null && !branch.isBlank() ? branch : null,
                subject != null && !subject.isBlank() ? subject : null,
                semester != null && !semester.isBlank() ? semester : null,
                chapterUnit != null && !chapterUnit.isBlank() ? chapterUnit : null,
                sortedPageable
        );

        return resources.map(resource -> ResourceCardDto.fromEntity(resource, false));
    }


    private Workspace validateWorkspaceMembership(Long workspaceId, User currentUser) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Workspace not found"));

        boolean isMember = workspaceMemberRepository
                .existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId());

        if (!isMember) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not a member of this workspace");
        }

        return workspace;
    }

    private Resource validateApprovedResource(Long resourceId) {
        return resourceRepository.findByIdAndStatus(
                        resourceId, ResourceStatus.APPROVED)
                .orElseThrow(() ->
                        new EntityNotFoundException("Approved resource not found"));
    }


    @Override
    @Transactional
    public void shareResourceWithWorkspace(
            Long workspaceId,
            Long resourceId,
            User currentUser) {

        Workspace workspace =
                validateWorkspaceMembership(workspaceId, currentUser);

        Resource resource = validateApprovedResource(resourceId);

        boolean alreadyShared =
                workspaceResourceRepository
                        .existsByWorkspaceIdAndResourceId(
                                workspaceId, resourceId);

        if (alreadyShared) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "This resource is already shared with this workspace"
            );
        }

        WorkspaceResource workspaceResource = new WorkspaceResource();
        workspaceResource.setWorkspace(workspace);
        workspaceResource.setResource(resource);
        workspaceResource.setSharedBy(currentUser);

        try {
            workspaceResourceRepository.saveAndFlush(workspaceResource);
        } catch (DataIntegrityViolationException ex) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "This resource is already shared with this workspace",
                    ex
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.core.io.Resource getWorkspaceResourcePreview(
            Long workspaceId,
            Long resourceId,
            User currentUser) {
        validateWorkspaceMembership(workspaceId, currentUser);

        WorkspaceResource sharedResource = workspaceResourceRepository
                .findByWorkspaceIdAndResourceId(workspaceId, resourceId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Resource is not shared with this workspace"));

        Resource resource = validateApprovedResource(
                sharedResource.getResource().getId());

        return fileStorageService.loadResourceFileAsResource(resource);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkspaceResourceResponseDto> getWorkspaceResources(
            Long workspaceId,
            User currentUser,
            Pageable pageable) {

        validateWorkspaceMembership(workspaceId, currentUser);

        return workspaceResourceRepository
                .findByWorkspaceId(workspaceId, pageable)
                .map(workspaceResource -> {
                    Resource resource = workspaceResource.getResource();
                    return new WorkspaceResourceResponseDto(
                            workspaceResource.getId(),
                            resource.getId(),
                            resource.getTitle(),
                            resource.getSubject().name(),
                            resource.getResourceType().name(),
                            resource.getSemester().name(),
                            resource.getChapterUnit(),
                            resource.getBranch().name(),
                            resource.getDescription(),
                            workspaceResource.getSharedBy().getName(),
                            workspaceResource.getSharedAt()

                    );
                }
        );
    }
}