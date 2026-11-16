package com.instagramclone.note.service.impl;

import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.follow.repository.FollowRepository;
import com.instagramclone.note.dto.request.CreateNoteRequest;
import com.instagramclone.note.dto.response.NoteResponse;
import com.instagramclone.note.entity.UserNote;
import com.instagramclone.note.repository.UserNoteRepository;
import com.instagramclone.note.service.interfaces.INoteService;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoteServiceImpl implements INoteService {

    private final UserNoteRepository userNoteRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    @Override
    @Transactional
    public NoteResponse createOrUpdateNote(CreateNoteRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserId));

        // Delete any existing notes for this user so they only have 1 active note
        userNoteRepository.deleteByUserId(currentUserId);

        LocalDateTime now = LocalDateTime.now();
        UserNote note = UserNote.builder()
                .user(user)
                .text(request.getText().trim())
                .createdAt(now)
                .expiresAt(now.plusHours(24))
                .build();

        UserNote saved = userNoteRepository.save(note);
        log.info("Created Instagram Note for user {}", user.getUsername());
        return toNoteResponse(saved, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteResponse> getActiveNotesFeed() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<UUID> followingIds = followRepository.findFollowingIdsByFollowerId(currentUserId);
        List<UUID> targetUserIds = new ArrayList<>(followingIds);
        targetUserIds.add(currentUserId);

        LocalDateTime now = LocalDateTime.now();
        List<UserNote> activeNotes = userNoteRepository.findActiveNotesByUserIds(targetUserIds, now);

        return activeNotes.stream()
                .map(note -> toNoteResponse(note, currentUserId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteCurrentNote() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        userNoteRepository.deleteByUserId(currentUserId);
        log.info("Deleted Instagram Note for user {}", currentUserId);
    }

    private NoteResponse toNoteResponse(UserNote note, UUID currentUserId) {
        User u = note.getUser();
        UserSummaryResponse userSummary = UserSummaryResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                .avatarUrl(u.getProfile() != null ? u.getProfile().getAvatarUrl() : null)
                .build();

        return NoteResponse.builder()
                .id(note.getId())
                .user(userSummary)
                .text(note.getText())
                .createdAt(note.getCreatedAt())
                .expiresAt(note.getExpiresAt())
                .isOwnNote(u.getId().equals(currentUserId))
                .build();
    }
}
