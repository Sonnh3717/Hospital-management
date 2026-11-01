package com.example.swd.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserInfoResponse {
    private Long id;
    private Long accountId;
    private String username;
    private String fullName;
    private String role;
    private Long staffId;
    private Long patientId;
}

