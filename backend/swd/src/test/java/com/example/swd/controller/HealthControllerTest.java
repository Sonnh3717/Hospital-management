package com.example.swd.controller;

import com.example.swd.config.WebConfig;
import com.example.swd.security.SecurityConfig;
import com.example.swd.service.SystemStatusService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HealthController.class)
@Import({SystemStatusService.class, SecurityConfig.class, WebConfig.class})
class HealthControllerTest {
    @Autowired
    private MockMvc mvc;

    @Test
    void healthIsPublicAndReturnsJson() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void otherEndpointsAreNotPublicByDefault() throws Exception {
        mvc.perform(get("/api/private"))
                .andExpect(status().isForbidden());
    }

    @Test
    void allowsConfiguredFrontendOrigin() throws Exception {
        mvc.perform(options("/api/health")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void rejectsUnconfiguredOrigin() throws Exception {
        mvc.perform(options("/api/health")
                        .header("Origin", "https://unconfigured.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}

