package com.example.swd.service;

import com.example.swd.dto.request.LoginRequest;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.identity.AuthSession;
import com.example.swd.entity.identity.Role;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.AuthSessionRepository;
import com.example.swd.repository.DoctorProfileRepository;
import com.example.swd.repository.HospitalStaffRepository;
import com.example.swd.repository.UserAccountRepository;
import com.example.swd.security.StaffPrincipal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserAccountRepository accounts;
    @Mock AuthSessionRepository sessions;
    @Mock HospitalStaffRepository staff;
    @Mock DoctorProfileRepository doctors;
    AuthService auth;
    UserAccount account;
    HospitalStaff employee;
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);

    @BeforeEach
    void setup() {
        auth = new AuthService(accounts, sessions, staff, doctors, encoder, 8);
        Role role = new Role(); role.setRoleCode(Role.RoleCode.RECEPTIONIST);
        account = new UserAccount(); account.setId(10L); account.setUsername("reception");
        account.setRole(role); account.setPasswordHash(encoder.encode("correct-password"));
        employee = new HospitalStaff(); employee.setId(20L); employee.setUserAccount(account); employee.setFullName("Tiếp nhận");
    }

    @Test
    void loginCreatesOpaqueSessionAndUsesDatabaseIdentity() {
        when(accounts.findForLogin("reception")).thenReturn(Optional.of(account));
        when(staff.findByUserAccount_Id(10L)).thenReturn(Optional.of(employee));
        var result = auth.login(new LoginRequest(" reception ", "correct-password"));
        assertEquals(result.token(), UUID.fromString(result.token()).toString());
        assertEquals(20L, result.user().staffId());
        assertEquals("RECEPTIONIST", result.user().role());
        ArgumentCaptor<AuthSession> stored = ArgumentCaptor.forClass(AuthSession.class);
        verify(sessions).saveAndFlush(stored.capture());
        assertSame(account, stored.getValue().getUserAccount());
        assertTrue(stored.getValue().getExpiresAt().isAfter(LocalDateTime.now(ZoneOffset.UTC).plusHours(7)));
    }

    @Test
    void wrongPasswordDoesNotCreateSession() {
        when(accounts.findForLogin("reception")).thenReturn(Optional.of(account));
        var error = assertThrows(WorkflowException.class, () -> auth.login(new LoginRequest("reception", "wrong")));
        assertEquals(401, error.getStatus().value());
        verify(sessions, never()).saveAndFlush(any());
        verifyNoInteractions(staff);
    }

    @Test
    void revokedAndExpiredSessionsAreRejected() {
        AuthSession session = validSession();
        session.setRevokedAt(LocalDateTime.now(ZoneOffset.UTC));
        when(sessions.findForAuthentication(session.getId())).thenReturn(Optional.of(session));
        assertThrows(WorkflowException.class, () -> auth.authenticate(session.getId()));
        session.setRevokedAt(null); session.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1));
        assertThrows(WorkflowException.class, () -> auth.authenticate(session.getId()));
        verifyNoInteractions(staff);
    }

    @Test
    void activeSessionCannotBypassAccountOrEmploymentDeactivation() {
        AuthSession session = validSession();
        when(sessions.findForAuthentication(session.getId())).thenReturn(Optional.of(session));
        account.setStatus(ActiveStatus.INACTIVE);
        assertThrows(WorkflowException.class, () -> auth.authenticate(session.getId()));
        account.setStatus(ActiveStatus.ACTIVE);
        when(staff.findByUserAccount_Id(10L)).thenReturn(Optional.of(employee));
        employee.setEmploymentStatus(ActiveStatus.INACTIVE);
        assertThrows(WorkflowException.class, () -> auth.authenticate(session.getId()));
    }

    @Test
    void logoutRevokesOnlyActorsSession() {
        AuthSession session = validSession();
        when(sessions.lockById(session.getId())).thenReturn(Optional.of(session));
        var actor = new StaffPrincipal(10L, 20L, "reception", "Tiếp nhận", "RECEPTIONIST");
        auth.logout(session.getId(), actor);
        assertNotNull(session.getRevokedAt());
        assertEquals(AuthSession.RevocationReason.LOGOUT, session.getRevocationReason());
    }

    @Test
    void malformedSessionTokenNeverQueriesDatabase() {
        assertThrows(WorkflowException.class, () -> auth.authenticate("1-1-1-1-1"));
        verifyNoInteractions(sessions);
    }

    private AuthSession validSession() {
        AuthSession session = new AuthSession(); session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusHours(1)); return session;
    }
}
