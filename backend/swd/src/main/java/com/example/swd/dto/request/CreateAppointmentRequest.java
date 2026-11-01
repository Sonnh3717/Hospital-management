package com.example.swd.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateAppointmentRequest {
    @NotNull(message = "Khung giờ khám không được để trống")
    private Long appointmentSlotId;

    private Long patientId; // Dành cho Tiếp tân hoặc Bệnh nhân đã đăng nhập

    // Thông tin tạo nhanh hồ sơ bệnh nhân mới (nếu chưa có patientId)
    private String fullName;
    private String phoneNumber;
    private String gender; // MALE, FEMALE, OTHER
    private String dateOfBirth; // YYYY-MM-DD
    private String email;
    private String identityCardNumber;
    private String address;

    @NotBlank(message = "Lý do khám không được để trống")
    private String reason;

    private String note;
    private String bookingSource; // ONLINE, ASSISTED, WALK_IN
}

