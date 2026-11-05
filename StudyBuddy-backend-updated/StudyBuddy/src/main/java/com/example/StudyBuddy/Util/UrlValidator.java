package com.example.StudyBuddy.Util;


import org.apache.coyote.BadRequestException;

public class UrlValidator {

    public static String validateAndSanitizeUrl(String url) throws BadRequestException {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim().toLowerCase();
        if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
            throw new BadRequestException("Unsafe or prohibited URL scheme detected.");
        }
        return url.trim();
    }
}