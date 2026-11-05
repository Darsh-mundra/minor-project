package com.example.StudyBuddy.DTO.Request;


import com.example.StudyBuddy.Enum.ReportCategory;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReportRequestDto {

    @NotNull(message = "Report category is required")
    private ReportCategory category;

    @Size(max = 1000, message = "Explanation cannot exceed 1000 characters")
    private String explanation;

    public ReportRequestDto() {}

    public ReportCategory getCategory() { return category; }
    public void setCategory(ReportCategory category) { this.category = category; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}