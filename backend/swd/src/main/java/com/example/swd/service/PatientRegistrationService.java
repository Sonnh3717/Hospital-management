package com.example.swd.service;

import com.example.swd.dto.request.RegistrationCommands;

public interface PatientRegistrationService {
    record OtpView(String message, String username, String email, String otpExpiresAt, String resendAvailableAt) {}
    record VerifiedView(String message, String username, String email) {}

    OtpView register(RegistrationCommands.Register input);
    OtpView sendOtp(RegistrationCommands.SendOtp input);
    VerifiedView verifyOtp(RegistrationCommands.VerifyOtp input);
    boolean usernameAvailable(String username);
}
