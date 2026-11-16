package com.instagramclone.admin.strategy;

import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * DIP/OCP abstraction contributing a single stream of platform events to the Admin recent activity feed.
 */
public interface AdminActivityProvider {

    List<AdminActivityItemResponse> fetchRecent(Pageable slice);
}

