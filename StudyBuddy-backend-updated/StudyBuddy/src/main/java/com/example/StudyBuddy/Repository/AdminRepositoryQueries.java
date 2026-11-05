package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Enum.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminRepositoryQueries extends JpaRepository<User, Long> {
    long countByRole(Role role);
    long countByDisabledTrue();
}