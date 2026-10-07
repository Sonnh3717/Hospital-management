package com.example.swd.entity.billing;

import com.example.swd.entity.common.CreatedEntity;
import com.example.swd.entity.medicalservice.MedicalServiceRequest;
import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "invoice_items", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t24_01", columnNames = "medical_service_request_id")
})
@Getter
@Setter
@NoArgsConstructor
public class InvoiceItem extends CreatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_item_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medical_service_request_id", nullable = false, unique = true)
    private MedicalServiceRequest medicalServiceRequest;

    @Column(name = "service_name_at_billing", nullable = false, length = 180)
    private String serviceNameAtBilling;

    @Column(name = "unit_price_at_billing", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPriceAtBilling;
}
