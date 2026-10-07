package com.example.swd.entity.scheduling;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.staff.HospitalStaff;
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
import jakarta.persistence.Version;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "work_schedules")
@Getter
@Setter
@NoArgsConstructor
public class WorkSchedule extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_schedule_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t07_01"))
    private HospitalStaff staff;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shift_template_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t07_02"))
    private ShiftTemplate shiftTemplate;

    @Column(name = "starts_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime startsAt;

    @Column(name = "ends_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime endsAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "ENUM('SCHEDULED','CANCELLED')")
    private ScheduleStatus status = ScheduleStatus.SCHEDULED;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_by_staff_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t07_03"))
    private HospitalStaff assignedByStaff;

    @Column(name = "note", length = 500)
    private String note;

    @Version
    @Column(name = "row_version", nullable = false, columnDefinition = "INT UNSIGNED")
    // Keep null before persistence so Spring Data identifies new entities; Hibernate initializes it to 0.
    private Long rowVersion;

    public enum ScheduleStatus {
        SCHEDULED,
        CANCELLED
    }
}
