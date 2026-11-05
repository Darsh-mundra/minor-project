package com.example.StudyBuddy.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class RecentActivityDTO {
    private String type;
    private String text;
    private LocalDateTime at;
}
