package com.instagramclone.utility;

import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Centralized API response utility adhering to Section 49.2 (ApiUtility) and Section 55 (API Utility + Common API Standard).
 * Standardizes API response construction on top of ApiResponse<T> and PageResponse<T>.
 */
public final class ApiUtility {

    private ApiUtility() {}

    public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    public static <T> ResponseEntity<ApiResponse<T>> ok(String message, T data) {
        return ResponseEntity.ok(ApiResponse.success(message, data));
    }

    public static <T> ResponseEntity<ApiResponse<T>> created(String message, T data) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(message, data));
    }

    public static <T> ResponseEntity<ApiResponse<PageResponse<T>>> page(Page<T> page) {
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }
}
