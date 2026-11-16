package com.instagramclone.user.entity;

import com.instagramclone.common.entity.BaseCreatedEntity;
import com.instagramclone.user.enums.BlockReason;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
    name = "user_blocks",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_blocks", columnNames = {"blocker_id", "blocked_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserBlock extends BaseCreatedEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", length = 50, nullable = false)
    @Builder.Default
    private BlockReason reason = BlockReason.NOT_SPECIFIED;

    @Column(name = "block_future_accounts", nullable = false)
    @Builder.Default
    private Boolean blockFutureAccounts = true;

    @Column(name = "notes", length = 255)
    private String notes;
}
