package com.example.swd.controller;

import com.example.swd.dto.request.LoginRequest;
import com.example.swd.dto.response.LoginResponse;
import com.example.swd.dto.response.UserInfoResponse;
import com.example.swd.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = extractToken(authorization);
        UserInfoResponse userInfo = authService.getCurrentUser(token);
        return ResponseEntity.ok(userInfo);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = extractToken(authorization);
        if (token != null) {
            authService.logout(token);
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Đăng xuất thành công"));
    }

    private String extractToken(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ") && authorization.length() > 7) {
            return authorization.substring(7).trim();
        }
        return null;
    }
}
