package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.WorkspaceResourceShareFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkspaceResourceShareFileRepository extends JpaRepository<WorkspaceResourceShareFile, Long> {
    Optional<WorkspaceResourceShareFile> findByIdAndShareId(Long id, Long shareId);
}