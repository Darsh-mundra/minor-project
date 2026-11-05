package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.ResourceRequest;
import com.example.StudyBuddy.Enum.RequestStatus;
import com.example.StudyBuddy.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface RequestRepository extends JpaRepository<ResourceRequest, Long>, JpaSpecificationExecutor<ResourceRequest> {
    Page<ResourceRequest> findByStatus(RequestStatus status, Pageable pageable);
    Page<ResourceRequest> findByUser(User user, Pageable pageable);
    Page<ResourceRequest> findByStatusAndSubjectContainingIgnoreCaseAndUnitContainingIgnoreCase(
            RequestStatus status, String subject, String unit, Pageable pageable);
}