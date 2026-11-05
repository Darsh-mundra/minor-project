package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Response.FileResponseDto;
import com.example.StudyBuddy.DTO.Response.ResourceDownloadResponse;
import com.example.StudyBuddy.Entity.FileMetadata;
import com.example.StudyBuddy.Entity.User;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.util.List;

public interface FileStorageService {

    FileResponseDto storeFile(MultipartFile file, User uploader);

    List<FileResponseDto> getFilesByUser(Long userId);

    FileMetadata getFileMetadata(Long fileId, User currentUser)
            throws FileNotFoundException;

    Resource loadFileAsResource(Long fileId, User currentUser)
            throws FileNotFoundException;

    org.springframework.core.io.Resource loadResourceFileAsResource(
            com.example.StudyBuddy.Entity.Resource resource);

    void deleteFile(Long fileId, User currentUser)
            throws FileNotFoundException;

    String extractTextFromPdf(String filePath);

    void promoteToPublicStorage(
            com.example.StudyBuddy.Entity.Resource resource);

    void validatePdfFile(MultipartFile file);

    String storeStagingFile(MultipartFile file);

    String generateSecureDownloadToken(
            com.example.StudyBuddy.Entity.Resource resource);

    void promoteToPublic(String storageFilePath);

    String storeResourceFile(MultipartFile file);
}
