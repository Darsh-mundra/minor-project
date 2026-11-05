package com.example.StudyBuddy.Controller;

import com.example.StudyBuddy.DTO.Response.OpportunityResponseDto;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Enum.OpportunityCategory;
import com.example.StudyBuddy.Enum.OpportunityMode;
import com.example.StudyBuddy.Enum.OpportunityStatus;
import com.example.StudyBuddy.Service.OpportunityService;
import org.apache.coyote.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    private final OpportunityService opportunityService;

    public OpportunityController(OpportunityService opportunityService) {
        this.opportunityService = opportunityService;
    }

    @GetMapping
    public ResponseEntity<Page<OpportunityResponseDto>> getAllOpportunities(
            @RequestParam(required = false, defaultValue = "ALL") OpportunityCategory category,
            @RequestParam(required = false) OpportunityStatus status,
            @RequestParam(required = false) OpportunityMode mode,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "publicationDate") Pageable pageable,
            @AuthenticationPrincipal User currentUser
    ) {
        Page<OpportunityResponseDto> opportunities = opportunityService.getOpportunities(
                category, status, mode, location, skill, keyword, pageable, currentUser
        );
        System.out.println("category = " + category);
        System.out.println("status = " + status);
        System.out.println("mode = " + mode);
        System.out.println("location = " + location);
        System.out.println("skill = " + skill);
        System.out.println("keyword = " + keyword);
        System.out.println("pageable = " + pageable);
        return ResponseEntity.ok(opportunities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OpportunityResponseDto> getOpportunityById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) throws BadRequestException {
        OpportunityResponseDto dto = opportunityService.getOpportunityById(id, currentUser);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<Void> saveOpportunity(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        opportunityService.saveOpportunity(currentUser, id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsaveOpportunity(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        opportunityService.unsaveOpportunity(currentUser, id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/saved")
    public ResponseEntity<Page<OpportunityResponseDto>> getSavedOpportunities(
            @PageableDefault(size = 10, sort = "savedAt") Pageable pageable,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        Page<OpportunityResponseDto> saved = opportunityService.getSavedOpportunities(currentUser, pageable);
        return ResponseEntity.ok(saved);
    }
}