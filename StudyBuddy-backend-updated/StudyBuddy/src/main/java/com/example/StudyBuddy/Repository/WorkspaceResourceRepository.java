
package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.WorkspaceResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WorkspaceResourceRepository
        extends JpaRepository<WorkspaceResource, Long> {

    boolean existsByWorkspaceIdAndResourceId(
            Long workspaceId,
            Long resourceId
    );

    Optional<WorkspaceResource> findByWorkspaceIdAndResourceId(
            Long workspaceId,
            Long resourceId
    );

    Page<WorkspaceResource> findByWorkspaceId(
            Long workspaceId,
            Pageable pageable
    );
}
