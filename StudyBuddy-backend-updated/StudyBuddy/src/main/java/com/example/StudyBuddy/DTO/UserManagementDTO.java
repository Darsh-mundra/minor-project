package com.example.StudyBuddy.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class UserManagementDTO {
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private int points;
    private boolean disabled;
}
