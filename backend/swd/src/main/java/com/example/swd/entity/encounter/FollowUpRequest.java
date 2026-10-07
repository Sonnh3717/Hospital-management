package com.example.swd.entity.encounter;

import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.common.enums.Priority;
import com.example.swd.entity.staff.DoctorProfile;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
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
@Table(name = "follow_up_requests", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t17_01", columnNames = "scheduled_appointment_id")
})
@Getter
@Setter
@NoArgsConstructor
public class FollowUpRequest extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "follow_up_request_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "encounter_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t17_01"))
    private Encounter encounter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_doctor_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t17_02"))
    private DoctorProfile requestedByDoctor;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "requested_from_date", nullable = false)
    private LocalDate requestedFromDate;

    @Column(name = "requested_to_date")
    private LocalDate requestedToDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, columnDefinition = "ENUM('ROUTINE','URGENT')")
    private Priority priority = Priority.ROUTINE;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduled_appointment_id", unique = true, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t17_03"))
    private Appointment scheduledAppointment;
}
