package com.example.swd.service;

import com.example.swd.dto.request.RegistrationCommands;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.identity.RegistrationVerification;
import com.example.swd.entity.identity.Role;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.RegistrationVerificationRepository;
import com.example.swd.repository.RoleRepository;
import com.example.swd.repository.UserAccountRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientRegistrationServiceTest {
    @Mock UserAccountRepository accounts;
    @Mock PatientRepository patients;
    @Mock RoleRepository roles;
    @Mock RegistrationVerificationRepository verifications;
    @Mock RegistrationEmailService email;
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    Clock clock = Clock.fixed(Instant.parse("2026-10-13T02:00:00Z"), ZoneOffset.UTC);
    PatientRegistrationService registration;
    UserAccount account;
    RegistrationVerification verification;
    Role role;
    LocalDateTime now = LocalDateTime.parse("2026-10-13T02:00:00");

    @BeforeEach void setup() {
        registration = new PatientRegistrationService(accounts, patients, roles, verifications, encoder, email, clock);
        role = new Role(); role.setId((short) 6); role.setRoleCode(Role.RoleCode.PATIENT);
        account = new UserAccount(); account.setId(10L); account.setRole(role); account.setStatus(ActiveStatus.INACTIVE);
        account.setUsername("patient.demo"); account.setLoginEmail("patient@example.test");
        verification = new RegistrationVerification(); verification.setId(10L); verification.setUserAccount(account);
        verification.setOtpHash(encoder.encode("123456")); verification.setExpiresAt(now.plusMinutes(5));
        verification.setLastSentAt(now); verification.setTermsAcceptedAt(now);
    }

    @Test void registrationCreatesOnlyInactivePatientAndSendsHashedSixDigitOtp() {
        when(roles.findByRoleCode(Role.RoleCode.PATIENT)).thenReturn(Optional.of(role));
        when(accounts.saveAndFlush(any())).thenAnswer(invocation -> { UserAccount a = invocation.getArgument(0); a.setId(20L); return a; });
        var reply = registration.register(input());
        ArgumentCaptor<UserAccount> accountCaptor = ArgumentCaptor.forClass(UserAccount.class);
        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        ArgumentCaptor<RegistrationVerification> verificationCaptor = ArgumentCaptor.forClass(RegistrationVerification.class);
        ArgumentCaptor<String> otp = ArgumentCaptor.forClass(String.class);
        verify(accounts).saveAndFlush(accountCaptor.capture()); verify(patients).saveAndFlush(patientCaptor.capture());
        verify(verifications).saveAndFlush(verificationCaptor.capture()); verify(email).sendOtp(eq("patient@example.test"), otp.capture());
        assertEquals(ActiveStatus.INACTIVE, accountCaptor.getValue().getStatus());
        assertEquals(Role.RoleCode.PATIENT, accountCaptor.getValue().getRole().getRoleCode());
        assertTrue(encoder.matches("Password123!", accountCaptor.getValue().getPasswordHash()));
        assertSame(accountCaptor.getValue(), patientCaptor.getValue().getUserAccount());
        assertEquals("Người bệnh Demo", patientCaptor.getValue().getFullName());
        assertTrue(otp.getValue().matches("[0-9]{6}"));
        assertNotEquals(otp.getValue(), verificationCaptor.getValue().getOtpHash());
        assertTrue(encoder.matches(otp.getValue(), verificationCaptor.getValue().getOtpHash()));
        assertEquals("2026-10-13T02:05:00Z", reply.otpExpiresAt()); assertEquals("2026-10-13T02:01:00Z", reply.resendAvailableAt());
    }

    @Test void passwordByteLimitAndConfirmationAndConsentFailBeforeAnyMailOrInsert() {
        var invalid = new RegistrationCommands.Register("patient.demo", "Người bệnh Demo", "patient@example.test", "đ".repeat(40), "different", false);
        WorkflowException error = assertThrows(WorkflowException.class, () -> registration.register(invalid));
        assertTrue(error.getFieldErrors().keySet().containsAll(java.util.Set.of("password", "confirmPassword", "agreeTerms")));
        verifyNoInteractions(accounts, patients, verifications, email);
    }

    @Test void existingEmailCannotBeRegisteredAgainOrHaveItsPasswordChanged() {
        when(accounts.findByLoginEmail("patient@example.test")).thenReturn(Optional.of(account));
        assertEquals("EMAIL_IN_USE", assertThrows(WorkflowException.class, () -> registration.register(input())).getCode());
        verify(accounts, never()).saveAndFlush(any()); verifyNoInteractions(email, patients, verifications);
    }

    @Test void missingSmtpFailsBeforeRecordsAreInserted() {
        doThrow(new WorkflowException(HttpStatus.SERVICE_UNAVAILABLE, "SMTP_UNAVAILABLE", "Không gửi được email")).when(email).requireConfigured();
        assertEquals(503, assertThrows(WorkflowException.class, () -> registration.register(input())).getStatus().value());
        verify(accounts, never()).saveAndFlush(any()); verifyNoInteractions(patients, verifications);
    }

    @Test void successfulVerificationActivatesPatientAndRetriesAreIdempotent() {
        pending();
        assertEquals("patient.demo", registration.verifyOtp(new RegistrationCommands.VerifyOtp("PATIENT@example.test", "123456")).username());
        assertEquals(ActiveStatus.ACTIVE, account.getStatus()); assertEquals(now, verification.getVerifiedAt());
        assertEquals("patient.demo", registration.verifyOtp(new RegistrationCommands.VerifyOtp("patient@example.test", "123456")).username());
        verifyNoInteractions(email);
    }

    @Test void consumedDifferentOtpCannotActivateAgain() {
        pending(); account.setStatus(ActiveStatus.ACTIVE); verification.setVerifiedAt(now);
        assertEquals("REGISTRATION_NOT_PENDING", assertThrows(WorkflowException.class,
                () -> registration.verifyOtp(new RegistrationCommands.VerifyOtp("patient@example.test", "654321"))).getCode());
    }

    @Test void deactivatedVerifiedAccountCannotBeReactivatedByOldOtp() {
        pending(); verification.setVerifiedAt(now.minusMinutes(1));
        assertEquals("REGISTRATION_NOT_PENDING", assertThrows(WorkflowException.class,
                () -> registration.verifyOtp(new RegistrationCommands.VerifyOtp("patient@example.test", "123456"))).getCode());
        assertEquals(ActiveStatus.INACTIVE, account.getStatus());
    }

    @Test void arbitraryDisabledAccountWithoutRegistrationRecordCannotGetOtp() {
        when(accounts.lockByLoginEmail(account.getLoginEmail())).thenReturn(Optional.of(account));
        assertEquals("REGISTRATION_NOT_PENDING", assertThrows(WorkflowException.class,
                () -> registration.sendOtp(new RegistrationCommands.SendOtp(account.getLoginEmail()))).getCode());
        verifyNoInteractions(email);
    }

    @Test void staffCannotBeActivatedEvenIfRegistrationMetadataExists() {
        pending(); role.setRoleCode(Role.RoleCode.DOCTOR);
        assertEquals("REGISTRATION_NOT_PENDING", assertThrows(WorkflowException.class,
                () -> registration.verifyOtp(new RegistrationCommands.VerifyOtp(account.getLoginEmail(), "123456"))).getCode());
        assertEquals(ActiveStatus.INACTIVE, account.getStatus());
    }

    @Test void expiredOtpCannotActivatePatient() {
        pending(); verification.setExpiresAt(now);
        assertEquals("OTP_EXPIRED", assertThrows(WorkflowException.class,
                () -> registration.verifyOtp(new RegistrationCommands.VerifyOtp(account.getLoginEmail(), "123456"))).getCode());
        assertEquals(ActiveStatus.INACTIVE, account.getStatus());
    }

    @Test void fiveWrongAttemptsBlockEvenCorrectOtpUntilResend() {
        pending();
        for (int attempt = 1; attempt <= 5; attempt++) {
            WorkflowException error = assertThrows(WorkflowException.class,
                    () -> registration.verifyOtp(new RegistrationCommands.VerifyOtp(account.getLoginEmail(), "654321")));
            assertEquals(attempt < 5 ? "INVALID_OTP" : "OTP_ATTEMPTS_EXCEEDED", error.getCode());
            assertEquals(attempt, verification.getFailedAttempts());
        }
        assertEquals("OTP_ATTEMPTS_EXCEEDED", assertThrows(WorkflowException.class,
                () -> registration.verifyOtp(new RegistrationCommands.VerifyOtp(account.getLoginEmail(), "123456"))).getCode());
        assertNull(verification.getVerifiedAt());
    }

    @Test void resendEnforcesCooldownAndRefreshesExpiryAndAttempts() {
        pending();
        assertEquals("OTP_RESEND_TOO_SOON", assertThrows(WorkflowException.class,
                () -> registration.sendOtp(new RegistrationCommands.SendOtp(account.getLoginEmail()))).getCode());
        verifyNoInteractions(email);
        verification.setLastSentAt(now.minusSeconds(60)); verification.setFailedAttempts(5);
        registration.sendOtp(new RegistrationCommands.SendOtp(account.getLoginEmail()));
        assertEquals(0, verification.getFailedAttempts()); assertEquals(now.plusMinutes(5), verification.getExpiresAt());
        verify(email).sendOtp(eq(account.getLoginEmail()), matches("[0-9]{6}"));
    }

    @Test void resendCannotBypassCooldownDuringFinalFractionOfSecond() {
        pending(); verification.setLastSentAt(now.minusSeconds(60).plusNanos(1));
        var error = assertThrows(WorkflowException.class,
                () -> registration.sendOtp(new RegistrationCommands.SendOtp(account.getLoginEmail())));
        assertEquals("OTP_RESEND_TOO_SOON", error.getCode()); assertTrue(error.getMessage().contains("1 giây"));
        verifyNoInteractions(email);
    }

    @Test void availabilityRejectsInvalidNamesAndReturnsBooleanForExistingName() {
        assertEquals("VALIDATION_ERROR", assertThrows(WorkflowException.class, () -> registration.usernameAvailable("x")).getCode());
        when(accounts.findByUsername("patient.demo")).thenReturn(Optional.of(account));
        assertFalse(registration.usernameAvailable("patient.demo")); assertTrue(registration.usernameAvailable("patient.new"));
    }

    @Test void dtoStringRepresentationsNeverContainPasswordOrOtp() {
        assertFalse(input().toString().contains("Password123!"));
        assertFalse(new RegistrationCommands.VerifyOtp("patient@example.test", "123456").toString().contains("123456"));
        assertFalse(new com.example.swd.dto.request.LoginRequest("patient.demo", "Password123!").toString().contains("Password123!"));
    }

    @Test void malformedOtpReturnsSafeFieldErrorWithoutDatabaseLookupOrValueLeak() {
        var error = assertThrows(WorkflowException.class,
                () -> registration.verifyOtp(new RegistrationCommands.VerifyOtp("patient@example.test", "1234567")));
        assertEquals("INVALID_OTP", error.getCode()); assertTrue(error.getFieldErrors().containsKey("otp"));
        assertFalse(error.getMessage().contains("1234567")); verifyNoInteractions(accounts, verifications);
    }

    @Test void nullPasswordAndOtpReturnFieldErrorsWithoutPersistence() {
        var error = assertThrows(WorkflowException.class, () -> registration.register(
                new RegistrationCommands.Register("patient.demo", "Demo", "patient@example.test", null, null, true)));
        assertTrue(error.getFieldErrors().containsKey("password"));
        assertEquals("INVALID_OTP", assertThrows(WorkflowException.class,
                () -> registration.verifyOtp(new RegistrationCommands.VerifyOtp("patient@example.test", null))).getCode());
        verifyNoInteractions(accounts, patients, verifications, email);
    }

    private RegistrationCommands.Register input() {
        return new RegistrationCommands.Register("patient.demo", "Người bệnh Demo", "PATIENT@example.test", "Password123!", "Password123!", true);
    }
    private void pending() {
        when(accounts.lockByLoginEmail(account.getLoginEmail())).thenReturn(Optional.of(account));
        when(verifications.lockByAccountId(10L)).thenReturn(Optional.of(verification));
    }
}
