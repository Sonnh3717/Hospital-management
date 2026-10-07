package com.example.swd.entity.medicalservice;

import com.example.swd.entity.common.AuditedEntity;
import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "medical_services", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t18_01", columnNames = "service_code")
})
@Getter
@Setter
@NoArgsConstructor
public class MedicalService extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "medical_service_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "service_code", nullable = false, length = 30)
    private String serviceCode;

    @Column(name = "service_name", nullable = false, length = 180)
    private String serviceName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "estimated_duration_minutes", columnDefinition = "SMALLINT UNSIGNED")
    private Integer estimatedDurationMinutes;

    @Column(name = "result_requirements", columnDefinition = "TEXT")
    private String resultRequirements;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;
}
