package com.example.swd.entity.scheduling;

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
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

@Entity
@Table(name = "schedule_change_requests")
@Getter
@Setter
@NoArgsConstructor
public class ScheduleChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_change_request_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_schedule_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t09_01"))
    private WorkSchedule workSchedule;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_staff_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t09_02"))
    private HospitalStaff requestedByStaff;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, columnDefinition = "ENUM('LEAVE','RESCHEDULE')")
    private RequestType requestType;

    @Column(name = "based_on_version", nullable = false, columnDefinition = "INT UNSIGNED")
    private Long basedOnVersion;

    @Column(name = "original_starts_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime originalStartsAt;

    @Column(name = "original_ends_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime originalEndsAt;

    @Column(name = "requested_starts_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime requestedStartsAt;

    @Column(name = "requested_ends_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime requestedEndsAt;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false,
            columnDefinition = "ENUM('PENDING','APPROVED','REJECTED')")
    private RequestStatus status = RequestStatus.PENDING;

    @Generated(event = EventType.INSERT)
    @Column(name = "submitted_at", nullable = false, insertable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    private LocalDateTime submittedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "processed_by_staff_id", nullable = true,
            foreignKey = @ForeignKey(name = "fk_t09_03"))
    private HospitalStaff processedByStaff;

    @Column(name = "processed_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime processedAt;

    @Column(name = "decision_note", columnDefinition = "TEXT")
    private String decisionNote;

    public enum RequestType {
        LEAVE,
        RESCHEDULE
    }

    public enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}
