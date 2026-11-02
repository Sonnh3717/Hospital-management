package com.example.swd.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(max = 254)
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    @Override
    public String toString() {
        return "LoginRequest[credentials=REDACTED]";
    }
}
