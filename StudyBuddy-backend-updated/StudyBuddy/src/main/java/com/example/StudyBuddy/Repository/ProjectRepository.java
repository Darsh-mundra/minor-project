package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.creator LEFT JOIN FETCH p.members")
    List<Project> findAllWithDetails();
}