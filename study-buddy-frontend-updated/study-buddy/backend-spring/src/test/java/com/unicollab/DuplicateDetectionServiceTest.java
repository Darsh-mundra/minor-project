package com.unicollab;

import com.unicollab.entity.AcademicResource;
import com.unicollab.exception.DuplicateResourceException;
import com.unicollab.repository.ResourceRepository;
import com.unicollab.service.DuplicateDetectionService;
import com.unicollab.util.HashUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DuplicateDetectionServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private DuplicateDetectionService duplicateDetectionService;

    private byte[] sampleFileContent;
    private String expectedHash;

    @BeforeEach
    void setUp() {
        sampleFileContent = "DBMS Unit 4 Lecture Notes Content".getBytes(StandardCharsets.UTF_8);
        expectedHash = HashUtil.calculateSha256(sampleFileContent);
    }

    @Test
    @DisplayName("Should successfully return SHA-256 hash when no duplicate exists in repository")
    void verifyAndCalculateHash_WhenNoDuplicate_ShouldReturnHash() {
        when(resourceRepository.findByFileHashSha256(expectedHash)).thenReturn(Optional.empty());

        String resultHash = duplicateDetectionService.verifyAndCalculateHash(sampleFileContent);

        assertNotNull(resultHash);
        assertEquals(expectedHash, resultHash);
        assertEquals(64, resultHash.length());
        verify(resourceRepository, times(1)).findByFileHashSha256(expectedHash);
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when identical SHA-256 checksum exists")
    void verifyAndCalculateHash_WhenDuplicateExists_ShouldThrowException() {
        AcademicResource existingResource = AcademicResource.builder()
            .id(101L)
            .title("Existing DBMS Notes")
            .fileHashSha256(expectedHash)
            .build();

        when(resourceRepository.findByFileHashSha256(expectedHash)).thenReturn(Optional.of(existingResource));

        DuplicateResourceException exception = assertThrows(
            DuplicateResourceException.class,
            () -> duplicateDetectionService.verifyAndCalculateHash(sampleFileContent)
        );

        assertTrue(exception.getMessage().contains("Exact duplicate resource detected"));
        assertEquals(101L, exception.getExistingResource().getId());
        assertEquals(expectedHash, exception.getSha256Hash());
        verify(resourceRepository, times(1)).findByFileHashSha256(expectedHash);
    }
}
