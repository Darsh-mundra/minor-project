package com.example.StudyBuddy.DTO.Response;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class FileResponseDto {
    // Getters and Setters
    private Long id;
    private String originalFilename;
    private String contentType;
    private String fileExtension;
    private Long fileSize;
    private String category;
    private LocalDateTime createdAt;
    private String downloadUrl;
    private String viewUrl;

    public FileResponseDto(Long id, String originalFilename, String contentType, String fileExtension,
                           Long fileSize, String category, LocalDateTime createdAt) {
        this.id = id;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.fileExtension = fileExtension;
        this.fileSize = fileSize;
        this.category = category;
        this.createdAt = createdAt;
        this.downloadUrl = "/api/files/download/" + id;
        this.viewUrl = "/api/files/view/" + id;
    }

    public LocalDateTime createdAt() { return createdAt; }
}
