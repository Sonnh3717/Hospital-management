package com.example.swd.entity.scheduling;

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
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "schedule_events")
@Getter
@Setter
@NoArgsConstructor
public class ScheduleEvent extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_event_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t10_01"))
    private HospitalStaff staff;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "starts_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime startsAt;

    @Column(name = "ends_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime endsAt;

    @Column(name = "blocks_booking", nullable = false)
    private Boolean blocksBooking = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_staff_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t10_02"))
    private HospitalStaff createdByStaff;
}
