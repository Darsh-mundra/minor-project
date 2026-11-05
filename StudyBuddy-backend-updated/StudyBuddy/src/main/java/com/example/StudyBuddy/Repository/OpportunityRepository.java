
package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Opportunity;
import com.example.StudyBuddy.Enum.OpportunityCategory;
import com.example.StudyBuddy.Enum.OpportunityMode;
import com.example.StudyBuddy.Enum.OpportunityStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public interface OpportunityRepository
        extends JpaRepository<Opportunity, Long>,
        JpaSpecificationExecutor<Opportunity> {

    Optional<Opportunity> findByProviderNameAndExternalId(
            String providerName,
            String externalId
    );

    default Page<Opportunity> findOpportunities(
            OpportunityCategory category,
            OpportunityStatus status,
            OpportunityMode mode,
            String location,
            String skill,
            String keyword,
            Pageable pageable
    ) {

        Specification<Opportunity> specification = (root, query, criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (category != null && category != OpportunityCategory.ALL) {
                predicates.add(
                        criteriaBuilder.equal(root.get("category"), category)
                );
            }

            if (status != null) {
                predicates.add(
                        criteriaBuilder.equal(root.get("status"), status)
                );
            }

            if (mode != null) {
                predicates.add(
                        criteriaBuilder.equal(root.get("mode"), mode)
                );
            }

            if (location != null && !location.isBlank()) {
                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("location")),
                                "%" + location.trim().toLowerCase() + "%"
                        )
                );
            }

            if (skill != null && !skill.isBlank()) {
                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("skills")),
                                "%" + skill.trim().toLowerCase() + "%"
                        )
                );
            }

            if (keyword != null && !keyword.isBlank()) {

                String searchKeyword = "%" + keyword.trim().toLowerCase() + "%";

                Predicate titleMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("title")),
                        searchKeyword
                );

                Predicate descriptionMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("description")),
                        searchKeyword
                );

                Predicate organizerMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("organizer")),
                        searchKeyword
                );

                predicates.add(
                        criteriaBuilder.or(
                                titleMatch,
                                descriptionMatch,
                                organizerMatch
                        )
                );
            }

            return criteriaBuilder.and(
                    predicates.toArray(new Predicate[0])
            );
        };

        return findAll(specification, pageable);
    }
}
