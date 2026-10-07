package com.example.swd.entity.identity;

import com.example.swd.entity.common.CreatedEntity;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "auth_sessions")
@Getter
@Setter
@NoArgsConstructor
public class AuthSession extends CreatedEntity {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "session_id", nullable = false, length = 36,
            columnDefinition = "CHAR(36) CHARACTER SET ascii COLLATE ascii_bin")
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_account_id", nullable = false)
    private UserAccount userAccount;

    @Column(name = "expires_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime revokedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "revocation_reason")
    private RevocationReason revocationReason;

    public enum RevocationReason {
        LOGOUT, ACCOUNT_DISABLED, PASSWORD_RESET
    }
}
