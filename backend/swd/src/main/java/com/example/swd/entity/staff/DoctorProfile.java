package com.example.swd.entity.staff;

import com.example.swd.entity.common.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "doctor_profiles", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t04_01", columnNames = "license_number")
})
@Getter
@Setter
@NoArgsConstructor
public class DoctorProfile extends AuditedEntity {

    @Id
    @Column(name = "doctor_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t04_01"))
    private HospitalStaff staff;

    @Column(name = "license_number", nullable = false, length = 60)
    private String licenseNumber;

    @Column(name = "specialization", nullable = false, length = 150)
    private String specialization;

    @Column(name = "qualification_summary", columnDefinition = "TEXT")
    private String qualificationSummary;

    @Column(name = "biography", columnDefinition = "TEXT")
    private String biography;

    @Column(name = "profile_image_url", length = 1024)
    private String profileImageUrl;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
