package com.example.swd.entity.billing;

import com.example.swd.entity.identity.UserAccount;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

@Entity
@Table(name = "payments", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t25_01", columnNames = "payment_reference"),
        @UniqueConstraint(name = "uq_t25_02", columnNames = { "provider", "provider_transaction_id" })
})
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "initiated_by_account_id", nullable = false)
    private UserAccount initiatedByAccount;

    @Column(name = "payment_reference", nullable = false, length = 64,
            columnDefinition = "VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin")
    private String paymentReference;

    @Column(name = "provider", nullable = false, length = 40,
            columnDefinition = "VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin")
    private String provider;

    @Column(name = "provider_transaction_id", length = 150,
            columnDefinition = "VARCHAR(150) CHARACTER SET ascii COLLATE ascii_bin")
    private String providerTransactionId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.PENDING;

    @Generated(event = EventType.INSERT)
    @Column(name = "initiated_at", nullable = false, insertable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    @Setter(lombok.AccessLevel.NONE)
    private LocalDateTime initiatedAt;

    @Column(name = "completed_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime completedAt;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    public enum Status {
        PENDING, SUCCEEDED, FAILED, CANCELLED
    }
}
