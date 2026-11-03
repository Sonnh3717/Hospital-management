package com.example.swd.dto.response;

import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Gender;
import java.time.LocalDate;

public final class ReceptionPatientViews {
    private ReceptionPatientViews() {}

    public record PatientListItemView(
            Long id,
            String patientCode,
            String fullName,
            LocalDate dateOfBirth,
            Gender gender,
            String phone,
            String contactEmail,
            String address,
            Long userAccountId,
            String username,
            ActiveStatus accountStatus
    ) {}

    public record PatientDetailView(
            Long id,
            String patientCode,
            String fullName,
            LocalDate dateOfBirth,
            Gender gender,
            String phone,
            String contactEmail,
            String address,
            String emergencyContactName,
            String emergencyContactPhone,
            Long userAccountId,
            String username,
            ActiveStatus accountStatus,
            String createdAt,
            String updatedAt
    ) {}
}
