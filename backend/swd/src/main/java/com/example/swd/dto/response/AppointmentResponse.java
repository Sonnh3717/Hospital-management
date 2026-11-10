package com.example.swd.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime startsAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime endsAt;

    private Long doctorId;
    private String doctorName;
    private String specialization;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime checkedInAt;
    private String checkedInByStaffName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime cancelledAt;
    private String cancellationReason;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime lastRescheduledAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime lastCheckInReversedAt;

    private Long encounterId;
    private String encounterStatus;
}
