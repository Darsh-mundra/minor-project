package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {

    List<FileMetadata> findByUploaderId(Long uploaderId);

    List<FileMetadata> findByUploaderIdAndCategory(Long uploaderId, String category);

    Optional<FileMetadata> findByIdAndUploaderId(Long id, Long uploaderId);
}