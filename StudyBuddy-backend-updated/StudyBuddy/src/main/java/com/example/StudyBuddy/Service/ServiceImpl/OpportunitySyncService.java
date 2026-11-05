package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.Entity.Opportunity;
import com.example.StudyBuddy.Enum.OpportunityCategory;
import com.example.StudyBuddy.Enum.OpportunityStatus;
import com.example.StudyBuddy.Repository.OpportunityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class OpportunitySyncService {

    private static final Logger log = LoggerFactory.getLogger(OpportunitySyncService.class);

    private final OpportunityRepository opportunityRepository;
    private final RestClient restClient;

    @Value("${himalayas.api.url:https://himalayas.app/jobs/api}")
    private String himalayasApiUrl;

    @Value("${hackernews.api.url:https://hn.algolia.com/api/v1/search}")
    private String hackerNewsApiUrl;

    public OpportunitySyncService(OpportunityRepository opportunityRepository) {
        this.opportunityRepository = opportunityRepository;
        this.restClient = RestClient.builder().build();
    }

    @Scheduled(fixedRate = 6 * 60 * 60 * 1000L)
    @Transactional
    public void synchronizeOpportunities() {
        log.info("Starting scheduled synchronization of external opportunities...");
        syncHimalayasJobs();
        syncHackerNewsHackathons();
    }

    public void syncHimalayasJobs() {
        try {
            String url = himalayasApiUrl + "?limit=20";
            Map response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("jobs")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.get("jobs");
                for (Map<String, Object> job : jobs) {
                    String extId = String.valueOf(job.get("id") != null ? job.get("id") : job.get("slug"));
                    String title = (String) job.get("title");
                    String description = (String) job.get("excerpt");
                    String applicationLink = (String) job.get("applicationLink");
                    String companyName = (String) job.get("companyName");
                    String employmentType = (String) job.get("employmentType");

                    OpportunityCategory category = OpportunityCategory.JOB;
                    if (employmentType != null && employmentType.toLowerCase().contains("intern")) {
                        category = OpportunityCategory.INTERNSHIP;
                    }

                    Opportunity opportunity = opportunityRepository
                            .findByProviderNameAndExternalId("HIMALAYAS", extId)
                            .orElse(new Opportunity());

                    opportunity.setProviderName("HIMALAYAS");
                    opportunity.setExternalId(extId);
                    opportunity.setTitle(title != null ? title : "Remote Opportunity");
                    opportunity.setDescription(description != null ? description : "No description provided.");
                    opportunity.setCategory(category);
                    opportunity.setOrganizer(companyName != null ? companyName : "Remote Employer");
                    opportunity.setApplyUrl(applicationLink != null ? applicationLink : "https://himalayas.app");
                    opportunity.setDetailsUrl(applicationLink != null ? applicationLink : "https://himalayas.app");
                    opportunity.setStatus(OpportunityStatus.ACTIVE);
                    opportunity.setSourceAttribution("Himalayas Remote Jobs");
                    opportunity.setPublicationDate(Instant.now());

                    opportunityRepository.save(opportunity);
                }
                log.info("Successfully synchronized {} opportunities from Himalayas.", jobs.size());
            }
        } catch (Exception e) {
            log.error("Failed to synchronize Himalayas opportunities: {}", e.getMessage());
        }
    }

    public void syncHackerNewsHackathons() {
        try {
            String url = hackerNewsApiUrl + "?query=hackathon&tags=story&hitsPerPage=20";
            Map response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("hits")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> hits = (List<Map<String, Object>>) response.get("hits");
                for (Map<String, Object> hit : hits) {
                    String extId = String.valueOf(hit.get("objectID"));
                    String title = (String) hit.get("title");
                    String storyUrl = (String) hit.get("url");
                    if (storyUrl == null || storyUrl.isBlank()) {
                        storyUrl = "https://news.ycombinator.com/item?id=" + extId;
                    }

                    Opportunity opportunity = opportunityRepository
                            .findByProviderNameAndExternalId("HACKER_NEWS", extId)
                            .orElse(new Opportunity());

                    opportunity.setProviderName("HACKER_NEWS");
                    opportunity.setExternalId(extId);
                    opportunity.setTitle(title != null ? title : "Hackathon / Developer Event");
                    opportunity.setDescription("Hackathon, coding competition, or developer event sourced via Hacker News.");
                    opportunity.setCategory(OpportunityCategory.HACKATHON);
                    opportunity.setOrganizer("Hacker News Community");
                    opportunity.setApplyUrl(storyUrl);
                    opportunity.setDetailsUrl(storyUrl);
                    opportunity.setStatus(OpportunityStatus.ACTIVE);
                    opportunity.setSourceAttribution("Hacker News");
                    opportunity.setPublicationDate(Instant.now());

                    opportunityRepository.save(opportunity);
                }
                log.info("Successfully synchronized {} hackathons from Hacker News.", hits.size());
            }
        } catch (Exception e) {
            log.error("Failed to synchronize Hacker News hackathons: {}", e.getMessage());
        }
    }
}