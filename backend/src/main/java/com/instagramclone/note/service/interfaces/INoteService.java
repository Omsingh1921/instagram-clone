package com.instagramclone.note.service.interfaces;

import com.instagramclone.note.dto.request.CreateNoteRequest;
import com.instagramclone.note.dto.response.NoteResponse;

import java.util.List;

public interface INoteService {
    NoteResponse createOrUpdateNote(CreateNoteRequest request);
    List<NoteResponse> getActiveNotesFeed();
    void deleteCurrentNote();
}
