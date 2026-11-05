package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Request.FulfillmentCreateRequestDTO;
import com.example.StudyBuddy.DTO.Request.RequestCreateRequestDTO;
import com.example.StudyBuddy.DTO.Request.RequestUpdateRequestDTO;
import com.example.StudyBuddy.DTO.Response.FulfillmentResponseDTO;
import com.example.StudyBuddy.DTO.Response.RequestHistoryResponseDTO;
import com.example.StudyBuddy.DTO.Response.RequestResponseDTO;
import com.example.StudyBuddy.DTO.Response.UserPublicResponseDTO;
import com.example.StudyBuddy.Entity.Fulfillment;
import com.example.StudyBuddy.Entity.ResourceRequest;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Enum.RequestStatus;
import com.example.StudyBuddy.Repository.FulfillmentRepository;
import com.example.StudyBuddy.Repository.RequestRepository;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.ResourceRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ResourceRequestServiceImpl implements ResourceRequestService {

    private final RequestRepository requestRepository;
    private final FulfillmentRepository fulfillmentRepository;
    private final UserRepository userRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UserPublicResponseDTO mapToUserPublicDTO(User user) {
        if (user == null) return null;
        return UserPublicResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private RequestResponseDTO mapToRequestDTO(ResourceRequest request) {
        if (request == null) return null;
        return RequestResponseDTO.builder()
                .requestId(request.getId())
                .title(request.getTitle())
                .subject(request.getSubject())
                .unit(request.getUnit())
                .detail(request.getDetail())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .fulfilledAt(request.getFulfilledAt())
                .creator(mapToUserPublicDTO(request.getUser()))
                .build();
    }

    private FulfillmentResponseDTO mapToFulfillmentDTO(Fulfillment fulfillment) {
        if (fulfillment == null) return null;
        return FulfillmentResponseDTO.builder()
                .fulfillmentId(fulfillment.getId())
                .requestId(fulfillment.getRequest().getId())
                .fulfilledBy(mapToUserPublicDTO(fulfillment.getFulfilledBy()))
                .fulfillmentDetail(fulfillment.getFulfillmentDetail())
                .answerOrResource(fulfillment.getAnswerOrResource())
                .createdAt(fulfillment.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public RequestResponseDTO createRequest(String userEmail, RequestCreateRequestDTO requestDTO) {
        User user = getUserByEmail(userEmail);
        System.out.println(user);
        ResourceRequest request = ResourceRequest.builder()
                .user(user)
                .title(requestDTO.getTitle().trim())
                .subject(requestDTO.getSubject().trim())
                .unit(requestDTO.getUnit().trim())
                .detail(requestDTO.getDetail().trim())
                .status(RequestStatus.OPEN)
                .build();

        System.out.println(request);
        ResourceRequest saved = requestRepository.save(request);
        System.out.println(saved);
        return mapToRequestDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RequestResponseDTO> getOpenRequests(String subject, String unit, Pageable pageable) {
        Page<ResourceRequest> requests;
        if ((subject != null && !subject.isBlank()) || (unit != null && !unit.isBlank())) {
            String subj = subject != null ? subject : "";
            String unt = unit != null ? unit : "";
            requests = requestRepository.findByStatusAndSubjectContainingIgnoreCaseAndUnitContainingIgnoreCase(
                    RequestStatus.OPEN, subj, unt, pageable);
        } else {
            requests = requestRepository.findByStatus(RequestStatus.OPEN, pageable);
        }
        return requests.map(this::mapToRequestDTO);
    }

    @Override
    public RequestResponseDTO getRequestById(Long requestId) {
        ResourceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));
        return mapToRequestDTO(request);
    }

    @Override
    public Page<RequestResponseDTO> getMyRequests(String userEmail, Pageable pageable) {
        User user = getUserByEmail(userEmail);
        Page<ResourceRequest> requests = requestRepository.findByUser(user, pageable);
        return requests.map(this::mapToRequestDTO);
    }

    @Override
    @Transactional
    public RequestResponseDTO updateRequest(String userEmail, Long requestId, RequestUpdateRequestDTO requestDTO) {
        User user = getUserByEmail(userEmail);
        ResourceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You are not authorized to update this request");
        }

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new IllegalStateException("Only OPEN requests can be updated");
        }

        if (requestDTO.getTitle() != null && !requestDTO.getTitle().isBlank()) {
            request.setTitle(requestDTO.getTitle().trim());
        }
        if (requestDTO.getSubject() != null && !requestDTO.getSubject().isBlank()) {
            request.setSubject(requestDTO.getSubject().trim());
        }
        if (requestDTO.getUnit() != null && !requestDTO.getUnit().isBlank()) {
            request.setUnit(requestDTO.getUnit().trim());
        }
        if (requestDTO.getDetail() != null && !requestDTO.getDetail().isBlank()) {
            request.setDetail(requestDTO.getDetail().trim());
        }

        ResourceRequest updated = requestRepository.save(request);
        return mapToRequestDTO(updated);
    }

    @Override
    @Transactional
    public RequestResponseDTO cancelRequest(String userEmail, Long requestId) {
        User user = getUserByEmail(userEmail);
        ResourceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You are not authorized to cancel this request");
        }

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new IllegalStateException("Only OPEN requests can be cancelled");
        }

        request.setStatus(RequestStatus.CANCELLED);
        ResourceRequest updated = requestRepository.save(request);
        return mapToRequestDTO(updated);
    }

    @Override
    @Transactional
    public FulfillmentResponseDTO fulfillRequest(String userEmail, Long requestId, FulfillmentCreateRequestDTO fulfillmentDTO) {
        User fulfiller = getUserByEmail(userEmail);
        ResourceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (request.getUser().getId().equals(fulfiller.getId())) {
            throw new IllegalArgumentException("Users cannot fulfill their own requests");
        }

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new IllegalStateException("Request is not open for fulfillment");
        }

        if (fulfillmentRepository.existsByRequest(request)) {
            throw new IllegalStateException("Request has already been fulfilled");
        }

        request.setStatus(RequestStatus.FULFILLED);
        request.setFulfilledAt(LocalDateTime.now());
        requestRepository.save(request);

        Fulfillment fulfillment = Fulfillment.builder()
                .request(request)
                .fulfilledBy(fulfiller)
                .fulfillmentDetail(fulfillmentDTO.getFulfillmentDetail().trim())
                .answerOrResource(fulfillmentDTO.getAnswerOrResource() != null ? fulfillmentDTO.getAnswerOrResource().trim() : null)
                .build();

        Fulfillment savedFulfillment = fulfillmentRepository.save(fulfillment);
        return mapToFulfillmentDTO(savedFulfillment);
    }

    @Override
    public FulfillmentResponseDTO getFulfillment(Long requestId) {
        ResourceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        Fulfillment fulfillment = fulfillmentRepository.findByRequest(request)
                .orElseThrow(() -> new IllegalArgumentException("Fulfillment not found for this request"));

        return mapToFulfillmentDTO(fulfillment);
    }

    @Override
    public RequestHistoryResponseDTO getRequestHistory(Long requestId) {
        RequestResponseDTO requestDTO = getRequestById(requestId);
        FulfillmentResponseDTO fulfillmentDTO = null;
        try {
            fulfillmentDTO = getFulfillment(requestId);
        } catch (Exception ignored) {
            // Fulfillment might not exist if request is not fulfilled yet
        }

        return RequestHistoryResponseDTO.builder()
                .request(requestDTO)
                .fulfillment(fulfillmentDTO)
                .build();
    }
}