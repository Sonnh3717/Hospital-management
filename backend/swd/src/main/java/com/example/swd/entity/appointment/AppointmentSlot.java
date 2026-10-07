package com.example.swd.entity.appointment;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.scheduling.WorkSchedule;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "appointment_slots", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t12_01", columnNames = {"work_schedule_id", "starts_at"})
})
@Getter
@Setter
@NoArgsConstructor
public class AppointmentSlot extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appointment_slot_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_schedule_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t12_01"))
    private WorkSchedule workSchedule;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_rule_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t12_02"))
    private AppointmentRule appointmentRule;

    @Column(name = "starts_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime startsAt;

    @Column(name = "ends_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime endsAt;

    @Column(name = "capacity", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "ENUM('OPEN','BLOCKED')")
    private Status status = Status.OPEN;

    public enum Status {
        OPEN, BLOCKED
    }
}
