package com.example.swd.service.impl;

import com.example.swd.dto.response.HealthResponse;
import org.springframework.stereotype.Service;

@Service
public class SystemStatusServiceImpl implements com.example.swd.service.SystemStatusService {
    public HealthResponse getStatus() {
        return new HealthResponse("UP");
    }
}

