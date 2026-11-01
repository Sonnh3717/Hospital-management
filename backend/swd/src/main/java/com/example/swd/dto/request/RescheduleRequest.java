package com.example.swd.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RescheduleRequest {
    @NotNull(message = "Khung giờ khám mới không được để trống")
    private Long newAppointmentSlotId;

    private String reason;
}

