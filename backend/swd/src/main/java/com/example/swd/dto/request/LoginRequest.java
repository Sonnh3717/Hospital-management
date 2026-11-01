package com.example.swd.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Nhập tên đăng nhập hoặc email.") @Size(max = 254) String username,
        @NotBlank(message = "Nhập mật khẩu.") String password) {
    @Override public String toString() { return "LoginRequest[credentials=REDACTED]"; }
}
