package com.example.swd.challenger;

import com.example.swd.dto.request.RegistrationCommands;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Gender;
import com.example.swd.entity.identity.RegistrationVerification;
import com.example.swd.entity.identity.Role;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.exception.WorkflowException;
import com.example.swd.config.RegistrationEmailService;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.RegistrationVerificationRepository;
import com.example.swd.repository.RoleRepository;
import com.example.swd.repository.UserAccountRepository;
import com.example.swd.service.PatientRegistrationService;
import com.example.swd.service.impl.PatientRegistrationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Challenger M1-1: Patient Registration Profile Completion Edge Cases")
class ChallengerPatientRegistrationServiceTest {

    @Mock UserAccountRepository accounts;
    @Mock PatientRepository patients;
    @Mock RoleRepository roles;
    @Mock RegistrationVerificationRepository verifications;
    @Mock RegistrationEmailService email;

    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    Clock clock = Clock.fixed(Instant.parse("2026-11-02T12:00:00Z"), ZoneOffset.UTC);
    LocalDateTime now = LocalDateTime.parse("2026-11-02T12:00:00");

    PatientRegistrationService service;
    UserAccount account;
    RegistrationVerification verification;
    Role patientRole;

    @BeforeEach
    void setUp() {
        service = new PatientRegistrationServiceImpl(accounts, patients, roles, verifications, encoder, email, clock);

        patientRole = new Role();
        patientRole.setId((short) 1);
        patientRole.setRoleCode(Role.RoleCode.PATIENT);

        account = new UserAccount();
        account.setId(77L);
        account.setUsername("challenger.patient");
        account.setLoginEmail("challenger@hospital.vn");
        account.setRole(patientRole);
        account.setStatus(ActiveStatus.INACTIVE);

        verification = new RegistrationVerification();
        verification.setId(77L);
        verification.setUserAccount(account);
        verification.setOtpHash(encoder.encode("654321"));
        verification.setExpiresAt(now.plusMinutes(5));
        verification.setLastSentAt(now);
        verification.setTermsAcceptedAt(now);
    }

