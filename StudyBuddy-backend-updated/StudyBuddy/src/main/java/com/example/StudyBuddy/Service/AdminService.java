package com.example.StudyBuddy.Service;


import com.example.StudyBuddy.DTO.Response.AdminStatsResponseDTO;
import org.apache.coyote.BadRequestException;

public interface AdminService {

    AdminStatsResponseDTO getAdminStats();

    void toggleUserDisabled(Long userId, String currentAdminEmail) throws BadRequestException;

    void deleteResource(Long resourceId);

    void deleteDiscussion(Long discussionId);
}