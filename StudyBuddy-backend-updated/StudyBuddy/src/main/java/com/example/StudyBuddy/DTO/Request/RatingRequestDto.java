package com.example.StudyBuddy.DTO.Request;


import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class RatingRequestDto {

    @NotNull(message = "Rating value is required")
    @Min(value = 1, message = "Minimum rating is 1 star")
    @Max(value = 5, message = "Maximum rating is 5 stars")
    private Integer rating;

    public RatingRequestDto() {}

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
}