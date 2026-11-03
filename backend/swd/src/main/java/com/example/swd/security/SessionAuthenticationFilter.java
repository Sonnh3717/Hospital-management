package com.example.swd.security;

import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.identity.AuthSession;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.repository.AuthSessionRepository;
import com.example.swd.repository.HospitalStaffRepository;
import com.example.swd.repository.PatientRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
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
    private final HospitalStaffRepository hospitalStaffRepository;
    private final PatientRepository patientRepository;
    private final SecurityContextRepository securityContextRepository = new RequestAttributeSecurityContextRepository();

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
                if (session.getRevokedAt() == null
                        && session.getExpiresAt().isAfter(LocalDateTime.now())
                        && session.getUserAccount() != null
                        && session.getUserAccount().getStatus() == ActiveStatus.ACTIVE) {
                    UserAccount account = session.getUserAccount();
                    String roleName = "ROLE_" + account.getRole().getRoleCode().name();
                    Long staffId = null;
                    Long patientId = null;
                    String fullName = account.getUsername();

                    var staffOpt = hospitalStaffRepository.findByUserAccount_Id(account.getId());
                    if (staffOpt.isPresent()) {
                        staffId = staffOpt.get().getId();
                        if (staffOpt.get().getFullName() != null && !staffOpt.get().getFullName().isBlank()) {
                            fullName = staffOpt.get().getFullName();
                        }
                    } else {
                        var patientOpt = patientRepository.findByUserAccount_Id(account.getId());
                        if (patientOpt.isPresent()) {
                            patientId = patientOpt.get().getId();
                            if (patientOpt.get().getFullName() != null && !patientOpt.get().getFullName().isBlank()) {
                                fullName = patientOpt.get().getFullName();
                            }
                        }
                    }

                    StaffPrincipal principal = new StaffPrincipal(
                            account.getId(),
                            staffId,
                            account.getUsername(),
                            fullName,
                            account.getRole().getRoleCode().name(),
                            patientId);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            principal,
                            sessionId,
                            Collections.singletonList(new SimpleGrantedAuthority(roleName)));
                    SecurityContext context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(authToken);
                    SecurityContextHolder.setContext(context);
                    securityContextRepository.saveContext(context, request, response);
                }
            }
        }
        chain.doFilter(request, response);
    }
}
