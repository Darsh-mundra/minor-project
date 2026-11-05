package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Entity.Resource;
import com.example.StudyBuddy.Enum.BranchEnum;
import com.example.StudyBuddy.Enum.ResourceType;
import com.example.StudyBuddy.Enum.SemesterEnum;
import com.example.StudyBuddy.Enum.SubjectEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class ResourceResponseDto {

    private Long id;
    private String title;
    private String subject;
    private String resourceType;
    private String semester;
    private String chapterUnit;
    private String branch;
    private String description;
    private String originalFilename;
    private Long fileSize;
    private String status;
    private Double averageRating;
    private Integer ratingCount;
    private Integer downloadCount;
    private Long uploaderId;
    private String uploaderUsername;
    private LocalDateTime createdAt;

    public ResourceResponseDto() {}

    public ResourceResponseDto(Long id, String title, String subject, String resourceType, String semester,
                               String chapterUnit, String branch, String description, String originalFilename,
                               Long fileSize, String status, Double averageRating, Integer ratingCount,
                               Integer downloadCount, Long uploaderId, String uploaderUsername, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.subject = subject;
        this.resourceType = resourceType;
        this.semester = semester;
        this.chapterUnit = chapterUnit;
        this.branch = branch;
        this.description = description;
        this.originalFilename = originalFilename;
        this.fileSize = fileSize;
        this.status = status;
        this.averageRating = averageRating;
        this.ratingCount = ratingCount;
        this.downloadCount = downloadCount;
        this.uploaderId = uploaderId;
        this.uploaderUsername = uploaderUsername;
        this.createdAt = createdAt;
    }

    public ResourceResponseDto(Long id, @NotBlank String title, @NotNull SubjectEnum subject, @NotNull ResourceType resourceType, @NotNull SemesterEnum semester, @NotBlank String chapterUnit, @NotNull BranchEnum branch, String description, String originalFilename, Long fileSize, String status, Double averageRating, Integer ratingCount, Long downloadCount, Long uploaderId, String uploaderUsername, LocalDateTime createdAt) {
    }

    public static ResourceResponseDto fromEntity(Resource resource) {
        if (resource == null) {
            return null;
        }
        return new ResourceResponseDto(
                resource.getId(),
                resource.getTitle(),
                resource.getSubject(),
                resource.getResourceType(),
                resource.getSemester(),
                resource.getChapterUnit(),
                resource.getBranch(),
                resource.getDescription(),
                resource.getOriginalFilename(),
                resource.getFileSize(),
                resource.getStatus() != null ? resource.getStatus().name() : null,
                resource.getAverageRating(),
                resource.getRatingCount(),
                resource.getDownloadCount(),
                resource.getUploader() != null ? resource.getUploader().getId() : null,
                resource.getUploader() != null ? resource.getUploader().getName() : null,
                resource.getCreatedAt()
        );
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getChapterUnit() { return chapterUnit; }
    public void setChapterUnit(String chapterUnit) { this.chapterUnit = chapterUnit; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Integer getRatingCount() { return ratingCount; }
    public void setRatingCount(Integer ratingCount) { this.ratingCount = ratingCount; }

    public Integer getDownloadCount() { return downloadCount; }
    public void setDownloadCount(Integer downloadCount) { this.downloadCount = downloadCount; }

    public Long getUploaderId() { return uploaderId; }
    public void setUploaderId(Long uploaderId) { this.uploaderId = uploaderId; }

    public String getUploaderUsername() { return uploaderUsername; }
    public void setUploaderUsername(String uploaderUsername) { this.uploaderUsername = uploaderUsername; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
