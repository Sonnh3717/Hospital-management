package com.example.swd.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AppointmentTicketResponse {
    private Long appointmentId;
    private String appointmentCode;
    private String status;
    private String patientName;
    private String patientPhone;
    private String doctorName;
    private String specialization;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private String paymentStatus;
    private String qrCodeData;
}

