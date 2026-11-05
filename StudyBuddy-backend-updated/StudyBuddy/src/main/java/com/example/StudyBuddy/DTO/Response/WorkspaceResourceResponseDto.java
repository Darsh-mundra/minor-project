
package com.example.StudyBuddy.DTO.Response;

import java.time.LocalDateTime;

public record WorkspaceResourceResponseDto(
        Long id,
        Long resourceId,
        String title,
        String subject,
        String resourceType,
        String semester,
        String chapterUnit,
        String branch,
        String description,
        String sharedByName,
        LocalDateTime sharedAt
) {
}
