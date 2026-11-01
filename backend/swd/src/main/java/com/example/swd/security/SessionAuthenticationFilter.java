package com.example.swd.security;

import com.example.swd.entity.identity.AuthSession;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.repository.AuthSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final AuthSessionRepository authSessionRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return request.getMethod().equalsIgnoreCase("OPTIONS")
                || path.equals("/api/auth/login")
                || path.equals("/api/health")
                || path.startsWith("/api/public/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ") && authorization.length() > 7) {
            String sessionId = authorization.substring(7).trim();
            Optional<AuthSession> sessionOpt = authSessionRepository.findForAuthentication(sessionId);
            if (sessionOpt.isPresent()) {
                AuthSession session = sessionOpt.get();
                if (session.getRevokedAt() == null && session.getExpiresAt().isAfter(LocalDateTime.now())) {
                    UserAccount account = session.getUserAccount();
                    String roleName = "ROLE_" + account.getRole().getRoleCode().name();
                    StaffPrincipal principal = new StaffPrincipal(
                            account.getId(),
                            null,
                            account.getUsername(),
                            account.getUsername(),
                            account.getRole().getRoleCode().name());
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            principal,
                            sessionId,
                            Collections.singletonList(new SimpleGrantedAuthority(roleName)));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }
        chain.doFilter(request, response);
    }
}
