package com.example.StudyBuddy.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceMindMapNodeDto {
    private Long id;
    private Long parentId;
    private String label;
    private String notes;
}
