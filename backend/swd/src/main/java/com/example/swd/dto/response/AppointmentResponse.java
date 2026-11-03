package com.example.swd.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AppointmentResponse {
    private Long id;
    private String appointmentCode;
    private String status;
    private String bookingSource;
    private String reason;
    private String note;

    private Long patientId;
    private String patientName;
    private String patientPhone;
    private String patientGender;

    private Long slotId;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;

    private Long doctorId;
    private String doctorName;
    private String specialization;

    private LocalDateTime checkedInAt;
    private String checkedInByStaffName;

    private LocalDateTime cancelledAt;
    private String cancellationReason;

    private LocalDateTime lastRescheduledAt;
    private LocalDateTime lastCheckInReversedAt;

    private Long encounterId;
    private String encounterStatus;
}
