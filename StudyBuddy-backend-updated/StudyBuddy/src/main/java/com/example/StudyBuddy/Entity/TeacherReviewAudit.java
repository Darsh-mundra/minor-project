package com.example.StudyBuddy.Entity;

import com.example.StudyBuddy.Enum.ReviewDecision;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "teacher_review_audits", indexes = {
        @Index(name = "idx_resource_id", columnList = "resource_id"),
        @Index(name = "idx_teacher_id", columnList = "teacher_id"),
        @Index(name = "idx_review_timestamp", columnList = "review_timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherReviewAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewDecision decision;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "review_timestamp", nullable = false)
    private LocalDateTime reviewTimestamp;

    @PrePersist
    protected void onCreate() {
        if (reviewTimestamp == null) {
            reviewTimestamp = LocalDateTime.now();
        }
    }
}