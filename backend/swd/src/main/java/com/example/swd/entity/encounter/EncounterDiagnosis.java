package com.example.swd.entity.encounter;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.staff.DoctorProfile;
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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

@Entity
@Table(name = "encounter_diagnoses", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t15_01", columnNames = "primary_encounter_id")
})
@Getter
@Setter
@NoArgsConstructor
public class EncounterDiagnosis extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "encounter_diagnosis_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "encounter_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t15_01"))
    private Encounter encounter;

    @Column(name = "diagnosis_code", length = 30)
    private String diagnosisCode;

    @Column(name = "diagnosis_text", nullable = false, length = 1000)
    private String diagnosisText;

    @Column(name = "is_primary", nullable = false)
    private Boolean primary = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recorded_by_doctor_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t15_02"))
    private DoctorProfile recordedByDoctor;

    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Setter(AccessLevel.NONE)
    @Column(name = "primary_encounter_id", insertable = false, updatable = false,
            columnDefinition = "BIGINT UNSIGNED")
    private Long primaryEncounterId;
}
