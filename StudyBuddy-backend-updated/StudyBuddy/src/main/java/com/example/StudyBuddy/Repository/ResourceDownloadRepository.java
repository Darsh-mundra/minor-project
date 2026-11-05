package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.ResourceDownload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceDownloadRepository extends JpaRepository<ResourceDownload, Long> {
    long countByResourceId(Long resourceId);
}
