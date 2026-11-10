package com.example.swd.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime startsAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime endsAt;
    private String paymentStatus;
    private String qrCodeData;
}