    @Test
    @DisplayName("Challenge 1: Submitting completeProfile with unverified OTP (verifiedAt == null) MUST fail with OTP_NOT_VERIFIED")
    void submittingWithoutVerifiedOtpFails() {
        verification.setVerifiedAt(null); // Unverified!
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));
        when(verifications.lockByAccountId(77L)).thenReturn(Optional.of(verification));

        var input = new RegistrationCommands.CompleteProfile(
                "challenger@hospital.vn",
                "Lê Văn Thử Thách",
                LocalDate.of(1996, 6, 15),
                Gender.MALE,
                "0912345678",
                "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
                null,
                null
        );

        WorkflowException ex = assertThrows(WorkflowException.class, () -> service.completeProfile(input));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("OTP_NOT_VERIFIED", ex.getCode());
        assertTrue(ex.getMessage().contains("chưa được xác thực OTP"));

        // Verify no patient record was saved or flushed
        verify(patients, never()).saveAndFlush(any());
        verify(accounts, never()).saveAndFlush(any());
        assertEquals(ActiveStatus.INACTIVE, account.getStatus());
    }

    @Test
    @DisplayName("Challenge 2: Submitting completeProfile for unrecorded email MUST fail with REGISTRATION_NOT_PENDING")
    void submittingForUnknownEmailFails() {
        when(accounts.lockByLoginEmail("unknown@hospital.vn")).thenReturn(Optional.empty());

        var input = new RegistrationCommands.CompleteProfile(
                "unknown@hospital.vn",
                "Người Lạ",
                LocalDate.of(1990, 1, 1),
                Gender.MALE,
                "0909090909",
                "Hà Nội",
                null,
                null
        );

        WorkflowException ex = assertThrows(WorkflowException.class, () -> service.completeProfile(input));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("REGISTRATION_NOT_PENDING", ex.getCode());
        verifyNoInteractions(patients);
    }

    @Test
    @DisplayName("Challenge 3: Submitting completeProfile when verification record missing MUST fail with REGISTRATION_NOT_PENDING")
    void submittingWhenVerificationMissingFails() {
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));
        when(verifications.lockByAccountId(77L)).thenReturn(Optional.empty());

        var input = new RegistrationCommands.CompleteProfile(
                "challenger@hospital.vn",
                "Lê Văn Thử Thách",
                LocalDate.of(1996, 6, 15),
                Gender.MALE,
                "0912345678",
                "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
                null,
                null
        );

        WorkflowException ex = assertThrows(WorkflowException.class, () -> service.completeProfile(input));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("REGISTRATION_NOT_PENDING", ex.getCode());
        verifyNoInteractions(patients);
    }

    @Test
    @DisplayName("Challenge 4: Submitting completeProfile without optional emergency contacts MUST succeed")
    void submittingWithoutOptionalEmergencyContactsSucceeds() {
        verification.setVerifiedAt(now.minusMinutes(1));
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));
        when(verifications.lockByAccountId(77L)).thenReturn(Optional.of(verification));

        Patient existingPatient = new Patient();
        existingPatient.setId(101L);
        existingPatient.setPatientCode("PT-EXISTING-CODE-0001");
        existingPatient.setUserAccount(account);
        when(patients.findByUserAccount_Id(77L)).thenReturn(Optional.of(existingPatient));

        var input = new RegistrationCommands.CompleteProfile(
                "challenger@hospital.vn",
                "Lê Văn Thử Thách",
                LocalDate.of(1996, 6, 15),
                Gender.MALE,
                "0912345678",
                "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
                null,
                null
        );

        var result = service.completeProfile(input);

        assertNotNull(result);
        assertEquals(101L, result.patientId());
        assertEquals("PT-EXISTING-CODE-0001", result.patientCode());
        assertEquals("Lê Văn Thử Thách", result.fullName());

        // Account status activated
        assertEquals(ActiveStatus.ACTIVE, account.getStatus());

        // Entity fields populated
        assertEquals("0912345678", existingPatient.getPhone());
        assertEquals("Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội", existingPatient.getAddress());
        assertEquals("challenger@hospital.vn", existingPatient.getContactEmail());
        assertNull(existingPatient.getEmergencyContactName());
        assertNull(existingPatient.getEmergencyContactPhone());

        verify(accounts).saveAndFlush(account);
        verify(patients).saveAndFlush(existingPatient);
    }

    @Test
    @DisplayName("Challenge 5: Submitting completeProfile with blank whitespace emergency contacts MUST normalize to null")
    void blankEmergencyContactsNormalizeToNull() {
        verification.setVerifiedAt(now.minusMinutes(1));
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));
        when(verifications.lockByAccountId(77L)).thenReturn(Optional.of(verification));

        Patient existingPatient = new Patient();
        existingPatient.setId(102L);
        existingPatient.setPatientCode("PT-EXISTING-CODE-0002");
        existingPatient.setUserAccount(account);
        when(patients.findByUserAccount_Id(77L)).thenReturn(Optional.of(existingPatient));

        var input = new RegistrationCommands.CompleteProfile(
                "challenger@hospital.vn",
                "  Trần Thị Trắng  ",
                LocalDate.of(2001, 12, 1),
                Gender.FEMALE,
                "  0987654321  ",
                "  Đường Láng, Đống Đa, Hà Nội  ",
                "    ",
                "    "
        );

        var result = service.completeProfile(input);

        assertNotNull(result);
        assertEquals("Trần Thị Trắng", result.fullName());
        assertEquals("Trần Thị Trắng", existingPatient.getFullName());
        assertEquals("0987654321", existingPatient.getPhone());
        assertEquals("Đường Láng, Đống Đa, Hà Nội", existingPatient.getAddress());
        assertNull(existingPatient.getEmergencyContactName(), "Blank emergency name must be normalized to null");
        assertNull(existingPatient.getEmergencyContactPhone(), "Blank emergency phone must be normalized to null");
    }

    @Test
    @DisplayName("Challenge 6: completeProfile generates PT-... code if patient entity was missing")
    void missingPatientCreatedWithGeneratedPtCode() {
        verification.setVerifiedAt(now.minusMinutes(1));
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));
        when(verifications.lockByAccountId(77L)).thenReturn(Optional.of(verification));
        when(patients.findByUserAccount_Id(77L)).thenReturn(Optional.empty());

        var input = new RegistrationCommands.CompleteProfile(
                "challenger@hospital.vn",
                "Phạm Đức Mới",
                LocalDate.of(1999, 9, 9),
                Gender.OTHER,
                "0933112233",
                "Hồ Chí Minh",
                "Phạm Phụ Huynh",
                "0944112233"
        );

        var result = service.completeProfile(input);

        assertNotNull(result);
        assertEquals("Phạm Đức Mới", result.fullName());
        assertTrue(result.patientCode().startsWith("PT-"));
        assertEquals(27, result.patientCode().length()); // "PT-" + 24 chars

        ArgumentCaptor<Patient> captor = ArgumentCaptor.forClass(Patient.class);
        verify(patients).saveAndFlush(captor.capture());
        Patient created = captor.getValue();
        assertEquals(account, created.getUserAccount());
        assertEquals("Phạm Đức Mới", created.getFullName());
        assertEquals("Phạm Phụ Huynh", created.getEmergencyContactName());
        assertEquals("0944112233", created.getEmergencyContactPhone());
    }

    @Test
    @DisplayName("Challenge 7: Email normalization is case-insensitive during completeProfile")
    void emailNormalizationCaseInsensitive() {
        verification.setVerifiedAt(now.minusMinutes(1));
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));
        when(verifications.lockByAccountId(77L)).thenReturn(Optional.of(verification));

        Patient p = new Patient();
        p.setId(105L);
        p.setPatientCode("PT-TEST-005");
        when(patients.findByUserAccount_Id(77L)).thenReturn(Optional.of(p));

        var input = new RegistrationCommands.CompleteProfile(
                "  CHALLENGER@HOSPITAL.VN  ",
                "Nguyễn Thường",
                LocalDate.of(1995, 3, 20),
                Gender.MALE,
                "0905123456",
                "Đà Nẵng",
                null,
                null
        );

        var result = service.completeProfile(input);
        assertNotNull(result);
        assertEquals("challenger@hospital.vn", p.getContactEmail());
    }

    @Test
    @DisplayName("Challenge 8: completeProfile rejects overwrite when profile already completed (status ACTIVE and DOB not null)")
    void completeProfile_alreadyCompleted_throwsConflict() {
        account.setStatus(ActiveStatus.ACTIVE);
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));

        Patient existingPatient = new Patient();
        existingPatient.setId(101L);
        existingPatient.setPatientCode("PT-EXISTING-CODE-0001");
        existingPatient.setUserAccount(account);
        existingPatient.setDateOfBirth(LocalDate.of(1990, 5, 10));
        when(patients.findByUserAccount_Id(77L)).thenReturn(Optional.of(existingPatient));

        var input = new RegistrationCommands.CompleteProfile(
                "challenger@hospital.vn",
                "Kẻ Tấn Công",
                LocalDate.of(2000, 1, 1),
                Gender.MALE,
                "0909999999",
                "Hà Nội",
                null,
                null
        );

        WorkflowException ex = assertThrows(WorkflowException.class, () -> service.completeProfile(input));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("PROFILE_ALREADY_COMPLETED", ex.getCode());
        verify(patients, never()).saveAndFlush(any());
        verify(verifications, never()).delete(any());
    }

    @Test
    @DisplayName("Challenge 9: Single-use OTP verification token is strictly deleted upon successful profile completion")
    void completeProfile_deletesSingleUseVerificationUponSuccess() {
        verification.setVerifiedAt(now.minusMinutes(1));
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));
        when(verifications.lockByAccountId(77L)).thenReturn(Optional.of(verification));

        Patient existingPatient = new Patient();
        existingPatient.setId(101L);
        existingPatient.setPatientCode("PT-EXISTING-CODE-0001");
        existingPatient.setUserAccount(account);
        when(patients.findByUserAccount_Id(77L)).thenReturn(Optional.of(existingPatient));

        var input = new RegistrationCommands.CompleteProfile(
                "challenger@hospital.vn",
                "Nguyễn Văn An",
                LocalDate.of(1995, 5, 20),
                Gender.MALE,
                "0901234567",
                "123 Giải Phóng, Hà Nội",
                "Nguyễn Thị Bình",
                "0909888777"
        );

        var result = service.completeProfile(input);
        assertNotNull(result);
        assertEquals("Nguyễn Văn An", result.fullName());

        // CRITICAL: verify verification entity was deleted
        verify(verifications).delete(verification);
        verify(accounts).saveAndFlush(account);
        verify(patients).saveAndFlush(existingPatient);
    }

    @Test
    @DisplayName("Challenge 10: Replay after deletion fails because verification record no longer exists")
    void completeProfile_replayFailsBecauseVerificationDeleted() {
        account.setStatus(ActiveStatus.ACTIVE);
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));
        // Simulate patient DOB was NOT set yet (e.g. edge case), but verification was already deleted
        when(patients.findByUserAccount_Id(77L)).thenReturn(Optional.empty());
        when(verifications.lockByAccountId(77L)).thenReturn(Optional.empty());

        var input = new RegistrationCommands.CompleteProfile(
                "challenger@hospital.vn",
                "Kẻ Tấn Công Replay",
                LocalDate.of(1998, 1, 1),
                Gender.MALE,
                "0911223344",
                "Hà Nội",
                null,
                null
        );

        WorkflowException ex = assertThrows(WorkflowException.class, () -> service.completeProfile(input));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("REGISTRATION_NOT_PENDING", ex.getCode());
        verify(patients, never()).saveAndFlush(any());
        verify(verifications, never()).delete(any());
    }
}
