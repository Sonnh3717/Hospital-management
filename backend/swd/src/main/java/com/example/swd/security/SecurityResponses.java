package com.example.swd.security;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

final class SecurityResponses {
    private SecurityResponses() {}
    static void unauthorized(HttpServletResponse response) throws IOException {
        write(response, 401, "UNAUTHENTICATED", "Vui lòng đăng nhập lại.");
    }
    static void forbidden(HttpServletResponse response) throws IOException {
        write(response, 403, "FORBIDDEN", "Bạn không có quyền truy cập chức năng này.");
    }
    private static void write(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"code\":\"" + code + "\",\"message\":\"" + message + "\",\"fieldErrors\":{},\"blockers\":[]}");
    }
}
