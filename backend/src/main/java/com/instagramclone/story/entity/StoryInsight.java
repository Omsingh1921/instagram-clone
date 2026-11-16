package com.instagramclone.story.entity;

import com.instagramclone.common.entity.BaseCreatedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "story_insights")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class StoryInsight extends BaseCreatedEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false, unique = true)
    private Story story;

    @Column(name = "impressions", nullable = false)
    @Builder.Default
    private Long impressions = 0L;

    @Column(name = "reach", nullable = false)
    @Builder.Default
    private Long reach = 0L;

    @Column(name = "forwards", nullable = false)
    @Builder.Default
    private Long forwards = 0L;

    @Column(name = "backwards", nullable = false)
    @Builder.Default
    private Long backwards = 0L;

    @Column(name = "exits", nullable = false)
    @Builder.Default
    private Long exits = 0L;

    @Column(name = "replies", nullable = false)
    @Builder.Default
    private Long replies = 0L;

    @Column(name = "profile_visits", nullable = false)
    @Builder.Default
    private Long profileVisits = 0L;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
