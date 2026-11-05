package com.example.StudyBuddy.Enum;

public enum FlashcardCount {
    FOUR(4),
    FIVE(5),
    TEN(10),
    ENTY(20); // Note: keep clean naming or TWENTY

    private final int count;

    FlashcardCount(int count) {
        this.count = count;
    }

    public int getCount() {
        return count;
    }
}