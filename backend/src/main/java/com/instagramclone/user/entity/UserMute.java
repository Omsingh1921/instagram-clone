package com.instagramclone.user.entity;

import com.instagramclone.common.entity.BaseCreatedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
    name = "user_mutes",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_mute", columnNames = {"user_id", "muted_user_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserMute extends BaseCreatedEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "muted_user_id", nullable = false)
    private User mutedUser;

    @Column(name = "mute_posts", nullable = false)
    @Builder.Default
    private boolean mutePosts = true;

    @Column(name = "mute_stories", nullable = false)
    @Builder.Default
    private boolean muteStories = true;
}
