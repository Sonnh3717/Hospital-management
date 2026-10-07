package com.example.swd.entity.appointment;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.staff.HospitalStaff;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
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
@Table(name = "appointment_rules", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t11_01", columnNames = "rule_code")
})
@Getter
@Setter
@NoArgsConstructor
public class AppointmentRule extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appointment_rule_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "rule_code", nullable = false, length = 30)
    private String ruleCode;

    @Column(name = "rule_name", nullable = false, length = 150)
    private String ruleName;

    @Column(name = "slot_duration_minutes", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private Integer slotDurationMinutes;

    @Column(name = "default_slot_capacity", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private Integer defaultSlotCapacity;

    @Column(name = "min_booking_notice_minutes", nullable = false, columnDefinition = "INT UNSIGNED")
    private Long minBookingNoticeMinutes;

    @Column(name = "max_booking_days_ahead", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private Integer maxBookingDaysAhead;

    @Column(name = "cancellation_notice_minutes", nullable = false, columnDefinition = "INT UNSIGNED")
    private Long cancellationNoticeMinutes;

    @Column(name = "reschedule_notice_minutes", nullable = false, columnDefinition = "INT UNSIGNED")
    private Long rescheduleNoticeMinutes;

    @Column(name = "no_show_grace_minutes", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private Integer noShowGraceMinutes;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "updated_by_staff_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t11_01"))
    private HospitalStaff updatedByStaff;
}
