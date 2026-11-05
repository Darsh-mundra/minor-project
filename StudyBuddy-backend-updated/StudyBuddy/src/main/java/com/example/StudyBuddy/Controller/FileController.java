package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Response.FileResponseDto;
import com.example.StudyBuddy.Entity.FileMetadata;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.FileStorageService;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;

    public FileController(
            FileStorageService fileStorageService,
            UserRepository userRepository) {
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UsernameNotFoundException("User is not authenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UsernameNotFoundException("Authenticated user not found"));
    }

    @PostMapping("/upload")
    public ResponseEntity<FileResponseDto> uploadFile(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);
        FileResponseDto response = fileStorageService.storeFile(file, currentUser);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload-multiple")
    public ResponseEntity<List<FileResponseDto>> uploadMultipleFiles(
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);

        List<FileResponseDto> responses = List.of(files).stream()
                .map(file -> fileStorageService.storeFile(file, currentUser))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping
    public ResponseEntity<List<FileResponseDto>> listUserFiles(
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);
        List<FileResponseDto> files =
                fileStorageService.getFilesByUser(currentUser.getId());

        return ResponseEntity.ok(files);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FileResponseDto> getFileMetadata(
            @PathVariable Long id,
            Authentication authentication) throws FileNotFoundException {

        User currentUser = getAuthenticatedUser(authentication);
        FileMetadata metadata =
                fileStorageService.getFileMetadata(id, currentUser);

        FileResponseDto dto = new FileResponseDto(
                metadata.getId(),
                metadata.getOriginalFilename(),
                metadata.getContentType(),
                metadata.getFileExtension(),
                metadata.getFileSize(),
                metadata.getCategory(),
                metadata.getCreatedAt()
        );

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long id,
            Authentication authentication) throws FileNotFoundException {

        User currentUser = getAuthenticatedUser(authentication);
        FileMetadata metadata =
                fileStorageService.getFileMetadata(id, currentUser);
        Resource resource =
                fileStorageService.loadFileAsResource(id, currentUser);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.getContentType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + metadata.getOriginalFilename() + "\""
                )
                .body(resource);
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<Resource> viewFileInline(
            @PathVariable Long id,
            Authentication authentication) throws FileNotFoundException {

        User currentUser = getAuthenticatedUser(authentication);
        FileMetadata metadata =
                fileStorageService.getFileMetadata(id, currentUser);
        Resource resource =
                fileStorageService.loadFileAsResource(id, currentUser);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.getContentType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + metadata.getOriginalFilename() + "\""
                )
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long id,
            Authentication authentication) throws FileNotFoundException {

        User currentUser = getAuthenticatedUser(authentication);
        fileStorageService.deleteFile(id, currentUser);

        return ResponseEntity.noContent().build();
    }
}
