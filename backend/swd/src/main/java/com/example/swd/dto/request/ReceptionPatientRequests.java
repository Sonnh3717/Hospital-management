package com.example.swd.dto.request;

import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public final class ReceptionPatientRequests {
    private ReceptionPatientRequests() {}

    public record CreatePatientRequest(
            @NotBlank(message = "Vui lòng nhập họ tên bệnh nhân.")
            @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
            String fullName,

            @NotNull(message = "Vui lòng chọn ngày sinh.")
            @PastOrPresent(message = "Ngày sinh không được ở tương lai.")
            LocalDate dateOfBirth,

            @NotNull(message = "Vui lòng chọn giới tính.")
            Gender gender,

            @NotBlank(message = "Vui lòng nhập số điện thoại.")
            @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84).")
            @Size(max = 25, message = "Số điện thoại tối đa 25 ký tự.")
            String phone,

            @Email(message = "Email liên hệ không hợp lệ.")
            @Size(max = 254, message = "Email tối đa 254 ký tự.")
            String contactEmail,

            @NotBlank(message = "Vui lòng nhập địa chỉ.")
            @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
            String address,

            @Size(max = 150, message = "Họ tên người liên hệ khẩn cấp tối đa 150 ký tự.")
            String emergencyContactName,

            @Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")
            @Size(max = 25, message = "Số điện thoại người liên hệ khẩn cấp tối đa 25 ký tự.")
            String emergencyContactPhone
    ) {}

    public record UpdatePatientRequest(
            @NotBlank(message = "Vui lòng nhập họ tên bệnh nhân.")
            @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
            String fullName,

            @NotNull(message = "Vui lòng chọn ngày sinh.")
            @PastOrPresent(message = "Ngày sinh không được ở tương lai.")
            LocalDate dateOfBirth,

            @NotNull(message = "Vui lòng chọn giới tính.")
            Gender gender,

            @NotBlank(message = "Vui lòng nhập số điện thoại.")
            @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84).")
            @Size(max = 25, message = "Số điện thoại tối đa 25 ký tự.")
            String phone,

            @Email(message = "Email liên hệ không hợp lệ.")
            @Size(max = 254, message = "Email tối đa 254 ký tự.")
            String contactEmail,

            @NotBlank(message = "Vui lòng nhập địa chỉ.")
            @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
            String address,

            @Size(max = 150, message = "Họ tên người liên hệ khẩn cấp tối đa 150 ký tự.")
            String emergencyContactName,

            @Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")
            @Size(max = 25, message = "Số điện thoại người liên hệ khẩn cấp tối đa 25 ký tự.")
            String emergencyContactPhone
    ) {}

    public record UpdateStatusRequest(
            @NotNull(message = "Vui lòng chọn trạng thái tài khoản.")
            ActiveStatus status
    ) {}
}
