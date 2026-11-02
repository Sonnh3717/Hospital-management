package com.example.swd.service;

import com.example.swd.dto.response.HealthResponse;

public interface SystemStatusService {
    HealthResponse getStatus();
}
