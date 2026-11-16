package com.instagramclone.chat.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum MessageType {
    TEXT,
    IMAGE,
    VIDEO,
    AUDIO,
    POST_SHARE,
    STORY_SHARE,
    STORY_REPLY,
    CALL;

    public boolean isMedia() {
        return this == IMAGE || this == VIDEO || this == AUDIO;
    }

    public boolean isCall() {
        return this == CALL;
    }

    @JsonCreator
    public static MessageType fromValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        for (MessageType type : values()) {
            if (type.name().equalsIgnoreCase(value.trim())) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown MessageType: " + value);
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
