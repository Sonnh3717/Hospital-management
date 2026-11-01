package com.example.swd.controller;

import com.example.swd.config.WebConfig;
import com.example.swd.dto.request.RegistrationCommands;
import com.example.swd.security.SecurityConfig;
import com.example.swd.security.StaffPrincipal;
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

@WebMvcTest({PatientRegistrationController.class, AuthController.class})
@Import({SecurityConfig.class, WebConfig.class})
class PatientRegistrationControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean AuthService auth;
    @MockitoBean PatientRegistrationService registration;

    @Test void publicAvailabilityIgnoresStaleBearerToken() throws Exception {
        when(registration.usernameAvailable("patient.demo")).thenReturn(true);
        mvc.perform(get("/api/auth/check-username").param("username", "patient.demo").header("Authorization", "Bearer stale-token"))
                .andExpect(status().isOk()).andExpect(content().string("true"));
        verifyNoInteractions(auth);
    }
    @Test void publicRegistrationAcceptsNoRoleChoiceAndIgnoresStaleToken() throws Exception {
        when(registration.register(any())).thenReturn(new PatientRegistrationService.OtpView("Đã gửi OTP", "patient.demo", "patient@example.test", "2026-10-13T02:05:00Z", "2026-10-13T02:01:00Z"));
        mvc.perform(post("/api/auth/register").header("Authorization", "Bearer stale-token").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"patient.demo","fullName":"Người bệnh Demo","email":"patient@example.test","password":"Password123!","confirmPassword":"Password123!","agreeTerms":true,"role":"ADMIN"}
                                """))
                .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("patient.demo"))
                .andExpect(jsonPath("$.otp").doesNotExist()).andExpect(jsonPath("$.password").doesNotExist());
        verifyNoInteractions(auth);
    }
    @Test void missingConsentAndMissingOtpReturnFieldErrorsBeforeCallingService() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"patient.demo","fullName":"Demo","email":"patient@example.test","password":"Password123!","confirmPassword":"Password123!","agreeTerms":false}
                                """))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.agreeTerms").exists());
        mvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"patient@example.test\",\"otp\":\"\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.otp").exists());
        verifyNoInteractions(registration);
    }
    @Test void patientIdentityCanReadMeButCannotReachAnyStaffWorkflow() throws Exception {
        when(auth.authenticate("valid-token")).thenReturn(new StaffPrincipal(10L, null, "patient.demo", "Người bệnh Demo", "PATIENT", 20L));
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.patientId").value(20)).andExpect(jsonPath("$.role").value("PATIENT"));
        for (String path : new String[]{"/api/reception/appointments", "/api/doctor/patients", "/api/services/queue"}) {
            mvc.perform(get(path).header("Authorization", "Bearer valid-token")).andExpect(status().isForbidden());
        }
    }
}
