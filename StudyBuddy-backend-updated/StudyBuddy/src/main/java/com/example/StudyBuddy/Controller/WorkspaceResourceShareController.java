
package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Response.WorkspaceResourceShareResponse;
import com.example.StudyBuddy.Service.WorkspaceResourceShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/resource-shares")
@RequiredArgsConstructor
public class WorkspaceResourceShareController {

    private final WorkspaceResourceShareService shareService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WorkspaceResourceShareResponse> createShare(
            @PathVariable Long workspaceId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {

        String userEmail = getAuthenticatedUserEmail(authentication);

        WorkspaceResourceShareResponse response = shareService.createShare(
                workspaceId, userEmail, title, description, files);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<WorkspaceResourceShareResponse>> getWorkspaceShares(
            @PathVariable Long workspaceId,
            @PageableDefault(size = 10) Pageable pageable,
            Authentication authentication) {

        String userEmail = getAuthenticatedUserEmail(authentication);

        Page<WorkspaceResourceShareResponse> shares =
                shareService.getWorkspaceShares(workspaceId, userEmail, pageable);

        return ResponseEntity.ok(shares);
    }

    @GetMapping("/{shareId}")
    public ResponseEntity<WorkspaceResourceShareResponse> getShareDetails(
            @PathVariable Long workspaceId,
            @PathVariable Long shareId,
            Authentication authentication) {

        String userEmail = getAuthenticatedUserEmail(authentication);

        WorkspaceResourceShareResponse response =
                shareService.getShareDetails(workspaceId, shareId, userEmail);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{shareId}/files/{fileId}/preview")
    public ResponseEntity<Resource> previewFile(
            @PathVariable Long workspaceId,
            @PathVariable Long shareId,
            @PathVariable Long fileId,
            Authentication authentication) {

        String userEmail = getAuthenticatedUserEmail(authentication);

        try {
            Path filePath = shareService.getFileStreamPath(
                    workspaceId, shareId, fileId, userEmail);

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\""
                    )
                    .body(resource);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private String getAuthenticatedUserEmail(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException(
                    "Authentication required");
        }

        return authentication.getName();
    }
}
