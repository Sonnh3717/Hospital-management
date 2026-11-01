package com.example.swd.dto.request;

import com.example.swd.entity.appointment.Appointment.BookingSource;
import com.example.swd.entity.common.enums.Gender;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public final class ReceptionRequests {
    private ReceptionRequests() {}
    public record NewPatient(
            @NotBlank(message = "Nhập họ tên bệnh nhân.") @Size(max = 150) String fullName,
            @PastOrPresent(message = "Ngày sinh không được ở tương lai.") LocalDate dateOfBirth,
            Gender gender,
            @Size(max = 25) String phone,
            @Email(message = "Email không hợp lệ.") @Size(max = 254) String contactEmail) {}
    public record CreateAppointment(
            @Positive Long patientId,
            @Valid NewPatient patient,
            @NotNull @Positive Long slotId,
            @NotNull BookingSource bookingSource,
            @Size(max = 500) String reason,
            @NotBlank @Size(max = 100) String idempotencyKey) {}
    public record CancelAppointment(@Size(max = 500) String reason) {}
    public record RescheduleAppointment(@NotNull @Positive Long slotId) {}
}
