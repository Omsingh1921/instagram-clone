package com.instagramclone.call.constants;

public final class CallConstants {

    private CallConstants() {}

    public static final String CALL_TOPIC_PREFIX = "/topic/users/";
    public static final String CALL_TOPIC_SUFFIX = "/call";

    // STOMP WebSocket Application Destination paths
    public static final String WS_CALL_INITIATE = "/call/initiate";
    public static final String WS_CALL_INITIATE_GROUP = "/call/group/initiate";
    public static final String WS_CALL_ANSWER = "/call/answer";
    public static final String WS_CALL_REJECT = "/call/reject";
    public static final String WS_CALL_END = "/call/end";
    public static final String WS_CALL_SIGNAL = "/call/signal";
    public static final String WS_CALL_JOIN = "/call/join";
    public static final String WS_CALL_LEAVE = "/call/leave";

    // Event Types sent over WebSocket to clients
    public static final String EVENT_INCOMING_CALL = "INCOMING_CALL";
    public static final String EVENT_CALL_ACCEPTED = "CALL_ACCEPTED";
    public static final String EVENT_CALL_REJECTED = "CALL_REJECTED";
    public static final String EVENT_CALL_ENDED = "CALL_ENDED";
    public static final String EVENT_CALL_BUSY = "CALL_BUSY";
    public static final String EVENT_SIGNAL = "SIGNAL";
    public static final String EVENT_PARTICIPANT_JOINED = "PARTICIPANT_JOINED";
    public static final String EVENT_PARTICIPANT_LEFT = "PARTICIPANT_LEFT";
    public static final String EVENT_GROUP_CALL_STARTED = "GROUP_CALL_STARTED";

    // Errors
    public static final String ERR_CALL_NOT_FOUND = "Call session not found";
    public static final String ERR_UNAUTHORIZED_CALL = "You are not authorized for this call";
    public static final String ERR_USER_BUSY = "User is currently in another call";
    public static final String ERR_CANNOT_CALL_SELF = "You cannot call yourself";

    // Validation
    public static final String VALIDATION_CALL_ID_REQUIRED = "Call ID cannot be null";
    public static final String VALIDATION_CALL_ID_INVALID_UUID = "Call ID must be a valid UUID";
    public static final String VALIDATION_RECIPIENT_ID_REQUIRED = "Recipient ID cannot be null";
    public static final String VALIDATION_RECIPIENT_ID_INVALID_UUID = "Recipient ID must be a valid UUID";
    public static final String VALIDATION_CONVERSATION_ID_INVALID_UUID = "Conversation ID must be a valid UUID";
    public static final String VALIDATION_CALL_TYPE_REQUIRED = "Call type cannot be null (must be AUDIO or VIDEO)";
    public static final String VALIDATION_REASON_MAX_LENGTH = "Reason cannot exceed 255 characters";
    public static final String VALIDATION_SIGNAL_TYPE_REQUIRED = "Signal type cannot be blank";
    public static final String VALIDATION_SIGNAL_TYPE_MAX_LENGTH = "Signal type cannot exceed 30 characters";
    public static final String VALIDATION_SIGNAL_TYPE_PATTERN = "Signal type must be one of: offer, answer, ice-candidate";
    public static final String VALIDATION_SIGNAL_DATA_REQUIRED = "Signal data payload cannot be null";
}

