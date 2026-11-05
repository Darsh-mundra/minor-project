package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.ResourceReport;
import com.example.StudyBuddy.Enum.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceReportRepository extends JpaRepository<ResourceReport, Long> {
    boolean existsByReporterIdAndResourceIdAndStatus(Long reporterId, Long resourceId, RequestStatus status);
    Page<ResourceReport> findByStatus(RequestStatus status, Pageable pageable);
}