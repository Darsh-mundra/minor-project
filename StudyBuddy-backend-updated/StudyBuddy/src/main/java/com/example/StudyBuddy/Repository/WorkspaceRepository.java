package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    Optional<Workspace> findByJoinCode(String joinCode);
    boolean existsByJoinCode(String joinCode);
}
