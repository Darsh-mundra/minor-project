package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.WorkspaceTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceTaskRepository extends JpaRepository<WorkspaceTask, Long> {
    List<WorkspaceTask> findByWorkspaceId(Long workspaceId);
    Optional<WorkspaceTask> findByIdAndWorkspaceId(Long id, Long workspaceId);
}