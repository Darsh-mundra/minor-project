package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.OpportunityCategory;
import com.example.StudyBuddy.Enum.OpportunityMode;
import com.example.StudyBuddy.Enum.OpportunityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpportunityResponseDto {

    private Long id;
    private String providerName;
    private String title;
    private String description;
    private OpportunityCategory category;
    private String opportunityType;
    private String organizer;
    private String detailsUrl;
    private String applyUrl;
    private String location;
    private OpportunityMode mode;
    private String skills;
    private String eligibility;
    private Instant publicationDate;
    private Instant deadline;
    private OpportunityStatus status;
    private String sourceAttribution;
    private boolean saved;

}