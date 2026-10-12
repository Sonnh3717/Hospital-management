package com.example.swd.controller;

import com.example.swd.config.WebConfig;
import com.example.swd.security.SecurityConfig;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, WebConfig.class})
class AuthenticationSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean AuthService auth;

    @Test void missingTokenCannotReadAccount() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test void meUsesValidatedPrincipalAndWrongRoleCannotReachReception() throws Exception {
        var actor = new StaffPrincipal(10L, 20L, "doctor", "Bác sĩ", "DOCTOR");
        when(auth.authenticate("valid-token")).thenReturn(actor);
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.staffId").value(20)).andExpect(jsonPath("$.role").value("DOCTOR"));
        mvc.perform(get("/api/reception/appointments").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test void logoutPassesOnlyAuthenticatedTokenAndIdentity() throws Exception {
        var actor = new StaffPrincipal(10L, 20L, "reception", "Tiếp nhận", "RECEPTIONIST");
        when(auth.authenticate("valid-token")).thenReturn(actor);
        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer valid-token")).andExpect(status().isNoContent());
        verify(auth).logout("valid-token", actor);
    }
}
