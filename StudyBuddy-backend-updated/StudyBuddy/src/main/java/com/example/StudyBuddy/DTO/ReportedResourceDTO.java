package com.example.StudyBuddy.DTO;

import com.example.StudyBuddy.Enum.SubjectEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ReportedResourceDTO {
    private Long id;
    private String title;
    private SubjectEnum subject;
    private String uploaderName;
    private long reportsCount;

}

