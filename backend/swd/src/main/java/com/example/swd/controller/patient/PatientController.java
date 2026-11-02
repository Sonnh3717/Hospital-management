package com.example.swd.controller.patient;

import com.example.swd.dto.request.RegistrationCommands;
import com.example.swd.service.PatientRegistrationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientController {
    private final PatientRegistrationService registration;

    public PatientController(PatientRegistrationService registration) {
        this.registration = registration;
    }

    @PostMapping("/register")
    PatientRegistrationService.OtpView register(@Valid @RequestBody RegistrationCommands.Register input) {
        return registration.register(input);
    }

    @PostMapping("/send-otp")
    PatientRegistrationService.OtpView sendOtp(@Valid @RequestBody RegistrationCommands.SendOtp input) {
        return registration.sendOtp(input);
    }

    @PostMapping("/verify-otp")
    PatientRegistrationService.VerifiedView verifyOtp(@Valid @RequestBody RegistrationCommands.VerifyOtp input) {
        return registration.verifyOtp(input);
    }

    @GetMapping("/check-username")
    boolean checkUsername(@RequestParam(required = false) String username) {
        return registration.usernameAvailable(username);
    }
}
