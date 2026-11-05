package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Resource;
import com.example.StudyBuddy.Enum.ResourceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long>, JpaSpecificationExecutor<Resource> {
    boolean existsByNormalizedTitle(String normalizedTitle);
    Optional<Resource> findByIdAndStatus(Long id, ResourceStatus status);
    Page<Resource> findByStatus(ResourceStatus status, Pageable pageable);
    Page<Resource> findByUploaderId(Long uploaderId, Pageable pageable);
    @Query("SELECT r FROM Resource r WHERE r.status = :status " +
            "AND (:resourceType IS NULL OR r.resourceType = :resourceType) " +
            "AND (:branch IS NULL OR r.branch = :branch) " +
            "AND (:subject IS NULL OR r.subject = :subject) " +
            "AND (:semester IS NULL OR r.semester = :semester) " +
            "AND (:chapterUnit IS NULL OR r.chapterUnit = :chapterUnit)")
    Page<Resource> findFilteredApprovedResources(
            @Param("status") ResourceStatus status,
            @Param("resourceType") String resourceType,
            @Param("branch") String branch,
            @Param("subject") String subject,
            @Param("semester") String semester,
            @Param("chapterUnit") String chapterUnit,
            Pageable pageable
    );
    Page<Resource> findByStatusAndUploaderId(ResourceStatus status, Long uploaderId, Pageable pageable);

    @Query("SELECT DISTINCT r FROM Resource r JOIN r.reports rep GROUP BY r HAVING COUNT(rep) > 0")
    List<Resource> findReportedResources();
}
