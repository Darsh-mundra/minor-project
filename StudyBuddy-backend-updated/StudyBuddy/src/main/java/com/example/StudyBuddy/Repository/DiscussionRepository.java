package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Discussion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionRepository extends JpaRepository<Discussion, Long> {

    @Query("SELECT DISTINCT d FROM Discussion d LEFT JOIN FETCH d.author LEFT JOIN FETCH d.answers LEFT JOIN FETCH d.reports")
    List<Discussion> findAllWithDetails();

    @Query("SELECT DISTINCT d FROM Discussion d JOIN d.reports rep GROUP BY d HAVING COUNT(rep) > 0")
    List<Discussion> findReportedDiscussions();
}