package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Enum.Role;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponseDto {

    private UserProfileDto profile;

    private List<ResourceCardDto> recentResources;

    private WorkspaceListResponseDto workspaceData;

    private List<QuizHistoryItemDTO> recentAttempts;

    private List<OpportunityResponseDto> opportunities;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfileDto {

        private Long id;

        private String name;

        private String email;

        private Role role;

        public static UserProfileDto fromEntity(User user) {
            return new UserProfileDto(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole()
            );
        }
    }
}
