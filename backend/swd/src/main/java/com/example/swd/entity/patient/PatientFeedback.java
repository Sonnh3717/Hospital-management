package com.example.swd.entity.patient;

import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.common.AuditedEntity;
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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "patient_feedback", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t26_01", columnNames = "appointment_id")
})
@Getter
@Setter
@NoArgsConstructor
public class PatientFeedback extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "patient_feedback_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(name = "rating", nullable = false, columnDefinition = "TINYINT UNSIGNED")
    private Short rating;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "handling_status", nullable = false)
    private HandlingStatus handlingStatus = HandlingStatus.NEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by_staff_id")
    private HospitalStaff handledByStaff;

    @Column(name = "handling_note", columnDefinition = "TEXT")
    private String handlingNote;

    @Column(name = "handling_updated_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime handlingUpdatedAt;

    public enum HandlingStatus {
        NEW, IN_PROGRESS, RESOLVED
    }
}
