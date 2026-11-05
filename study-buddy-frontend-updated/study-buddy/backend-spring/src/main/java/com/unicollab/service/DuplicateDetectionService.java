package com.unicollab.service;

import com.unicollab.entity.AcademicResource;
import com.unicollab.exception.DuplicateResourceException;
import com.unicollab.repository.ResourceRepository;
import com.unicollab.util.HashUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service implementing Module 2: Exact Duplicate Detection using SHA-256.
 * Note: SHA-256 is strictly used for EXACT checksum duplicate verification.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DuplicateDetectionService {

    private final ResourceRepository resourceRepository;

    /**
     * Checks if the uploaded file content has an identical cryptographic SHA-256 hash.
     * If an identical file exists, rejects creation and throws DuplicateResourceException.
     *
     * @param fileBytes The byte content of the file.
     * @return The computed 64-character hexadecimal SHA-256 hash.
     */
    public String verifyAndCalculateHash(byte[] fileBytes) {
        String sha256 = HashUtil.calculateSha256(fileBytes);
        log.info("Calculated SHA-256 file checksum: {}", sha256);

        Optional<AcademicResource> existingMatch = resourceRepository.findByFileHashSha256(sha256);
        if (existingMatch.isPresent()) {
            AcademicResource existing = existingMatch.get();
            log.warn("Exact duplicate detected! Existing ID: {}, Title: {}", existing.getId(), existing.getTitle());
            throw new DuplicateResourceException(existing, sha256);
        }

        return sha256;
    }

    public boolean isDuplicate(String sha256Hash) {
        return resourceRepository.existsByFileHashSha256(sha256Hash);
    }
}
