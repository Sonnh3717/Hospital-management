package com.example.swd.security;

import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.identity.AuthSession;
import com.example.swd.entity.identity.Role;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.repository.AuthSessionRepository;
import com.example.swd.repository.HospitalStaffRepository;
import com.example.swd.repository.PatientRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test: SessionAuthenticationFilter")
class SessionAuthenticationFilterTest {

    @Mock private AuthSessionRepository authSessionRepository;
    @Mock private HospitalStaffRepository hospitalStaffRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private FilterChain filterChain;

    @InjectMocks
    private SessionAuthenticationFilter filter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("doFilter: Valid active receptionist session sets SecurityContext and persists request attribute")
    void doFilter_validActiveStaffSession_setsSecurityContextAndRequestAttribute() throws ServletException, IOException {
        String token = "valid-token-123";
        request.addHeader("Authorization", "Bearer " + token);
        request.setRequestURI("/api/reception/patients");

        UserAccount account = new UserAccount();
        account.setId(10L);
        account.setUsername("receptionist1");
        account.setStatus(ActiveStatus.ACTIVE);
        Role role = new Role();
        role.setRoleCode(Role.RoleCode.RECEPTIONIST);
        account.setRole(role);

        AuthSession session = new AuthSession();
        session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now().plusHours(2));

        HospitalStaff staff = new HospitalStaff();
        staff.setId(5L);
        staff.setFullName("Nguyen Van Le Tan");

        when(authSessionRepository.findForAuthentication(token)).thenReturn(Optional.of(session));
        when(hospitalStaffRepository.findByUserAccount_Id(10L)).thenReturn(Optional.of(staff));

        filter.doFilter(request, response, filterChain);

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isInstanceOf(StaffPrincipal.class);
        StaffPrincipal principal = (StaffPrincipal) authentication.getPrincipal();
        assertThat(principal.accountId()).isEqualTo(10L);
        assertThat(principal.staffId()).isEqualTo(5L);
        assertThat(principal.fullName()).isEqualTo("Nguyen Van Le Tan");
        assertThat(principal.role()).isEqualTo("RECEPTIONIST");
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_RECEPTIONIST");

        assertThat(request.getAttribute(RequestAttributeSecurityContextRepository.DEFAULT_REQUEST_ATTR_NAME))
                .isNotNull()
                .isEqualTo(SecurityContextHolder.getContext());

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilter: Deactivated user account (INACTIVE) does not authenticate")
    void doFilter_inactiveUserAccount_doesNotAuthenticate() throws ServletException, IOException {
        String token = "inactive-token-123";
        request.addHeader("Authorization", "Bearer " + token);
        request.setRequestURI("/api/reception/patients");

        UserAccount account = new UserAccount();
        account.setId(20L);
        account.setUsername("inactive.user");
        account.setStatus(ActiveStatus.INACTIVE);
        Role role = new Role();
        role.setRoleCode(Role.RoleCode.PATIENT);
        account.setRole(role);

        AuthSession session = new AuthSession();
        session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now().plusHours(2));

        when(authSessionRepository.findForAuthentication(token)).thenReturn(Optional.of(session));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(request.getAttribute(RequestAttributeSecurityContextRepository.DEFAULT_REQUEST_ATTR_NAME)).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilter: Expired session does not authenticate")
    void doFilter_expiredSession_doesNotAuthenticate() throws ServletException, IOException {
        String token = "expired-token";
        request.addHeader("Authorization", "Bearer " + token);

        UserAccount account = new UserAccount();
        account.setId(30L);
        account.setStatus(ActiveStatus.ACTIVE);
        AuthSession session = new AuthSession();
        session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(authSessionRepository.findForAuthentication(token)).thenReturn(Optional.of(session));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilter: Revoked session does not authenticate")
    void doFilter_revokedSession_doesNotAuthenticate() throws ServletException, IOException {
        String token = "revoked-token";
        request.addHeader("Authorization", "Bearer " + token);

        UserAccount account = new UserAccount();
        account.setId(40L);
        account.setStatus(ActiveStatus.ACTIVE);
        AuthSession session = new AuthSession();
        session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now().plusHours(1));
        session.setRevokedAt(LocalDateTime.now());

        when(authSessionRepository.findForAuthentication(token)).thenReturn(Optional.of(session));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilter: Missing or invalid Authorization header bypasses authentication")
    void doFilter_invalidAuthHeader_bypassesAuthentication() throws ServletException, IOException {
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(authSessionRepository);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("shouldNotFilter: Public routes and OPTIONS requests return true")
    void shouldNotFilter_publicRoutesAndOptions_returnsTrue() {
        MockHttpServletRequest loginReq = new MockHttpServletRequest("POST", "/api/auth/login");
        MockHttpServletRequest healthReq = new MockHttpServletRequest("GET", "/api/health");
        MockHttpServletRequest publicReq = new MockHttpServletRequest("GET", "/api/public/data");
        MockHttpServletRequest optionsReq = new MockHttpServletRequest("OPTIONS", "/api/reception/patients");
        MockHttpServletRequest protectedReq = new MockHttpServletRequest("GET", "/api/reception/patients");

        assertThat(filter.shouldNotFilter(loginReq)).isTrue();
        assertThat(filter.shouldNotFilter(healthReq)).isTrue();
        assertThat(filter.shouldNotFilter(publicReq)).isTrue();
        assertThat(filter.shouldNotFilter(optionsReq)).isTrue();
        assertThat(filter.shouldNotFilter(protectedReq)).isFalse();
    }
}
