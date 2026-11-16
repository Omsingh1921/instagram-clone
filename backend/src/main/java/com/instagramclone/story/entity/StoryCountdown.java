package com.instagramclone.story.entity;

import com.instagramclone.common.entity.BaseCreatedEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "story_countdowns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class StoryCountdown extends BaseCreatedEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false, unique = true)
    private Story story;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "target_date", nullable = false)
    private LocalDateTime targetDate;

    @OneToMany(mappedBy = "countdown", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StoryCountdownSubscriber> subscribers = new ArrayList<>();
}
