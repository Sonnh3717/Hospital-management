package com.example.swd.entity.appointment;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.staff.HospitalStaff;
import java.time.LocalDateTime;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

@Entity
@Table(name = "appointments", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t13_01", columnNames = "appointment_code"),
        @UniqueConstraint(name = "uq_t13_02", columnNames = {"patient_id", "active_slot_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class Appointment extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appointment_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "appointment_code", nullable = false, length = 40)
    private String appointmentCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t13_01"))
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_slot_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t13_02"))
    private AppointmentSlot appointmentSlot;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_source", nullable = false, columnDefinition = "ENUM('ONLINE','ASSISTED','WALK_IN')")
    private BookingSource bookingSource;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false,
            columnDefinition = "ENUM('BOOKED','CHECKED_IN','CANCELLED','NO_SHOW')")
    private Status status = Status.BOOKED;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_account_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t13_03"))
    private UserAccount createdByAccount;

    @Column(name = "checked_in_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime checkedInAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_in_by_staff_id", columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t13_04"))
    private HospitalStaff checkedInByStaff;

    @Column(name = "last_check_in_reversed_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime lastCheckInReversedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_check_in_reversed_by_staff_id", columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t13_05"))
    private HospitalStaff lastCheckInReversedByStaff;

    @Column(name = "cancelled_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime cancelledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_account_id", columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t13_06"))
    private UserAccount cancelledByAccount;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "no_show_marked_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime noShowMarkedAt;

    @Column(name = "last_rescheduled_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime lastRescheduledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_rescheduled_by_account_id", columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t13_07"))
    private UserAccount lastRescheduledByAccount;

    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Setter(AccessLevel.NONE)
    @Column(name = "active_slot_id", insertable = false, updatable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long activeSlotId;

    public enum BookingSource {
        ONLINE, ASSISTED, WALK_IN
    }

    public enum Status {
        BOOKED, CHECKED_IN, CANCELLED, NO_SHOW
    }
}
