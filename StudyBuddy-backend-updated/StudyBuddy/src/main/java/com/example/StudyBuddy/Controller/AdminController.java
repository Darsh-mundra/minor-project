package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Response.AdminStatsResponseDTO;
import com.example.StudyBuddy.Service.AdminService;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponseDTO> getAdminStats() {
        return ResponseEntity.ok(adminService.getAdminStats());
    }

    @PatchMapping("/users/{userId}/toggle-disabled")
    public ResponseEntity<?> toggleUserDisabled(@PathVariable Long userId,
                                                @AuthenticationPrincipal UserDetails userDetails) throws BadRequestException {
        adminService.toggleUserDisabled(userId, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "User account status updated successfully."));
    }

    @DeleteMapping("/resources/{resourceId}")
    public ResponseEntity<?> deleteResource(@PathVariable Long resourceId) {
        adminService.deleteResource(resourceId);
        return ResponseEntity.ok(Map.of("message", "Resource permanently deleted."));
    }

    @DeleteMapping("/discussions/{discussionId}")
    public ResponseEntity<?> deleteDiscussion(@PathVariable Long discussionId) {
        adminService.deleteDiscussion(discussionId);
        return ResponseEntity.ok(Map.of("message", "Discussion permanently deleted."));
    }
}