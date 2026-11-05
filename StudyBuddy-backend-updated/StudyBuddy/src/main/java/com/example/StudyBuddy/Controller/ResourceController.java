
package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Request.RatingRequestDto;
import com.example.StudyBuddy.DTO.Request.ReportRequestDto;
import com.example.StudyBuddy.DTO.Request.ResourceSubmissionDto;
import com.example.StudyBuddy.DTO.Response.*;
import com.example.StudyBuddy.Entity.Resource;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.WorkspaceResource;
import com.example.StudyBuddy.Enum.SemesterEnum;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.FileStorageService;
import com.example.StudyBuddy.Service.ResourceService;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public ResourceController(
            ResourceService resourceService,
            UserRepository userRepository,
            FileStorageService fileStorageService) {
        this.resourceService = resourceService;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException(
                    "User is not authenticated"
            );
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Authenticated user not found"));
    }

    // 1. Upload resource
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponseDto> submitResource(
            @Valid @ModelAttribute ResourceSubmissionDto submissionDto,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);

        Resource resource = resourceService.submitResource(
                submissionDto,
                file,
                currentUser
        );

        return ResponseEntity.ok(
                ResourceResponseDto.fromEntity(resource)
        );
    }

    // 2. Get approved resource library
    @GetMapping("/library")
    public ResponseEntity<Page<ResourceCardDto>> getApprovedResources(
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) SemesterEnum semester,
            @RequestParam(required = false) String chapterUnit,
            @RequestParam(defaultValue = "recent") String sortBy,
            Pageable pageable) {

        return ResponseEntity.ok(
                resourceService.getFilteredApprovedResources(
                        resourceType,
                        branch,
                        subject,
                        semester == null ? null : semester.name(),
                        chapterUnit,
                        sortBy,
                        pageable
                )
        );
    }

    // 3. Rate resource
    @PostMapping("/{id}/rating")
    public ResponseEntity<Void> rateResource(
            @PathVariable Long id,
            @Valid @RequestBody RatingRequestDto request,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);

        resourceService.rateResource(
                id,
                request.getRating(),
                currentUser
        );

        return ResponseEntity.noContent().build();
    }

    // 4. Toggle bookmark
    @PostMapping("/{id}/bookmark")
    public ResponseEntity<Boolean> toggleBookmark(
            @PathVariable Long id,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                resourceService.toggleBookmark(id, currentUser)
        );
    }

    // 5. Get current user's bookmarks
    @GetMapping("/bookmarks")
    public ResponseEntity<Page<ResourceCardDto>> getUserBookmarks(
            Authentication authentication,
            Pageable pageable) {

        User currentUser = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                resourceService.getUserBookmarks(
                        currentUser,
                        pageable
                )
        );
    }

    // 6. Report resource
    @PostMapping("/{id}/report")
    public ResponseEntity<Void> reportResource(
            @PathVariable Long id,
            @Valid @RequestBody ReportRequestDto request,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);

        resourceService.reportResource(
                id,
                request,
                currentUser
        );

        return ResponseEntity.noContent().build();
    }

    // 7. Download resource directly
    // 7. Download resource dynamically with correct content type
    @GetMapping("/{id}/file")
    public ResponseEntity<org.springframework.core.io.Resource> downloadResource(
            @PathVariable Long id,
            Authentication authentication) throws FileNotFoundException {

        User currentUser = getAuthenticatedUser(authentication);

        Resource resource =
                resourceService.getApprovedResourceForDownload(id);

        org.springframework.core.io.Resource file =
                fileStorageService.loadResourceFileAsResource(resource);

        String filename = resource.getOriginalFilename();

        if (filename == null || filename.isBlank()) {
            filename = "resource-" + id;
        }

        // Prevent header injection from filenames
        filename = filename.replace("\"", "")
                .replace("\r", "")
                .replace("\n", "");

        // Dynamically determine media type based on filename/extension
        MediaType mediaType = MediaTypeFactory.getMediaType(filename)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\""
                )
                .body(file);
    }

    @PostMapping("/workspaces/{workspaceId}/resources/{resourceId}")
    public ResponseEntity<?> shareResourceWithWorkspace(
            @PathVariable Long workspaceId,
            @PathVariable Long resourceId,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);

        resourceService.shareResourceWithWorkspace(
                workspaceId, resourceId, currentUser);

        return ResponseEntity.ok(
                java.util.Map.of("message", "Resource shared with workspace successfully"));
    }


    @GetMapping("/workspaces/{workspaceId}/resources")
    public ResponseEntity<Page<WorkspaceResourceResponseDto>> getWorkspaceResources(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        if (page < 0 || size < 1 || size > 50) {
            throw new IllegalArgumentException(
                    "Page must be non-negative and size must be between 1 and 50"
            );
        }

        User currentUser = getAuthenticatedUser(authentication);

        Page<WorkspaceResourceResponseDto> resources =
                resourceService.getWorkspaceResources(
                        workspaceId,
                        currentUser,
                        PageRequest.of(page, size)
                );

        return ResponseEntity.ok(resources);
    }


    @GetMapping("/workspaces/{workspaceId}/resources/{resourceId}/preview")
    public ResponseEntity<org.springframework.core.io.Resource> previewWorkspaceResource(
            @PathVariable Long workspaceId,
            @PathVariable Long resourceId,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);

        org.springframework.core.io.Resource pdf =
                resourceService.getWorkspaceResourcePreview(
                        workspaceId,
                        resourceId,
                        currentUser
                );

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header(
                        org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"workspace-resource.pdf\""
                )
                .header(
                        "X-Content-Type-Options",
                        "nosniff"
                )
                .header(
                        org.springframework.http.HttpHeaders.CACHE_CONTROL,
                        "private, no-store, no-cache, must-revalidate"
                )
                .body(pdf);
    }
}
