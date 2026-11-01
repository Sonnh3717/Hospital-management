package com.example.swd.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

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
}
