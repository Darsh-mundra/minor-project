package com.example.StudyBuddy.Entity;

import com.example.StudyBuddy.Enum.OpportunityCategory;
import com.example.StudyBuddy.Enum.OpportunityMode;
import com.example.StudyBuddy.Enum.OpportunityStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "opportunities", indexes = {
        @Index(name = "idx_opportunity_category", columnList = "category"),
        @Index(name = "idx_opportunity_status", columnList = "status"),
        @Index(name = "idx_opportunity_provider_ext_id", columnList = "providerName, externalId", unique = true)
})
@Data
public class Opportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String providerName;

    @NotBlank
    @Column(nullable = false)
    private String externalId;

    @NotBlank
    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OpportunityCategory category;

    private String opportunityType;

    private String organizer;

    @Column(length = 1000)
    private String detailsUrl;

    @Column(length = 1000, nullable = false)
    private String applyUrl;

    private String location;

    @Enumerated(EnumType.STRING)
    private OpportunityMode mode; // REMOTE, ONSITE, HYBRID

    @Column(length = 1000)
    private String skills;

    @Column(length = 1000)
    private String eligibility;

    private Instant publicationDate;

    private Instant deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OpportunityStatus status = OpportunityStatus.ACTIVE;

    private String sourceAttribution;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (status == null) {
            status = OpportunityStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters, Setters, Constructors, Equals, HashCode
}