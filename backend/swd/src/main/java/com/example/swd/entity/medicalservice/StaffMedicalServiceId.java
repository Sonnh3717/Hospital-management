package com.example.swd.entity.medicalservice;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class StaffMedicalServiceId implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "staff_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long staffId;

    @Column(name = "medical_service_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long medicalServiceId;

    public StaffMedicalServiceId(Long staffId, Long medicalServiceId) {
        this.staffId = staffId;
        this.medicalServiceId = medicalServiceId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof StaffMedicalServiceId that)) {
            return false;
        }
        return Objects.equals(staffId, that.staffId)
                && Objects.equals(medicalServiceId, that.medicalServiceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(staffId, medicalServiceId);
    }
}
