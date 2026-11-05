package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserIdAndResourceId(Long userId, Long resourceId);
    boolean existsByUserIdAndResourceId(Long userId, Long resourceId);
    List<Rating> findByResourceId(Long resourceId);
}
