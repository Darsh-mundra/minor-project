package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Response.OpportunityResponseDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Enum.OpportunityCategory;
import com.example.StudyBuddy.Enum.OpportunityMode;
import com.example.StudyBuddy.Enum.OpportunityStatus;
import org.apache.coyote.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OpportunityService {

    Page<OpportunityResponseDto> getOpportunities(
            OpportunityCategory category,
            OpportunityStatus status,
            OpportunityMode mode,
            String location,
            String skill,
            String keyword,
            Pageable pageable,
            User currentUser
    );

    OpportunityResponseDto getOpportunityById(Long id, User currentUser) throws BadRequestException;

    void saveOpportunity(User user, Long opportunityId);

    void unsaveOpportunity(User user, Long opportunityId);

    Page<OpportunityResponseDto> getSavedOpportunities(User user, Pageable pageable);
}