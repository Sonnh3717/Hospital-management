package com.example.swd.entity.scheduling;

import com.example.swd.entity.common.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "shift_templates", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t06_01", columnNames = "shift_code")
})
@Getter
@Setter
@NoArgsConstructor
public class ShiftTemplate extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shift_template_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "shift_code", nullable = false, length = 30)
    private String shiftCode;

    @Column(name = "shift_name", nullable = false, length = 100)
    private String shiftName;

    @Column(name = "start_time", nullable = false, columnDefinition = "TIME")
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false, columnDefinition = "TIME")
    private LocalTime endTime;

    @Column(name = "end_day_offset", nullable = false, columnDefinition = "TINYINT UNSIGNED")
    private Short endDayOffset = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
