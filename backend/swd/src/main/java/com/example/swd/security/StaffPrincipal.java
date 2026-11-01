package com.example.swd.security;

public record StaffPrincipal(Long accountId, Long staffId, String username, String fullName, String role, Long patientId) {
    public StaffPrincipal(Long accountId, Long staffId, String username, String fullName, String role) {
        this(accountId, staffId, username, fullName, role, null);
    }
}
