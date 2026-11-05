package com.example.StudyBuddy.Service.ServiceImpl;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class ClassroomStorageService {

    @Value("${app.storage.classroom-dir:uploads/classroom}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize classroom storage directory", e);
        }
    }

    public void validatePdfFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        // Check content type & extension
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();

        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed. Invalid type: " + contentType);
        }

        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("File must have a .pdf extension");
        }

        // Optional Magic Byte verification for robust PDF validation (%PDF-)
        try {
            byte[] header = new byte[4];
            int bytesRead = file.getInputStream().read(header);
            if (bytesRead < 4 || header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) {
                throw new IllegalArgumentException("Invalid PDF file format or corrupted header.");
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file headers for validation", e);
        }
    }

    public StoredFileResult storeFile(MultipartFile file) {
        validatePdfFile(file);

        String cleanFilename = StringUtils.cleanPath(file.getOriginalFilename());
        if (cleanFilename.contains("..")) {
            throw new IllegalArgumentException("Path traversal sequence detected in filename: " + cleanFilename);
        }

        String storageFilename = UUID.randomUUID().toString() + "_" + cleanFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
        Path destinationPath = this.rootLocation.resolve(storageFilename).normalize();

        if (!destinationPath.getParent().equals(this.rootLocation)) {
            throw new SecurityException("Cannot store file outside designated directory.");
        }

        try {
            Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + cleanFilename, e);
        }

        return new StoredFileResult(cleanFilename, storageFilename, destinationPath.toString(), file.getSize(), file.getContentType());
    }

    public Path loadFileAsPath(String storageFilename) {
        Path filePath = rootLocation.resolve(storageFilename).normalize();
        if (!filePath.getParent().equals(rootLocation)) {
            throw new SecurityException("Access denied: path traversal attempt.");
        }
        if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
            throw new RuntimeException("Requested file not found or unreadable.");
        }
        return filePath;
    }

    public void deleteFileByPath(String storagePath) {
        try {
            Path path = Paths.get(storagePath);
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // Log warning if necessary
        }
    }

    @AllArgsConstructor
    @Getter
    public static class StoredFileResult {
        private String originalFilename;
        private String storageFilename;
        private String storagePath;
        private Long fileSize;
        private String contentType;
    }
}