package com.example.StudyBuddy.Entity;

import com.example.StudyBuddy.Enum.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "resources", indexes = {
        @Index(name = "idx_resource_normalized_title", columnList = "normalizedTitle", unique = true),
        @Index(name = "idx_resource_status", columnList = "status"),
        @Index(name = "idx_resource_branch_subject", columnList = "branch, subject")
})
@Data
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String normalizedTitle;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubjectEnum subject;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType resourceType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SemesterEnum semester;

    @NotBlank
    @Column(nullable = false)
    private String chapterUnit;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BranchEnum branch;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String storageFilePath;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private Long fileSize;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status = ResourceStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    private Double averageRating = 0.0;
    private Integer ratingCount = 0;
    private Long downloadCount = 0L;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

//    @OneToMany(mappedBy = "resource", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<TeacherReviewAudit> reviewAudits = new ArrayList<>();

    public void setTitle(String title) {
        this.title = title;
        if (title != null) {
            this.normalizedTitle = title.trim().toLowerCase().replaceAll("\\s+", " ");
        }
    }

    private Set<Report> reports = new HashSet<>();

    public Set<Report> getReports() {
        return this.reports;
    }
}