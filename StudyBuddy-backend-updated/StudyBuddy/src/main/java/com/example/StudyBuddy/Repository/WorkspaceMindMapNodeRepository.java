package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.WorkspaceMindMapNode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkspaceMindMapNodeRepository
        extends JpaRepository<WorkspaceMindMapNode, Long> {
}