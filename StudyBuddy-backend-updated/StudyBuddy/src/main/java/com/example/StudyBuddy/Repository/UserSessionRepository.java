
package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserSessionRepository
        extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findBySessionId(String sessionId);
}
