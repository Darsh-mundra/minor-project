package com.unicollab.exception;

import com.unicollab.entity.AcademicResource;
import lombok.Getter;

@Getter
public class DuplicateResourceException extends RuntimeException {

    private final AcademicResource existingResource;
    private final String sha256Hash;

    public DuplicateResourceException(AcademicResource existingResource, String sha256Hash) {
        super(String.format("Exact duplicate resource detected! An identical file already exists: '%s' uploaded by %s with SHA-256 checksum: %s",
            existingResource.getTitle(),
            existingResource.getUploader() != null ? existingResource.getUploader().getFullName() : "Anonymous",
            sha256Hash));
        this.existingResource = existingResource;
        this.sha256Hash = sha256Hash;
    }
}
