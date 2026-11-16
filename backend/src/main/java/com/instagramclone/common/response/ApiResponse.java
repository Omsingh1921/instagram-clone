package com.instagramclone.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ApiResponse<T> {

    @Builder.Default
    private boolean success = true;

    private Integer status;

    private String message;

    private T data;

    @Builder.Default
    private List<String> errors = new ArrayList<>();

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(200)
                .message("Request successful")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(200)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(int status, String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(status)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data, String path) {
        return success(message, data);
    }

    public static <T> ApiResponse<T> success(int status, String message, T data, String path) {
        return success(status, message, data);
    }

    public static <T> ApiResponse<T> error(int status, String message, List<String> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .status(status)
                .message(message)
                .errors(errors != null ? errors : new ArrayList<>())
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(int status, String message, List<String> errors, String path) {
        return error(status, message, errors);
    }

    public static <T> ApiResponse<T> error(int status, String message, String error, String path) {
        List<String> errorList = new ArrayList<>();
        if (error != null) {
            errorList.add(error);
        }
        return error(status, message, errorList);
    }

    public static <T> ApiResponse<T> error(String message, List<String> errors, String path) {
        return error(400, message, errors);
    }

    public static <T> ApiResponse<T> error(String message, String error, String path) {
        return error(400, message, error, path);
    }
}
