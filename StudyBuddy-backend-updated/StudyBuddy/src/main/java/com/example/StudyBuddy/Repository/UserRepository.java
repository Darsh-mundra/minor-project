package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Enum.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);

    long countByRole(Role role);

    long countByDisabledTrue();
}
