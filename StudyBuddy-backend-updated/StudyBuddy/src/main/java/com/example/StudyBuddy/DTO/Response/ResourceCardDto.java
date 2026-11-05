
package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Entity.Resource;
import com.example.StudyBuddy.Enum.BranchEnum;
import com.example.StudyBuddy.Enum.ResourceType;
import com.example.StudyBuddy.Enum.SemesterEnum;
import com.example.StudyBuddy.Enum.SubjectEnum;

public class ResourceCardDto {

    private Long id;
    private String title;
    private String subject;
    private String resourceType;
    private String semester;
    private String branch;
    private String chapterUnit;
    private String description;
    private String originalFilename;
    private Long fileSize;
    private String status;
    private Double averageRating;
    private Integer ratingCount;
    private Long downloadCount;
    private boolean bookmarked;

    public ResourceCardDto() {
    }

    public ResourceCardDto(
            Long id,
            String title,
            String subject,
            String resourceType,
            String semester,
            String branch,
            String chapterUnit,
            String description,
            String originalFilename,
            Long fileSize,
            String status,
            Double averageRating,
            Integer ratingCount,
            Long downloadCount,
            boolean bookmarked
    ) {
        this.id = id;
        this.title = title;
        this.subject = subject;
        this.resourceType = resourceType;
        this.semester = semester;
        this.branch = branch;
        this.chapterUnit = chapterUnit;
        this.description = description;
        this.originalFilename = originalFilename;
        this.fileSize = fileSize;
        this.status = status != null ? status.toLowerCase() : null;
        this.averageRating = averageRating;
        this.ratingCount = ratingCount;
        this.downloadCount = downloadCount;
        this.bookmarked = bookmarked;
    }

    public ResourceCardDto(
            Long id,
            String title,
            SubjectEnum subject,
            ResourceType resourceType,
            SemesterEnum semester,
            BranchEnum branch,
            String chapterUnit,
            String description,
            String originalFilename,
            Long fileSize,
            String status,
            Double averageRating,
            Integer ratingCount,
            Long downloadCount,
            boolean bookmarked
    ) {
        this(
                id,
                title,
                subject != null ? subject.name() : null,
                resourceType != null ? resourceType.name() : null,
                semester != null ? semester.name() : null,
                branch != null ? branch.name() : null,
                chapterUnit,
                description,
                originalFilename,
                fileSize,
                status,
                averageRating,
                ratingCount,
                downloadCount,
                bookmarked
        );
    }

    public static ResourceCardDto fromEntity(
            Resource resource,
            boolean bookmarked
    ) {
        if (resource == null) {
            return null;
        }

        return new ResourceCardDto(
                resource.getId(),
                resource.getTitle(),
                resource.getSubject(),
                resource.getResourceType(),
                resource.getSemester(),
                resource.getBranch(),
                resource.getChapterUnit(),
                resource.getDescription(),
                resource.getOriginalFilename(),
                resource.getFileSize(),
                resource.getStatus() != null
                        ? resource.getStatus().name()
                        : null,
                resource.getAverageRating(),
                resource.getRatingCount(),
                resource.getDownloadCount(),
                bookmarked
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getChapterUnit() {
        return chapterUnit;
    }

    public void setChapterUnit(String chapterUnit) {
        this.chapterUnit = chapterUnit;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(Integer ratingCount) {
        this.ratingCount = ratingCount;
    }

    public Long getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(Long downloadCount) {
        this.downloadCount = downloadCount;
    }

    public boolean isBookmarked() {
        return bookmarked;
    }

    public void setBookmarked(boolean bookmarked) {
        this.bookmarked = bookmarked;
    }
}
