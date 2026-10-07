package com.example.swd.entity.scheduling;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.identity.Role;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "work_time_policies", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t08_01", columnNames = "role_id")
})
@Getter
@Setter
@NoArgsConstructor
public class WorkTimePolicy extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_time_policy_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_t08_01"))
    private Role role;

    @Column(name = "max_daily_work_minutes", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private Integer maxDailyWorkMinutes;

    @Column(name = "max_weekly_work_minutes", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private Integer maxWeeklyWorkMinutes;

    @Column(name = "min_rest_minutes", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private Integer minRestMinutes;

    @Column(name = "schedule_change_notice_days", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private Integer scheduleChangeNoticeDays = 7;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "updated_by_staff_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t08_02"))
    private HospitalStaff updatedByStaff;
}
