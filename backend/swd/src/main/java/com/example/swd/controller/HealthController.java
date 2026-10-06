package com.example.swd.controller;

import com.example.swd.dto.response.HealthResponse;
import com.example.swd.service.SystemStatusService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {
    private final SystemStatusService systemStatusService;

    public HealthController(SystemStatusService systemStatusService) {
        this.systemStatusService = systemStatusService;
    }

    @GetMapping
    public HealthResponse health() {
        return systemStatusService.getStatus();
    }
}

