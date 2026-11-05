package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPublicResponseDTO {
    private Long id;
    private String name;
    private String email;
    private Role role;
}