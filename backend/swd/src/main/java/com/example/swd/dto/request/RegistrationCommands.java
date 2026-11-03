package com.example.swd.dto.request;

import com.example.swd.entity.common.enums.Gender;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public final class RegistrationCommands {
    private RegistrationCommands() {}

    // Secret length/format checks live in the service: BeanValidation exceptions log rejected values at DEBUG.
    public record Register(
            @NotBlank(message = "Vui lòng nhập tên đăng nhập.")
            @Pattern(regexp = "[A-Za-z0-9._-]{3,60}", message = "Tên đăng nhập gồm 3–60 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.") String username,
            @NotBlank(message = "Vui lòng nhập họ tên.") @Size(max = 150, message = "Họ tên tối đa 150 ký tự.") String fullName,
            @NotBlank(message = "Vui lòng nhập email.") @Email(message = "Email không hợp lệ.")
            @Size(max = 254, message = "Email tối đa 254 ký tự.") String email,
            @NotBlank(message = "Vui lòng nhập mật khẩu.") String password,
            @NotBlank(message = "Vui lòng xác nhận mật khẩu.") String confirmPassword,
            @NotNull(message = "Vui lòng đồng ý với điều khoản sử dụng.")
            @AssertTrue(message = "Vui lòng đồng ý với điều khoản sử dụng.") Boolean agreeTerms) {
        @Override public String toString() { return "Register[credentials=REDACTED]"; }
    }

    public record SendOtp(
            @NotBlank(message = "Vui lòng nhập email.") @Email(message = "Email không hợp lệ.")
            @Size(max = 254, message = "Email tối đa 254 ký tự.") String email) {
        @Override public String toString() { return "SendOtp[email=REDACTED]"; }
    }

    public record VerifyOtp(
            @NotBlank(message = "Vui lòng nhập email.") @Email(message = "Email không hợp lệ.")
            @Size(max = 254, message = "Email tối đa 254 ký tự.") String email,
            @NotBlank(message = "Vui lòng nhập mã OTP.") String otp) {
        @Override public String toString() { return "VerifyOtp[credentials=REDACTED]"; }
    }

    public record CompleteProfile(
            @NotBlank(message = "Vui lòng nhập email.")
            @Email(message = "Email không hợp lệ.")
            @Size(max = 254, message = "Email tối đa 254 ký tự.")
            String email,

            @NotBlank(message = "Vui lòng nhập họ tên.")
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

            @NotBlank(message = "Vui lòng nhập địa chỉ.")
            @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
            String address,

            @Size(max = 150, message = "Họ tên người liên hệ khẩn cấp tối đa 150 ký tự.")
            String emergencyContactName,

            @Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")
            @Size(max = 25, message = "Số điện thoại người liên hệ khẩn cấp tối đa 25 ký tự.")
            String emergencyContactPhone
    ) {
        @Override public String toString() { return "CompleteProfile[email=REDACTED]"; }
    }
}
