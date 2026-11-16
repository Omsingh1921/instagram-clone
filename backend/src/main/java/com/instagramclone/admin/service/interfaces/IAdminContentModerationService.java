package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.response.AdminContentItemResponse;
import com.instagramclone.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Segregated contract for browsing and moderating published content in Admin Content Explorer.
 */
public interface IAdminContentModerationService {

    PageResponse<AdminContentItemResponse> getContentItems(String type, String query, Pageable pageable);

    void deleteContentItem(String type, UUID contentId);
}

