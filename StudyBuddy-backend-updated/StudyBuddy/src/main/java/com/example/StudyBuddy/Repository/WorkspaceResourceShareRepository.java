package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.WorkspaceResourceShare;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkspaceResourceShareRepository extends JpaRepository<WorkspaceResourceShare, Long> {

    Page<WorkspaceResourceShare> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId, Pageable pageable);

    @Query("SELECT s FROM WorkspaceResourceShare s JOIN FETCH s.user LEFT JOIN FETCH s.files WHERE s.id = :id AND s.workspace.id = :workspaceId")
    Optional<WorkspaceResourceShare> findByIdAndWorkspaceIdWithDetails(@Param("id") Long id, @Param("workspaceId") Long workspaceId);
}