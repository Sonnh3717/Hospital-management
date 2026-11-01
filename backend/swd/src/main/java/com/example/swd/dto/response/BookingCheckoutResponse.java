package com.example.swd.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class BookingCheckoutResponse {
    private Long appointmentId;
    private String appointmentCode;
    private Long orderCode;
    private BigDecimal amount;
    private String paymentStatus;
    private String checkoutUrl;
    private String qrCodeText;
}

