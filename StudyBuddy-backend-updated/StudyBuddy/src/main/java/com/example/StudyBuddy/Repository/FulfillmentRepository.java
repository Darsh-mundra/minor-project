package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Fulfillment;
import com.example.StudyBuddy.Entity.ResourceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FulfillmentRepository extends JpaRepository<Fulfillment, Long> {
    Optional<Fulfillment> findByRequest(ResourceRequest request);
    boolean existsByRequest(ResourceRequest request);
}