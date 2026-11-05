package com.example.StudyBuddy.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceSubmissionDto {

    @NotBlank(message = "Title is mandatory")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @NotBlank(message = "Subject is mandatory")
    private String subject;

    @NotBlank(message = "Resource type is mandatory")
    private String resourceType;

    private String semester;

    private String chapterUnit;

    private String branch;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

//    // Default Constructor
//    public ResourceSubmissionDto() {}
//
//    // Parameterized Constructor
//    public ResourceSubmissionDto(String title, String subject, String resourceType, String semester,
//                                 String chapterUnit, String branch, String description) {
//        this.title = title;
//        this.subject = subject;
//        this.resourceType = resourceType;
//        this.semester = semester;
//        this.chapterUnit = chapterUnit;
//        this.branch = branch;
//        this.description = description;
//    }
//
//    // Getters and Setters
//    public String getTitle() {
//        return title;
//    }
//
//    public void setTitle(String title) {
//        this.title = title;
//    }
//
//    public @NotNull SubjectEnum getSubject() {
//        return subject;
//    }
//
//    public void setSubject(String subject) {
//        this.subject = subject;
//    }
//
//    public @NotNull ResourceType getResourceType() {
//        return resourceType;
//    }
//
//    public void setResourceType(String resourceType) {
//        this.resourceType = resourceType;
//    }
//
//    public @NotNull SemesterEnum getSemester() {
//        return semester;
//    }
//
//    public void setSemester(String semester) {
//        this.semester = semester;
//    }
//
//    public String getChapterUnit() {
//        return chapterUnit;
//    }
//
//    public void setChapterUnit(String chapterUnit) {
//        this.chapterUnit = chapterUnit;
//    }
//
//    public @NotNull BranchEnum getBranch() {
//        return branch;
//    }
//
//    public void setBranch(String branch) {
//        this.branch = branch;
//    }
//
//    public String getDescription() {
//        return description;
//    }
//
//    public void setDescription(String description) {
//        this.description = description;
//    }
}
