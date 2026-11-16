package com.instagramclone.note.controller;

import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.note.dto.request.CreateNoteRequest;
import com.instagramclone.note.dto.response.NoteResponse;
import com.instagramclone.note.service.interfaces.INoteService;
import com.instagramclone.ratelimit.RateLimit;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class NoteController {

    private final INoteService noteService;

    @RateLimit(category = "note-create", limit = 15, windowSeconds = 60)
    @PostMapping
    public ResponseEntity<ApiResponse<NoteResponse>> createOrUpdateNote(@Valid @RequestBody CreateNoteRequest request) {
        NoteResponse response = noteService.createOrUpdateNote(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Note shared successfully", response));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<List<NoteResponse>>> getActiveNotesFeed() {
        List<NoteResponse> notes = noteService.getActiveNotesFeed();
        return ResponseEntity.ok(ApiResponse.success("Active notes retrieved successfully", notes));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteCurrentNote() {
        noteService.deleteCurrentNote();
        return ResponseEntity.ok(ApiResponse.success("Note deleted successfully", null));
    }
}
