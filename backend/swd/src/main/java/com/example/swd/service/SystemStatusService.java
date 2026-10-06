package com.example.swd.service;

import com.example.swd.dto.response.HealthResponse;
import org.springframework.stereotype.Service;

@Service
public class SystemStatusService {
    public HealthResponse getStatus() {
        return new HealthResponse("UP");
    }
}

