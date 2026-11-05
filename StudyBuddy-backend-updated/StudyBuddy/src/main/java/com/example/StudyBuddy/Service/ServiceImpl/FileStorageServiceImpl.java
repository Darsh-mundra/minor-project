
package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Response.FileResponseDto;
import com.example.StudyBuddy.DTO.Response.ResourceDownloadResponse;
import com.example.StudyBuddy.Entity.FileMetadata;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Exception.FileStorageException;
import com.example.StudyBuddy.Exception.InvalidFileException;
import com.example.StudyBuddy.Repository.FileMetadataRepository;
import com.example.StudyBuddy.Service.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    private final Path fileStorageLocation;
    private final FileMetadataRepository fileMetadataRepository;

    @Value("${file.upload-dir.staging:uploads/staging}")
    private String stagingDir;

    @Value("${file.upload-dir.public:uploads/public}")
    private String publicDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "pdf", "png", "jpg", "jpeg", "doc", "docx",
            "xls", "xlsx", "txt", "zip", "ppt", "pptx"
    );

    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "exe", "bat", "sh", "js", "jsp", "php",
            "py", "jar", "cmd", "vbs", "html", "htm"
    );

    public FileStorageServiceImpl(
            @Value("${app.file-storage.location:uploads}") String storageLocation,
            FileMetadataRepository fileMetadataRepository) {

        this.fileStorageLocation =
                Paths.get(storageLocation).toAbsolutePath().normalize();

        this.fileMetadataRepository = fileMetadataRepository;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(fileStorageLocation);
        } catch (IOException ex) {
            throw new FileStorageException(
                    "Could not initialize storage directory.", ex);
        }
    }

    // --------------------------------------------------
    // Existing FileMetadata upload
    // --------------------------------------------------

    @Transactional
    public FileResponseDto storeFile(MultipartFile file, User uploader) {

        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Cannot store an empty file.");
        }

        String originalFilename = cleanFilename(file);
        validateFilename(originalFilename);

        String extension = getFileExtension(originalFilename).toLowerCase(
                Locale.ROOT);

        if (DANGEROUS_EXTENSIONS.contains(extension)
                || !ALLOWED_EXTENSIONS.contains(extension)) {
            throw new InvalidFileException(
                    "File type '" + extension + "' is not permitted.");
        }

        String storedFilename =
                UUID.randomUUID() + "_" + originalFilename;
        String category = determineCategory(extension);

        Path targetLocation = fileStorageLocation
                .resolve(storedFilename)
                .normalize();

        validatePathInsideStorage(targetLocation);

        try {
            Files.createDirectories(fileStorageLocation);
            Files.copy(file.getInputStream(), targetLocation);

            FileMetadata metadata = new FileMetadata();
            metadata.setOriginalFilename(originalFilename);
            metadata.setStoredFilename(storedFilename);
            metadata.setFilePath(targetLocation.toString());
            metadata.setContentType(
                    file.getContentType() != null
                            ? file.getContentType()
                            : "application/octet-stream");
            metadata.setFileExtension(extension);
            metadata.setFileSize(file.getSize());
            metadata.setCategory(category);
            metadata.setUploader(uploader);

            FileMetadata saved = fileMetadataRepository.save(metadata);
            return mapToDto(saved);

        } catch (IOException ex) {
            throw new FileStorageException(
                    "Failed to store file " + originalFilename, ex);
        }
    }

    @Transactional(readOnly = true)
    public List<FileResponseDto> getFilesByUser(Long userId) {
        return fileMetadataRepository.findByUploaderId(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FileMetadata getFileMetadata(
            Long fileId, User currentUser) throws FileNotFoundException {

        return fileMetadataRepository.findById(fileId)
                .orElseThrow(() ->
                        new FileNotFoundException(
                                "File not found with ID: " + fileId));
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(
            Long fileId, User currentUser) throws FileNotFoundException {

        FileMetadata metadata = getFileMetadata(fileId, currentUser);

        try {
            return loadValidatedFile(metadata.getFilePath());
        } catch (FileNotFoundException ex) {
            throw ex;
        }
    }


    @Transactional
    public void deleteFile(
            Long fileId, User currentUser) throws FileNotFoundException {

        FileMetadata metadata = getFileMetadata(fileId, currentUser);

        try {
            Path filePath = resolveValidatedPath(metadata.getFilePath());
            Files.deleteIfExists(filePath);
            fileMetadataRepository.delete(metadata);
        } catch (FileNotFoundException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new FileStorageException(
                    "Failed to delete physical file: "
                            + metadata.getOriginalFilename(), ex);
        }
    }

    // --------------------------------------------------
    // ResourceHub PDF storage and download
    // --------------------------------------------------

    @Override
    public String storeResourceFile(MultipartFile file) {

        validatePdfFile(file);

        String originalFilename = cleanFilename(file);
        String storedFilename =
                UUID.randomUUID() + "_" + originalFilename;

        Path resourceDirectory = fileStorageLocation
                .resolve("resources")
                .toAbsolutePath()
                .normalize();

        Path targetLocation = resourceDirectory
                .resolve(storedFilename)
                .normalize();

        validatePathInsideStorage(targetLocation);

        if (!targetLocation.startsWith(resourceDirectory)) {
            throw new InvalidFileException("Invalid resource file path.");
        }

        try {
            Files.createDirectories(resourceDirectory);
            Files.copy(file.getInputStream(), targetLocation);

            log.info("Resource PDF stored successfully: {}", targetLocation);

            return targetLocation.toString();

        } catch (IOException ex) {
            throw new FileStorageException(
                    "Failed to store resource PDF.", ex);
        }
    }

    /**
     * Loads a ResourceHub PDF using the path saved on the Resource entity.
     * The path must remain inside the configured storage directory.
     */
    public org.springframework.core.io.Resource loadResourceFileAsResource(
            com.example.StudyBuddy.Entity.Resource resource) {

        if (resource == null
                || resource.getStorageFilePath() == null
                || resource.getStorageFilePath().isBlank()) {
            throw new InvalidFileException("Resource file path is missing.");
        }

        try {
            Path filePath = resolveValidatedPath(
                    resource.getStorageFilePath()
            );

            if (!Files.isRegularFile(filePath)
                    || !Files.isReadable(filePath)) {
                throw new FileNotFoundException(
                        "Resource PDF is missing or unreadable."
                );
            }

            return new UrlResource(filePath.toUri());

        } catch (FileNotFoundException ex) {
            throw new FileStorageException(
                    "Resource PDF could not be found.", ex
            );
        } catch (IOException ex) {
            throw new FileStorageException(
                    "Failed to load ResourceHub PDF.", ex
            );
        }
    }

    @Override
    public void validatePdfFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new InvalidFileException(
                    "Cannot store an empty file.");
        }

        String originalFilename = cleanFilename(file);
        validateFilename(originalFilename);

        String extension =
                getFileExtension(originalFilename).toLowerCase(Locale.ROOT);

        if (!"pdf".equals(extension)) {
            throw new InvalidFileException(
                    "Only PDF files are permitted for resource submissions.");
        }

        String contentType = file.getContentType();

        if (contentType != null
                && !contentType.equalsIgnoreCase("application/pdf")
                && !contentType.equalsIgnoreCase("application/x-pdf")
                && !contentType.equalsIgnoreCase("application/octet-stream")) {
            throw new InvalidFileException(
                    "Invalid file content type. Expected application/pdf.");
        }
    }

    /**
     * Returns the ResourceHub file endpoint.
     * This is an endpoint URL, not a self-validating security token.
     * The controller must authenticate the user and verify that the
     * requested resource is approved before serving its PDF.
     */
    @Override
    public String generateSecureDownloadToken(
            com.example.StudyBuddy.Entity.Resource resource) {

        if (resource == null || resource.getId() == null) {
            throw new IllegalArgumentException(
                    "A persisted resource is required for download.");
        }

        return "/api/resources/" + resource.getId() + "/file";
    }

    // --------------------------------------------------
    // Existing staging and public-storage operations
    // --------------------------------------------------

    @Override
    public String storeStagingFile(MultipartFile file) {

        validatePdfFile(file);

        String originalFilename = cleanFilename(file);
        String storedFilename =
                UUID.randomUUID() + "_" + originalFilename;

        Path stagingDirectory = fileStorageLocation
                .resolve("staging")
                .normalize();

        Path targetLocation = stagingDirectory
                .resolve(storedFilename)
                .normalize();

        validatePathInsideStorage(targetLocation);

        if (!targetLocation.startsWith(stagingDirectory)) {
            throw new InvalidFileException(
                    "Filename contains invalid path sequence.");
        }

        try {
            Files.createDirectories(stagingDirectory);
            Files.copy(file.getInputStream(), targetLocation);
            return targetLocation.toString();

        } catch (IOException ex) {
            throw new FileStorageException(
                    "Failed to store staging file " + originalFilename, ex);
        }
    }

    @Override
    @Transactional
    public void promoteToPublicStorage(
            com.example.StudyBuddy.Entity.Resource resource) {

        if (resource == null || resource.getStorageFilePath() == null
                || resource.getStorageFilePath().isBlank()) {
            throw new InvalidFileException(
                    "Resource file path is missing.");
        }

        try {
            Path sourcePath =
                    resolveValidatedPath(resource.getStorageFilePath());

            if (!Files.isRegularFile(sourcePath)
                    || !Files.isReadable(sourcePath)) {
                throw new FileNotFoundException(
                        "Source resource file is missing.");
            }

            Path publicDirectory = fileStorageLocation
                    .resolve("public")
                    .normalize();

            Files.createDirectories(publicDirectory);

            Path targetPath = publicDirectory
                    .resolve(sourcePath.getFileName())
                    .normalize();

            validatePathInsideStorage(targetPath);

            if (!targetPath.startsWith(publicDirectory)) {
                throw new InvalidFileException(
                        "Invalid public resource path.");
            }

            Files.copy(
                    sourcePath,
                    targetPath,
                    StandardCopyOption.REPLACE_EXISTING);

            resource.setStorageFilePath(targetPath.toString());

        } catch (IOException ex) {
            throw new FileStorageException(
                    "Failed to promote resource to public storage.", ex);
        }
    }

    public void promoteToPublic(String storageFilePath) {

        if (storageFilePath == null || storageFilePath.isBlank()) {
            throw new IllegalArgumentException(
                    "Storage file path cannot be blank.");
        }

        try {
            Path sourcePath = Paths.get(stagingDir)
                    .toAbsolutePath()
                    .normalize()
                    .resolve(storageFilePath)
                    .normalize();

            Path targetDirectory = Paths.get(publicDir)
                    .toAbsolutePath()
                    .normalize();

            Path targetPath = targetDirectory
                    .resolve(storageFilePath)
                    .normalize();

            if (!sourcePath.startsWith(
                    Paths.get(stagingDir).toAbsolutePath().normalize())
                    || !targetPath.startsWith(targetDirectory)) {
                throw new InvalidFileException(
                        "Invalid file path for promotion.");
            }

            if (!Files.isRegularFile(sourcePath)) {
                throw new FileNotFoundException(
                        "Staging file not found: " + storageFilePath);
            }

            if (targetPath.getParent() != null) {
                Files.createDirectories(targetPath.getParent());
            }

            try {
                Files.move(
                        sourcePath,
                        targetPath,
                        StandardCopyOption.REPLACE_EXISTING,
                        StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException ex) {
                Files.move(
                        sourcePath,
                        targetPath,
                        StandardCopyOption.REPLACE_EXISTING);
            }

            log.info(
                    "Successfully promoted file from [{}] to [{}]",
                    sourcePath, targetPath);

        } catch (IOException ex) {
            throw new FileStorageException(
                    "Failed to promote file to public storage.", ex);
        }
    }

    // --------------------------------------------------
    // PDF text extraction
    // --------------------------------------------------

    @Override
    public String extractTextFromPdf(String filePath) {

        try {
            Path path = resolveValidatedPath(filePath);

            if (!Files.isRegularFile(path) || !Files.isReadable(path)) {
                throw new FileNotFoundException(
                        "PDF file not found or unreadable: " + filePath);
            }

            try (org.apache.pdfbox.pdmodel.PDDocument document =
                         org.apache.pdfbox.Loader.loadPDF(path.toFile())) {

                org.apache.pdfbox.text.PDFTextStripper stripper =
                        new org.apache.pdfbox.text.PDFTextStripper();

                return stripper.getText(document);
            }

        } catch (Exception ex) {
            throw new FileStorageException(
                    "Failed to extract text from PDF: " + filePath, ex);
        }
    }

    // --------------------------------------------------
    // Shared path and filename validation
    // --------------------------------------------------

    private Resource loadValidatedFile(String filePath)
            throws FileNotFoundException {

        try {
            Path path = resolveValidatedPath(filePath);

            if (!Files.isRegularFile(path) || !Files.isReadable(path)) {
                throw new FileNotFoundException(
                        "Stored file is missing or unreadable.");
            }

            return new UrlResource(path.toUri());

        } catch (FileNotFoundException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new FileStorageException(
                    "Could not load stored file.", ex);
        }
    }

    private Path resolveValidatedPath(String filePath)
            throws IOException {

        if (filePath == null || filePath.isBlank()) {
            throw new InvalidFileException(
                    "Storage file path cannot be blank.");
        }

        Path requestedPath = Paths.get(filePath)
                .toAbsolutePath()
                .normalize();

        validatePathInsideStorage(requestedPath);

        Path realBase = fileStorageLocation.toRealPath();
        Path realFile = requestedPath.toRealPath();

        if (!realFile.startsWith(realBase)) {
            throw new InvalidFileException(
                    "File path points outside the configured storage directory.");
        }

        return realFile;
    }

    private void validatePathInsideStorage(Path path) {

        Path normalizedPath = path.toAbsolutePath().normalize();

        if (!normalizedPath.startsWith(fileStorageLocation)) {
            throw new InvalidFileException(
                    "File path points outside the configured storage directory.");
        }
    }

    private String cleanFilename(MultipartFile file) {

        if (file.getOriginalFilename() == null
                || file.getOriginalFilename().isBlank()) {
            throw new InvalidFileException(
                    "Original filename is missing.");
        }

        return StringUtils.cleanPath(file.getOriginalFilename());
    }

    private void validateFilename(String filename) {

        if (filename == null || filename.isBlank()
                || filename.contains("..")
                || filename.contains("/")
                || filename.contains("\\")) {
            throw new InvalidFileException(
                    "Filename contains invalid path characters.");
        }
    }

    private String getFileExtension(String filename) {

        int lastDot = filename.lastIndexOf('.');

        if (lastDot == -1 || lastDot == filename.length() - 1) {
            return "";
        }

        return filename.substring(lastDot + 1);
    }

    private String determineCategory(String extension) {

        return switch (extension.toLowerCase(Locale.ROOT)) {
            case "pdf" -> "PDF";
            case "png", "jpg", "jpeg" -> "IMAGE";
            case "doc", "docx", "txt" -> "DOCUMENT";
            case "xls", "xlsx" -> "SPREADSHEET";
            case "ppt", "pptx" -> "PRESENTATION";
            case "zip" -> "ARCHIVE";
            default -> "OTHER";
        };
    }

    private FileResponseDto mapToDto(FileMetadata entity) {

        return new FileResponseDto(
                entity.getId(),
                entity.getOriginalFilename(),
                entity.getContentType(),
                entity.getFileExtension(),
                entity.getFileSize(),
                entity.getCategory(),
                entity.getCreatedAt()
        );
    }
}
