package com.unicollab.repository;

import com.unicollab.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByWorkspaceId(Long workspaceId);
    List<Quiz> findBySubjectIgnoreCase(String subject);
}
