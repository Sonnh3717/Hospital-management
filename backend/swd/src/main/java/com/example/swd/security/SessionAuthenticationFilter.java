package com.example.swd.security;

import com.example.swd.exception.WorkflowException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class SessionAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getMethod().equals("OPTIONS") || request.getRequestURI().equals("/api/auth/login")
                || request.getRequestURI().equals("/api/auth/register") || request.getRequestURI().equals("/api/auth/send-otp")
                || request.getRequestURI().equals("/api/auth/verify-otp") || request.getRequestURI().equals("/api/auth/check-username")
                || request.getRequestURI().equals("/api/health");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null) {
            if (!authorization.startsWith("Bearer ") || authorization.length() <= 7) {
                SecurityResponses.unauthorized(response);
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
