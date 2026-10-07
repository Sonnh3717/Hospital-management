package com.example.swd.entity.identity;

import com.example.swd.entity.common.CreatedEntity;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "password_reset_tokens", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t28_01", columnNames = "token_hash")
})
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetToken extends CreatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "password_reset_token_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_account_id", nullable = false)
    private UserAccount userAccount;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "token_hash", nullable = false, length = 32, columnDefinition = "BINARY(32)")
    private byte[] tokenHash;

    @Column(name = "expires_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime expiresAt;

    @Column(name = "used_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime usedAt;

    @Column(name = "invalidated_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime invalidatedAt;
}
