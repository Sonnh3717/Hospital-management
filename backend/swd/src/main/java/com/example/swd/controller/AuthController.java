package com.example.swd.controller;

import com.example.swd.dto.request.LoginRequest;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/login")
    AuthService.LoginView login(@Valid @RequestBody LoginRequest input) { return auth.login(input); }
    @GetMapping("/me")
    StaffPrincipal me(@AuthenticationPrincipal StaffPrincipal actor) { return actor; }
    @PostMapping("/logout")
    ResponseEntity<Void> logout(@AuthenticationPrincipal StaffPrincipal actor, @RequestHeader("Authorization") String header) {
        auth.logout(header.substring(7), actor);
        return ResponseEntity.noContent().build();
    }
}
