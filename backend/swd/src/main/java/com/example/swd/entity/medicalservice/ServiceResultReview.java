package com.example.swd.entity.medicalservice;

import com.example.swd.entity.staff.DoctorProfile;
import java.time.LocalDateTime;

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
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

@Entity
@Table(name = "service_result_reviews", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t22_01", columnNames = "medical_service_result_id")
})
@Getter
@Setter
@NoArgsConstructor
public class ServiceResultReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_result_review_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medical_service_result_id", nullable = false, unique = true)
    private MedicalServiceResult medicalServiceResult;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewing_doctor_id", nullable = false)
    private DoctorProfile reviewingDoctor;

    @Column(name = "handling_decision", nullable = false, columnDefinition = "TEXT")
    private String handlingDecision;

    @Generated(event = EventType.INSERT)
    @Column(name = "handled_at", nullable = false, insertable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    @Setter(lombok.AccessLevel.NONE)
    private LocalDateTime handledAt;
}
