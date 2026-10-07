package com.example.swd.entity.medicalservice;

import com.example.swd.entity.staff.HospitalStaff;
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
@Table(name = "medical_service_results", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t21_01", columnNames = "medical_service_request_id")
})
@Getter
@Setter
@NoArgsConstructor
public class MedicalServiceResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "medical_service_result_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medical_service_request_id", nullable = false, unique = true)
    private MedicalServiceRequest medicalServiceRequest;

    @Column(name = "result_summary", nullable = false, columnDefinition = "TEXT")
    private String resultSummary;

    @Column(name = "result_content", nullable = false, columnDefinition = "LONGTEXT")
    private String resultContent;

    @Column(name = "attachment_url", length = 1024)
    private String attachmentUrl;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recorded_by_staff_id", nullable = false)
    private HospitalStaff recordedByStaff;

    @Generated(event = EventType.INSERT)
    @Column(name = "finalized_at", nullable = false, insertable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    @Setter(lombok.AccessLevel.NONE)
    private LocalDateTime finalizedAt;
}
