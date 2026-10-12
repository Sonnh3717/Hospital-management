package com.example.swd.security;

import com.example.swd.exception.WorkflowException;
import com.example.swd.service.AuthService;
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
    private final AuthService auth;
    public SessionAuthenticationFilter(AuthService auth) { this.auth = auth; }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getMethod().equals("OPTIONS") || request.getRequestURI().equals("/api/auth/login")
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
            try {
                StaffPrincipal principal = auth.authenticate(authorization.substring(7));
                var authentication = new UsernamePasswordAuthenticationToken(principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + principal.role())));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (WorkflowException ex) {
                SecurityContextHolder.clearContext();
                if (ex.getStatus().value() == 403) SecurityResponses.forbidden(response);
                else SecurityResponses.unauthorized(response);
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
