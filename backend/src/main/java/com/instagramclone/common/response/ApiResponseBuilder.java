package com.instagramclone.common.response;

import java.util.List;

/**
 * Reusable builder utility for constructing standardized {@link ApiResponse} objects.
 */
public final class ApiResponseBuilder {

    private ApiResponseBuilder() {
        // Prevent instantiation
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(200)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(200)
                .message("Request successful")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> failure(String message, T data) {
        return ApiResponse.<T>builder()
                .success(false)
                .status(400)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> failure(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .status(400)
                .message(message)
                .build();
    }

    public static <T> ApiResponse<T> failure(String message, List<String> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .status(400)
                .message(message)
                .errors(errors)
                .build();
    }
}
