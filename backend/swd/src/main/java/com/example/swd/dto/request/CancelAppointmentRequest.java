package com.example.swd.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CancelAppointmentRequest {
    @NotBlank(message = "Lý do hủy lịch không được để trống")
    private String reason;
}

