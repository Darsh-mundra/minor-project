package com.unicollab.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utility for calculating SHA-256 cryptographic hashes.
 * IMPORTANT: SHA-256 is strictly used for EXACT DUPLICATE DETECTION.
 * It does not detect semantic or partial document similarity.
 */
public class HashUtil {

    public static String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available in runtime environment", e);
        }
    }

    public static String calculateSha256(String input) {
        return calculateSha256(input.getBytes(StandardCharsets.UTF_8));
    }
}
