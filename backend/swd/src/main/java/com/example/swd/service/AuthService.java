package com.example.swd.service;

import com.example.swd.dto.request.LoginRequest;
import com.example.swd.dto.response.LoginResponse;
import com.example.swd.dto.response.UserInfoResponse;
import com.example.swd.security.StaffPrincipal;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    UserInfoResponse getCurrentUser(String sessionId);
    StaffPrincipal authenticate(String token);
    void logout(String sessionId);
}
