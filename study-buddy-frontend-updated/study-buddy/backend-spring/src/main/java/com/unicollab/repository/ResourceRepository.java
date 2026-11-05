package com.unicollab.repository;

import com.unicollab.entity.AcademicResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<AcademicResource, Long> {

    /**
     * Exact SHA-256 duplicate detection lookup.
     */
    Optional<AcademicResource> findByFileHashSha256(String fileHashSha256);

    boolean existsByFileHashSha256(String fileHashSha256);

    List<AcademicResource> findBySubjectIgnoreCaseAndIsReportedFalse(String subject);

    @Query("SELECT r FROM AcademicResource r WHERE r.isReported = false AND " +
           "(:keyword IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:subject IS NULL OR LOWER(r.subject) = LOWER(:subject)) AND " +
           "(:semester IS NULL OR r.semester = :semester) AND " +
           "(:resourceType IS NULL OR LOWER(r.resourceType) = LOWER(:resourceType)) " +
           "ORDER BY r.uploadDate DESC")
    List<AcademicResource> searchResources(
        @Param("keyword") String keyword,
        @Param("subject") String subject,
        @Param("semester") Integer semester,
        @Param("resourceType") String resourceType
    );
}
