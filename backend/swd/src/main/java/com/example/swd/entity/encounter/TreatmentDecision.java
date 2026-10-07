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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "treatment_decisions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t16_01", columnNames = "encounter_id")
})
@Getter
@Setter
@NoArgsConstructor
public class TreatmentDecision extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "treatment_decision_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "encounter_id", nullable = false, unique = true, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t16_01"))
    private Encounter encounter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recorded_by_doctor_id", nullable = false, columnDefinition = "BIGINT UNSIGNED",
            foreignKey = @ForeignKey(name = "fk_t16_02"))
    private DoctorProfile recordedByDoctor;

    @Column(name = "decision_text", nullable = false, columnDefinition = "TEXT")
    private String decisionText;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;
}
