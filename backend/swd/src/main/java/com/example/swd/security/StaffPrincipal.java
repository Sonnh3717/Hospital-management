package com.example.swd.security;

public record StaffPrincipal(Long accountId, Long staffId, String username, String fullName, String role) {
}
