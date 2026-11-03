package com.example.swd.controller.patient;
import com.example.swd.controller.auth.AuthController;
import com.example.swd.repository.AuthSessionRepository;

import com.example.swd.config.WebConfig;
import com.example.swd.dto.request.RegistrationCommands;
import com.example.swd.security.SecurityConfig;
import com.example.swd.service.AuthService;
import com.example.swd.service.PatientRegistrationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({PatientController.class, AuthController.class})
@Import({SecurityConfig.class, WebConfig.class})
class PatientControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean AuthService auth;
    @MockitoBean AuthSessionRepository sessions;
    @MockitoBean com.example.swd.repository.HospitalStaffRepository staffRepository;
    @MockitoBean com.example.swd.repository.PatientRepository patientRepository;
    @MockitoBean PatientRegistrationService registration;

    @Test void publicAvailabilityIgnoresStaleBearerToken() throws Exception {
        when(registration.usernameAvailable("patient.demo")).thenReturn(true);
        mvc.perform(get("/api/patients/check-username").param("username", "patient.demo").header("Authorization", "Bearer stale-token"))
                .andExpect(status().isOk()).andExpect(content().string("true"));
        verifyNoInteractions(auth);
    }
    @Test void publicRegistrationAcceptsNoRoleChoiceAndIgnoresStaleToken() throws Exception {
        when(registration.register(any())).thenReturn(new PatientRegistrationService.OtpView("Đã gửi OTP", "patient.demo", "patient@example.test", "2026-10-13T02:05:00Z", "2026-10-13T02:01:00Z"));
        mvc.perform(post("/api/patients/register").header("Authorization", "Bearer stale-token").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"patient.demo","fullName":"Người bệnh Demo","email":"patient@example.test","password":"Password123!","confirmPassword":"Password123!","agreeTerms":true,"role":"ADMIN"}
                                """))
                .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("patient.demo"))
                .andExpect(jsonPath("$.otp").doesNotExist()).andExpect(jsonPath("$.password").doesNotExist());
        verifyNoInteractions(auth);
    }
    @Test void missingConsentAndMissingOtpReturnFieldErrorsBeforeCallingService() throws Exception {
        mvc.perform(post("/api/patients/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"patient.demo","fullName":"Demo","email":"patient@example.test","password":"Password123!","confirmPassword":"Password123!","agreeTerms":false}
                                """))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.agreeTerms").exists());
        mvc.perform(post("/api/patients/verify-otp").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"patient@example.test\",\"otp\":\"\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.otp").exists());
        verifyNoInteractions(registration);
    }
    @Test void identityEndpointRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
}
