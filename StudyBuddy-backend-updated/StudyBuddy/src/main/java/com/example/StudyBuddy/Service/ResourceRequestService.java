package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Request.FulfillmentCreateRequestDTO;
import com.example.StudyBuddy.DTO.Request.RequestCreateRequestDTO;
import com.example.StudyBuddy.DTO.Request.RequestUpdateRequestDTO;
import com.example.StudyBuddy.DTO.Response.FulfillmentResponseDTO;
import com.example.StudyBuddy.DTO.Response.RequestHistoryResponseDTO;
import com.example.StudyBuddy.DTO.Response.RequestResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ResourceRequestService {
    RequestResponseDTO createRequest(String userEmail, RequestCreateRequestDTO requestDTO);
    Page<RequestResponseDTO> getOpenRequests(String subject, String unit, Pageable pageable);
    RequestResponseDTO getRequestById(Long requestId);
    Page<RequestResponseDTO> getMyRequests(String userEmail, Pageable pageable);
    RequestResponseDTO updateRequest(String userEmail, Long requestId, RequestUpdateRequestDTO requestDTO);
    RequestResponseDTO cancelRequest(String userEmail, Long requestId);
    FulfillmentResponseDTO fulfillRequest(String userEmail, Long requestId, FulfillmentCreateRequestDTO fulfillmentDTO);
    FulfillmentResponseDTO getFulfillment(Long requestId);
    RequestHistoryResponseDTO getRequestHistory(Long requestId);
}