package com.example.StudyBuddy.DTO.Response;

public class ResourceDownloadResponse {
    private String downloadUrl;
    private String originalFilename;
    private Long totalDownloads;

    public ResourceDownloadResponse(String downloadUrl, String originalFilename, Long totalDownloads) {
        this.downloadUrl = downloadUrl;
        this.originalFilename = originalFilename;
        this.totalDownloads = totalDownloads;
    }

    // Getters and Setters
    public String getDownloadUrl() { return downloadUrl; }
    public void setDownloadUrl(String downloadUrl) { this.downloadUrl = downloadUrl; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public Long getTotalDownloads() { return totalDownloads; }
    public void setTotalDownloads(Long totalDownloads) { this.totalDownloads = totalDownloads; }


}