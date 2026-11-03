package com.example.swd.entity.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Only self-registered accounts have a row; INACTIVE alone never grants activation rights. */
@Entity
@Table(name = "registration_verifications")
@Getter
@Setter
@NoArgsConstructor
public class RegistrationVerification {
    @Id
    @Column(name = "user_account_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_account_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_registration_account"))
    private UserAccount userAccount;

    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash;
    @Column(name = "expires_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime expiresAt;
    @Column(name = "last_sent_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime lastSentAt;
    @Column(name = "failed_attempts", nullable = false, columnDefinition = "INT UNSIGNED")
    private int failedAttempts;
    @Column(name = "verified_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime verifiedAt;
    @Column(name = "terms_accepted_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime termsAcceptedAt;
}
