package com.instagramclone.user.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum StoryReplyPermission {
    EVERYONE,
    FOLLOWING,
    OFF;

    @JsonCreator
    public static StoryReplyPermission fromValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return EVERYONE;
        }
        for (StoryReplyPermission permission : values()) {
            if (permission.name().equalsIgnoreCase(value.trim())) {
                return permission;
            }
        }
        return EVERYONE;
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
