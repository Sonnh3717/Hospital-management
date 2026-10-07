package com.example.swd.entity.medicalservice;

import com.example.swd.entity.common.enums.Priority;
import com.example.swd.entity.encounter.Encounter;
import com.example.swd.entity.staff.DoctorProfile;
import com.example.swd.entity.staff.HospitalStaff;
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
import jakarta.persistence.JoinColumns;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

@Entity
@Table(name = "medical_service_requests", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t20_01", columnNames = "request_code")
})
@Getter
@Setter
@NoArgsConstructor
public class MedicalServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "medical_service_request_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "request_code", nullable = false, length = 40)
    private String requestCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "encounter_id", nullable = false)
    private Encounter encounter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requesting_doctor_id", nullable = false)
    private DoctorProfile requestingDoctor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medical_service_id", nullable = false)
    private MedicalService medicalService;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private Priority priority = Priority.ROUTINE;

    @Column(name = "clinical_indication", columnDefinition = "TEXT")
    private String clinicalIndication;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.ORDERED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_staff_id")
    private HospitalStaff responsibleStaff;

    // The actual database FK also verifies that this staff member is assigned to this service.
    // Both read-only join columns remain optional for Hibernate; medicalService owns NOT NULL.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "responsible_staff_id", referencedColumnName = "staff_id",
                    insertable = false, updatable = false),
            @JoinColumn(name = "medical_service_id", referencedColumnName = "medical_service_id",
                    insertable = false, updatable = false)
    })
    @Setter(lombok.AccessLevel.NONE)
    private StaffMedicalService responsibleAssignment;

    @Generated(event = EventType.INSERT)
    @Column(name = "requested_at", nullable = false, insertable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    @Setter(lombok.AccessLevel.NONE)
    private LocalDateTime requestedAt;

    @Column(name = "accepted_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime acceptedAt;

    @Column(name = "started_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime startedAt;

    @Column(name = "completed_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "unable_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime unableAt;

    @Column(name = "unable_reason", columnDefinition = "TEXT")
    private String unableReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unable_recorded_by_staff_id")
    private HospitalStaff unableRecordedByStaff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "unable_recorded_by_staff_id", referencedColumnName = "staff_id",
                    insertable = false, updatable = false),
            @JoinColumn(name = "medical_service_id", referencedColumnName = "medical_service_id",
                    insertable = false, updatable = false)
    })
    @Setter(lombok.AccessLevel.NONE)
    private StaffMedicalService unableRecordedByAssignment;

    @Generated(event = { EventType.INSERT, EventType.UPDATE })
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    @Setter(lombok.AccessLevel.NONE)
    private LocalDateTime updatedAt;

    public enum Status {
        ORDERED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, UNABLE_TO_PERFORM
    }
}
