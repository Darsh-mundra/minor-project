package com.example.StudyBuddy.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceTaskDto {
    private Long id;
    private String title;
    private Long assigneeId;
    private String assigneeName;
    private LocalDate dueDate;
    private Boolean completed;
}