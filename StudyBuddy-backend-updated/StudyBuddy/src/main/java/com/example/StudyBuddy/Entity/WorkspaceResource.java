
package com.example.StudyBuddy.Entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "workspace_resources",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_workspace_resource",
                        columnNames = {"workspace_id", "resource_id"}
                )
        },
        indexes = {
                @Index(
                        name = "idx_workspace_resource_workspace",
                        columnList = "workspace_id"
                )
        }
)
public class WorkspaceResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shared_by_user_id", nullable = false)
    private User sharedBy;

    @CreationTimestamp
    @Column(name = "shared_at", nullable = false, updatable = false)
    private LocalDateTime sharedAt;

    public Long getId() {
        return id;
    }

    public Workspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(Workspace workspace) {
        this.workspace = workspace;
    }

    public Resource getResource() {
        return resource;
    }

    public void setResource(Resource resource) {
        this.resource = resource;
    }

    public User getSharedBy() {
        return sharedBy;
    }

    public void setSharedBy(User sharedBy) {
        this.sharedBy = sharedBy;
    }

    public LocalDateTime getSharedAt() {
        return sharedAt;
    }
}
