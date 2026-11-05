package com.example.StudyBuddy.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "user_saved_opportunities",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "opportunity_id"}),
        indexes = {
                @Index(name = "idx_user_saved_user_id", columnList = "user_id"),
                @Index(name = "idx_user_saved_saved_at", columnList = "savedAt")
        }
)
@Data
public class UserSavedOpportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opportunity_id", nullable = false)
    private Opportunity opportunity;

    @Column(nullable = false)
    private Instant savedAt;

    @PrePersist
    protected void onSave() {
        savedAt = Instant.now();
    }

    public Opportunity getOpportunity() {
        return null;
    }

    // Getters, Setters, Constructors
}