package com.example.StudyBuddy.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserSessionDTO {
    private Long id;
    private String email;
    private String name;
    private String role; // e.g., STUDENT, TEACHER, ADMIN
}