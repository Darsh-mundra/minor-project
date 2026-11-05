package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Request.FulfillmentCreateRequestDTO;
import com.example.StudyBuddy.DTO.Request.RequestCreateRequestDTO;
import com.example.StudyBuddy.DTO.Request.RequestUpdateRequestDTO;
import com.example.StudyBuddy.DTO.Response.FulfillmentResponseDTO;
import com.example.StudyBuddy.DTO.Response.RequestHistoryResponseDTO;
import com.example.StudyBuddy.DTO.Response.RequestResponseDTO;
import com.example.StudyBuddy.Service.ResourceRequestService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class ResourceRequestController {

    private final ResourceRequestService requestService;

    // Create request - authenticated user
    @PostMapping
    public ResponseEntity<RequestResponseDTO> createRequest(
            Authentication authentication,
            @Valid @RequestBody RequestCreateRequestDTO requestDTO) {
        System.out.println("Request Controller hit");
        String userEmail = authentication.getName();

        RequestResponseDTO createdRequest =
                requestService.createRequest(userEmail, requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(createdRequest);
    }

    // Get open requests - authenticated users only
    @GetMapping("/open")
    public ResponseEntity<Page<RequestResponseDTO>> getOpenRequests(
            Authentication authentication,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String unit,
            @PageableDefault(size = 10, sort = "createdAt")
            Pageable pageable) {

        authentication.getName();

        Page<RequestResponseDTO> requests =
                requestService.getOpenRequests(subject, unit, pageable);

        return ResponseEntity.ok(requests);
    }

    // Get request by ID - authenticated user
    @GetMapping("/{requestId}")
    public ResponseEntity<RequestResponseDTO> getRequestById(
            Authentication authentication,
            @PathVariable Long requestId) {

        authentication.getName();

        RequestResponseDTO request =
                requestService.getRequestById(requestId);

        return ResponseEntity.ok(request);
    }

    // Get logged-in user's requests
    @GetMapping("/my-requests")
    public ResponseEntity<Page<RequestResponseDTO>> getMyRequests(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "createdAt")
            Pageable pageable) {

        String userEmail = authentication.getName();

        Page<RequestResponseDTO> requests =
                requestService.getMyRequests(userEmail, pageable);

        return ResponseEntity.ok(requests);
    }

    // Update request
    @PutMapping("/{requestId}")
    public ResponseEntity<RequestResponseDTO> updateRequest(
            Authentication authentication,
            @PathVariable Long requestId,
            @Valid @RequestBody RequestUpdateRequestDTO requestDTO) {

        String userEmail = authentication.getName();

        RequestResponseDTO updatedRequest =
                requestService.updateRequest(
                        userEmail, requestId, requestDTO);

        return ResponseEntity.ok(updatedRequest);
    }

    // Cancel request
    @PatchMapping("/{requestId}/cancel")
    public ResponseEntity<RequestResponseDTO> cancelRequest(
            Authentication authentication,
            @PathVariable Long requestId) {

        String userEmail = authentication.getName();

        RequestResponseDTO cancelledRequest =
                requestService.cancelRequest(userEmail, requestId);

        return ResponseEntity.ok(cancelledRequest);
    }

    // Fulfill request
    @PostMapping("/{requestId}/fulfill")
    public ResponseEntity<FulfillmentResponseDTO> fulfillRequest(
            Authentication authentication,
            @PathVariable Long requestId,
            @Valid @RequestBody
            FulfillmentCreateRequestDTO fulfillmentDTO) {

        String userEmail = authentication.getName();

        FulfillmentResponseDTO fulfillment =
                requestService.fulfillRequest(
                        userEmail, requestId, fulfillmentDTO);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fulfillment);
    }

    // Get fulfillment
    @GetMapping("/{requestId}/fulfillment")
    public ResponseEntity<FulfillmentResponseDTO> getFulfillment(
            Authentication authentication,
            @PathVariable Long requestId) {

        authentication.getName();

        FulfillmentResponseDTO fulfillment =
                requestService.getFulfillment(requestId);

        return ResponseEntity.ok(fulfillment);
    }

    @GetMapping("/{requestId}/history")
    public ResponseEntity<RequestHistoryResponseDTO> getRequestHistory(
            Authentication authentication,
            @PathVariable Long requestId) {

        authentication.getName();

        RequestHistoryResponseDTO history =
                requestService.getRequestHistory(requestId);

        return ResponseEntity.ok(history);
    }
}