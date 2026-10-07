package com.example.swd.entity.billing;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.encounter.Encounter;
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

@Entity
@Table(name = "invoices", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t23_01", columnNames = "invoice_number")
})
@Getter
@Setter
@NoArgsConstructor
public class Invoice extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "invoice_number", nullable = false, length = 40)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "encounter_id", nullable = false)
    private Encounter encounter;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_status", nullable = false)
    private DocumentStatus documentStatus = DocumentStatus.DRAFT;

    @Column(name = "issued_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime issuedAt;

    @Column(name = "due_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime dueAt;

    @Column(name = "note", length = 500)
    private String note;

    public enum DocumentStatus {
        DRAFT, ISSUED, VOID
    }
}
