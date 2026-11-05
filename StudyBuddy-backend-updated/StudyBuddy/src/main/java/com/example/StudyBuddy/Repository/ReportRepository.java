package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    // Fetch recent activity for the dashboard
    List<Report> findTop10ByOrderByCreatedAtDesc();

    // Clean up associated reports when a resource or discussion is deleted by an admin
    @Modifying
    @Query("DELETE FROM Report r WHERE r.targetId = :targetId AND r.targetType = :targetType")
    void deleteByTargetIdAndTargetType(@Param("targetId") Long targetId, @Param("targetType") String targetType);
}