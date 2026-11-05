package com.unicollab.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resources", indexes = {
    @Index(name = "idx_resource_hash", columnList = "file_hash_sha256"),
    @Index(name = "idx_resource_subject", columnList = "subject")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String branch;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false)
    private String subject;

    private String unit;
    private String topic;

    @Column(name = "resource_type", nullable = false)
    private String resourceType;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_size")
    private String fileSize;

    /**
     * Exact SHA-256 checksum used to guarantee that identical files are not re-uploaded.
     */
    @Column(name = "file_hash_sha256", nullable = false, unique = true, length = 64)
    private String fileHashSha256;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @Column(name = "upload_date", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime uploadDate = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private Double rating = 5.0;

    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private Integer ratingCount = 1;

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Integer downloadCount = 0;

    @Column(name = "helpful_votes", nullable = false)
    @Builder.Default
    private Integer helpfulVotes = 0;

    @Column(name = "reports_count", nullable = false)
    @Builder.Default
    private Integer reportsCount = 0;

    @Column(name = "is_reported", nullable = false)
    @Builder.Default
    private Boolean isReported = false;
}
