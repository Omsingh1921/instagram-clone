package com.instagramclone.post.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CollabStatus {
    NONE,
    PENDING,
    ACCEPTED,
    DECLINED;

    @JsonCreator
    public static CollabStatus fromValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return NONE;
        }
        for (CollabStatus status : values()) {
            if (status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        return NONE;
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
