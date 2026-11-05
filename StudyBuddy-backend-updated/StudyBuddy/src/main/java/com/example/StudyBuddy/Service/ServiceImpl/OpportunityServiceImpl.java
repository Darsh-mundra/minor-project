package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Response.OpportunityResponseDto;
import com.example.StudyBuddy.Entity.Opportunity;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.UserSavedOpportunity;
import com.example.StudyBuddy.Enum.OpportunityCategory;
import com.example.StudyBuddy.Enum.OpportunityMode;
import com.example.StudyBuddy.Enum.OpportunityStatus;
import com.example.StudyBuddy.Exception.ResourceNotFoundException;
import com.example.StudyBuddy.Repository.OpportunityRepository;
import com.example.StudyBuddy.Repository.UserSavedOpportunityRepository;
import com.example.StudyBuddy.Service.OpportunityService;
import com.example.StudyBuddy.Util.UrlValidator;
import org.apache.coyote.BadRequestException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OpportunityServiceImpl implements OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final UserSavedOpportunityRepository savedOpportunityRepository;

    public OpportunityServiceImpl(OpportunityRepository opportunityRepository,
                              UserSavedOpportunityRepository savedOpportunityRepository) {
        this.opportunityRepository = opportunityRepository;
        this.savedOpportunityRepository = savedOpportunityRepository;
    }

    @Transactional(readOnly = true)
    public Page<OpportunityResponseDto> getOpportunities(
            OpportunityCategory category,
            OpportunityStatus status,
            OpportunityMode mode,
            String location,
            String skill,
            String keyword,
            Pageable pageable,
            User currentUser
    ) {
        Page<Opportunity> opportunities = opportunityRepository.findOpportunities(
                category, status, mode, location, skill, keyword, pageable
        );

        Set<Long> savedOpportunityIds = Set.of();
        if (currentUser != null) {
            List<UserSavedOpportunity> savedList = savedOpportunityRepository.findByUserOrderBySavedAtDesc(currentUser, Pageable.unpaged()).getContent();
            savedOpportunityIds = savedList.stream()
                    .map(s -> s.getOpportunity().getId())
                    .collect(Collectors.toSet());
        }

        final Set<Long> finalSavedIds = savedOpportunityIds;

        // Custom comparator for Priority A: Saved opportunities before unsaved opportunities
        List<OpportunityResponseDto> sortedContent = opportunities.getContent().stream()
                .map(opp -> {
                    try {
                        return mapToDto(opp, finalSavedIds.contains(opp.getId()));
                    } catch (BadRequestException e) {
                        throw new RuntimeException(e);
                    }
                })
                .sorted((o1, o2) -> {
                    boolean s1 = o1.isSaved();
                    boolean s2 = o2.isSaved();
                    if (s1 && !s2) return -1;
                    if (!s1 && s2) return 1;
                    return 0; // preserve pagination order within groups
                })
                .collect(Collectors.toList());

        return new PageImpl<>(sortedContent, pageable, opportunities.getTotalElements());
    }

    @Transactional(readOnly = true)
    public OpportunityResponseDto getOpportunityById(Long id, User currentUser) throws BadRequestException {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));

        boolean isSaved = false;
        if (currentUser != null) {
            isSaved = savedOpportunityRepository.existsByUserAndOpportunity(currentUser, opportunity);
        }

        return mapToDto(opportunity, isSaved);
    }

    @Transactional
    public void saveOpportunity(User user, Long opportunityId) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + opportunityId));

        if (!savedOpportunityRepository.existsByUserAndOpportunity(user, opportunity)) {
            UserSavedOpportunity saved = new UserSavedOpportunity();
            saved.setUser(user);
            saved.setOpportunity(opportunity);
            savedOpportunityRepository.save(saved);
        }
    }

    @Transactional
    public void unsaveOpportunity(User user, Long opportunityId) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + opportunityId));

        if (savedOpportunityRepository.existsByUserAndOpportunity(user, opportunity)) {
            savedOpportunityRepository.deleteByUserAndOpportunity(user, opportunity);
        }
    }

    @Transactional(readOnly = true)
    public Page<OpportunityResponseDto> getSavedOpportunities(User user, Pageable pageable) {
        Page<UserSavedOpportunity> savedPages = savedOpportunityRepository.findByUserOrderBySavedAtDesc(user, pageable);
        List<OpportunityResponseDto> content = savedPages.getContent().stream()
                .map(s -> {
                    try {
                        return mapToDto(s.getOpportunity(), true);
                    } catch (BadRequestException e) {
                        throw new RuntimeException(e);
                    }
                })
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, savedPages.getTotalElements());
    }

    private OpportunityResponseDto mapToDto(Opportunity opp, boolean isSaved) throws BadRequestException {
        OpportunityResponseDto dto = new OpportunityResponseDto();
        dto.setId(opp.getId());
        dto.setProviderName(opp.getProviderName());
        dto.setTitle(opp.getTitle());
        dto.setDescription(opp.getDescription());
        dto.setCategory(opp.getCategory());
        dto.setOpportunityType(opp.getOpportunityType());
        dto.setOrganizer(opp.getOrganizer());
        dto.setDetailsUrl(UrlValidator.validateAndSanitizeUrl(opp.getDetailsUrl()));
        dto.setApplyUrl(UrlValidator.validateAndSanitizeUrl(opp.getApplyUrl()));
        dto.setLocation(opp.getLocation());
        dto.setMode(opp.getMode());
        dto.setSkills(opp.getSkills());
        dto.setEligibility(opp.getEligibility());
        dto.setPublicationDate(opp.getPublicationDate());
        dto.setDeadline(opp.getDeadline());
        dto.setStatus(opp.getStatus());
        dto.setSourceAttribution(opp.getSourceAttribution());
        dto.setSaved(isSaved);
        return dto;
    }
}