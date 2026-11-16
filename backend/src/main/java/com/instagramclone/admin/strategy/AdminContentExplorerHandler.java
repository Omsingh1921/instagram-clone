package com.instagramclone.admin.strategy;

import com.instagramclone.admin.dto.response.AdminContentItemResponse;
import com.instagramclone.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.Set;
import java.util.UUID;

/**
 * OCP strategy for browsing and soft-deleting platform content types in the Admin Content Explorer.
 */
public interface AdminContentExplorerHandler {

    Set<String> supportedTypes();

    PageResponse<AdminContentItemResponse> browse(String cleanQuery, Pageable pageable);

    void softDelete(UUID contentId, UUID adminId);
}

