package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Opportunity;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Entity.UserSavedOpportunity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSavedOpportunityRepository extends JpaRepository<UserSavedOpportunity, Long> {

    Optional<UserSavedOpportunity> findByUserAndOpportunity(User user, Opportunity opportunity);

    boolean existsByUserAndOpportunity(User user, Opportunity opportunity);

    void deleteByUserAndOpportunity(User user, Opportunity opportunity);

    Page<UserSavedOpportunity> findByUserOrderBySavedAtDesc(User user, Pageable pageable);
}