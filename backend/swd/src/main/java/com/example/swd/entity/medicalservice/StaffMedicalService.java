package com.example.swd.entity.medicalservice;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.staff.HospitalStaff;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "staff_medical_services")
@Getter
@Setter
@NoArgsConstructor
public class StaffMedicalService extends AuditedEntity {

    @EmbeddedId
    private StaffMedicalServiceId id = new StaffMedicalServiceId();

    @MapsId("staffId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false)
    private HospitalStaff staff;

    @MapsId("medicalServiceId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medical_service_id", nullable = false)
    private MedicalService medicalService;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_by_staff_id", nullable = false)
    private HospitalStaff assignedByStaff;
}
