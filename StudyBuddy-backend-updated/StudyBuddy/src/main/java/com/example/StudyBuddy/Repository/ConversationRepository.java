package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Conversation;
import com.example.StudyBuddy.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserOrderByUpdatedAtDesc(User user);
    Optional<Conversation> findByIdAndUser(Long id, User user);
}
