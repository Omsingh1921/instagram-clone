package com.instagramclone.admin.service.impl;

import com.instagramclone.admin.dto.response.AdminContentItemResponse;
import com.instagramclone.admin.service.interfaces.IAdminContentModerationService;
import com.instagramclone.admin.strategy.AdminContentExplorerHandler;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminContentModerationServiceImpl implements IAdminContentModerationService {

    private final Map<String, AdminContentExplorerHandler> handlerRegistry;

    public AdminContentModerationServiceImpl(List<AdminContentExplorerHandler> handlers) {
        this.handlerRegistry = new HashMap<>();
        if (handlers != null) {
            for (AdminContentExplorerHandler handler : handlers) {
                for (String typeAlias : handler.supportedTypes()) {
                    this.handlerRegistry.put(typeAlias.toUpperCase(Locale.ENGLISH), handler);
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminContentItemResponse> getContentItems(String type, String query, Pageable pageable) {
        String normalized = type == null ? "POSTS" : type.trim().toUpperCase(Locale.ENGLISH);
        String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;
        return resolveHandler(normalized, type).browse(cleanQuery, pageable);
    }

    @Override
    @Transactional
    public void deleteContentItem(String type, UUID contentId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        String normalized = type == null ? "" : type.trim().toUpperCase(Locale.ENGLISH);
        resolveHandler(normalized, type).softDelete(contentId, adminId);
    }

    private AdminContentExplorerHandler resolveHandler(String normalizedType, String rawType) {
        AdminContentExplorerHandler handler = handlerRegistry.get(normalizedType);
        if (handler == null) {
            throw new BadRequestException("Unsupported content type: " + rawType);
        }
        return handler;
    }
}

