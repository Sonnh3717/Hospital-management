package com.example.swd.challenger;

import com.example.swd.dto.request.ReceptionPatientRequests.CreatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdateStatusRequest;
import com.example.swd.dto.response.ReceptionPatientViews.PatientDetailView;
import com.example.swd.dto.response.ReceptionPatientViews.PatientListItemView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Gender;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.UserAccountRepository;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.ReceptionPatientService;
import com.example.swd.service.impl.ReceptionPatientServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Challenger M1-1: Reception Patient Service Edge Cases & Security Probing")
class ChallengerReceptionPatientServiceTest {

    @Mock PatientRepository patients;
    @Mock UserAccountRepository accounts;

    ReceptionPatientService service;
    StaffPrincipal receptionistActor;
    StaffPrincipal adminActor;
    StaffPrincipal doctorActor;
    StaffPrincipal patientActor;

    @BeforeEach
    void setUp() {
        service = new ReceptionPatientServiceImpl(patients, accounts);
        receptionistActor = new StaffPrincipal(10L, 1L, "receptionist.1", "Lễ Tân Một", "RECEPTIONIST", null);
        adminActor = new StaffPrincipal(20L, 2L, "admin.1", "Quản Trị Viên", "ADMIN", null);
        doctorActor = new StaffPrincipal(30L, 3L, "doctor.1", "Bác Sĩ Một", "DOCTOR", null);
        patientActor = new StaffPrincipal(40L, null, "patient.1", "Bệnh Nhân Một", "PATIENT", 99L);
    }

    @Test
    @DisplayName("Challenge 1: Non-receptionist roles calling any ReceptionPatientService method MUST fail with FORBIDDEN")
    void nonReceptionistRolesAreForbidden() {
        // Test null actor
        WorkflowException ex1 = assertThrows(WorkflowException.class, () -> service.list(null, null, 0, 10));
        assertEquals(HttpStatus.FORBIDDEN, ex1.getStatus());
        assertEquals("FORBIDDEN", ex1.getCode());

        // Test PATIENT role
        WorkflowException ex2 = assertThrows(WorkflowException.class, () -> service.detail(patientActor, 1L));
        assertEquals(HttpStatus.FORBIDDEN, ex2.getStatus());
        assertEquals("FORBIDDEN", ex2.getCode());

        // Test DOCTOR role
        CreatePatientRequest createReq = new CreatePatientRequest(
                "Test", LocalDate.of(1990, 1, 1), Gender.MALE, "0901112222", null, "HN", null, null
        );
        WorkflowException ex3 = assertThrows(WorkflowException.class, () -> service.create(doctorActor, createReq));
        assertEquals(HttpStatus.FORBIDDEN, ex3.getStatus());
        assertEquals("FORBIDDEN", ex3.getCode());

        // Test arbitrary unknown role
        StaffPrincipal randomActor = new StaffPrincipal(50L, null, "other", "Other", "NURSE", null);
        WorkflowException ex4 = assertThrows(WorkflowException.class, () -> service.updateStatus(randomActor, 1L, new UpdateStatusRequest(ActiveStatus.ACTIVE)));
        assertEquals(HttpStatus.FORBIDDEN, ex4.getStatus());
        assertEquals("FORBIDDEN", ex4.getCode());
    }

    @Test
    @DisplayName("Challenge 2: ADMIN role is permitted to execute ReceptionPatientService methods")
    void adminRoleIsPermitted() {
        when(patients.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        PageView<PatientListItemView> result = service.list(adminActor, null, 0, 20);
        assertNotNull(result);
        assertEquals(0, result.items().size());
    }

    @Test
    @DisplayName("Challenge 3: Pagination boundaries (page < 0, size < 1, size > 100) MUST throw INVALID_PAGE")
    void paginationBoundariesAreEnforced() {
        WorkflowException ex1 = assertThrows(WorkflowException.class, () -> service.list(receptionistActor, null, -1, 20));
        assertEquals("INVALID_PAGE", ex1.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, ex1.getStatus());

        WorkflowException ex2 = assertThrows(WorkflowException.class, () -> service.list(receptionistActor, null, 0, 0));
        assertEquals("INVALID_PAGE", ex2.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, ex2.getStatus());

        WorkflowException ex3 = assertThrows(WorkflowException.class, () -> service.list(receptionistActor, null, 0, 101));
        assertEquals("INVALID_PAGE", ex3.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, ex3.getStatus());

        verifyNoInteractions(patients);
    }

    @Test
    @DisplayName("Challenge 4: Creating walk-in patient generates PT- code, leaves userAccount null, trims fields")
    void createWalkInPatientGeneratesCodeAndSaves() {
        CreatePatientRequest req = new CreatePatientRequest(
                "  Vũ Hoàng Long  ",
                LocalDate.of(1988, 4, 12),
                Gender.MALE,
                "  0988776655  ",
                "  long.vu@hospital.vn  ",
                "  Hà Đông, Hà Nội  ",
                "  Vũ Thị Mẹ  ",
                "  0911223344  "
        );

        when(patients.saveAndFlush(any(Patient.class))).thenAnswer(inv -> {
            Patient p = inv.getArgument(0);
            p.setId(888L);
            return p;
        });

        PatientDetailView result = service.create(receptionistActor, req);

        assertNotNull(result);
        assertEquals(888L, result.id());
        assertEquals("Vũ Hoàng Long", result.fullName());
        assertTrue(result.patientCode().startsWith("PT-"));
        assertEquals(27, result.patientCode().length());
        assertNull(result.userAccountId());
        assertNull(result.username());
        assertNull(result.accountStatus());

        ArgumentCaptor<Patient> captor = ArgumentCaptor.forClass(Patient.class);
        verify(patients).saveAndFlush(captor.capture());
        Patient saved = captor.getValue();
        assertEquals("Vũ Hoàng Long", saved.getFullName());
        assertEquals("0988776655", saved.getPhone());
        assertEquals("long.vu@hospital.vn", saved.getContactEmail());
        assertEquals("Hà Đông, Hà Nội", saved.getAddress());
        assertEquals("Vũ Thị Mẹ", saved.getEmergencyContactName());
        assertEquals("0911223344", saved.getEmergencyContactPhone());
        assertNull(saved.getUserAccount());
    }

    @Test
    @DisplayName("Challenge 5: Toggling status on walk-in patient (userAccount == null) MUST throw HTTP 400 with NO_USER_ACCOUNT")
    void togglingStatusOnWalkInThrowsNoUserAccount() {
        Patient walkIn = new Patient();
        walkIn.setId(500L);
        walkIn.setPatientCode("PT-WALKIN-500");
        walkIn.setFullName("Bệnh Nhân Vãng Lai");
        walkIn.setUserAccount(null); // Walk-in patient without online user account!

        when(patients.findById(500L)).thenReturn(Optional.of(walkIn));

        UpdateStatusRequest req = new UpdateStatusRequest(ActiveStatus.INACTIVE);

        WorkflowException ex = assertThrows(WorkflowException.class,
                () -> service.updateStatus(receptionistActor, 500L, req));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("NO_USER_ACCOUNT", ex.getCode());
        assertTrue(ex.getMessage().contains("chưa có tài khoản đăng nhập trực tuyến"));

        verify(accounts, never()).flush();
    }

    @Test
    @DisplayName("Challenge 6: Toggling status on online patient (userAccount != null) successfully updates status")
    void togglingStatusOnOnlinePatientSucceeds() {
        Patient onlinePatient = new Patient();
        onlinePatient.setId(600L);
        onlinePatient.setPatientCode("PT-ONLINE-600");
        onlinePatient.setFullName("Bệnh Nhân Trực Tuyến");

        UserAccount userAccount = new UserAccount();
        userAccount.setId(700L);
        userAccount.setUsername("online.patient");
        userAccount.setStatus(ActiveStatus.ACTIVE);
        onlinePatient.setUserAccount(userAccount);

        when(patients.findById(600L)).thenReturn(Optional.of(onlinePatient));

        // Deactivate account
        UpdateStatusRequest deactivateReq = new UpdateStatusRequest(ActiveStatus.INACTIVE);
        PatientDetailView view1 = service.updateStatus(receptionistActor, 600L, deactivateReq);

        assertEquals(ActiveStatus.INACTIVE, view1.accountStatus());
        assertEquals(ActiveStatus.INACTIVE, userAccount.getStatus());
        verify(accounts).flush();

        // Reactivate account
        UpdateStatusRequest activateReq = new UpdateStatusRequest(ActiveStatus.ACTIVE);
        PatientDetailView view2 = service.updateStatus(receptionistActor, 600L, activateReq);

        assertEquals(ActiveStatus.ACTIVE, view2.accountStatus());
        assertEquals(ActiveStatus.ACTIVE, userAccount.getStatus());
    }

    @Test
    @DisplayName("Challenge 7: Operations on non-existent patient ID MUST throw HTTP 404 PATIENT_NOT_FOUND")
    void operationsOnNonExistentPatientThrowNotFound() {
        when(patients.findById(99999L)).thenReturn(Optional.empty());

        WorkflowException exDetail = assertThrows(WorkflowException.class,
                () -> service.detail(receptionistActor, 99999L));
        assertEquals(HttpStatus.NOT_FOUND, exDetail.getStatus());
        assertEquals("PATIENT_NOT_FOUND", exDetail.getCode());

        UpdatePatientRequest updateReq = new UpdatePatientRequest(
                "Name", LocalDate.of(1990, 1, 1), Gender.MALE, "0901234567", null, "Address", null, null
        );
        WorkflowException exUpdate = assertThrows(WorkflowException.class,
                () -> service.update(receptionistActor, 99999L, updateReq));
        assertEquals(HttpStatus.NOT_FOUND, exUpdate.getStatus());
        assertEquals("PATIENT_NOT_FOUND", exUpdate.getCode());

        WorkflowException exStatus = assertThrows(WorkflowException.class,
                () -> service.updateStatus(receptionistActor, 99999L, new UpdateStatusRequest(ActiveStatus.ACTIVE)));
        assertEquals(HttpStatus.NOT_FOUND, exStatus.getStatus());
        assertEquals("PATIENT_NOT_FOUND", exStatus.getCode());
    }

    @Test
    @DisplayName("Challenge 8: PatientDetailView handles null userAccount safely without NullPointerException")
    void detailViewHandlesNullUserAccountSafely() {
        Patient walkIn = new Patient();
        walkIn.setId(333L);
        walkIn.setPatientCode("PT-333");
        walkIn.setFullName("Nguyễn An Toàn");
        walkIn.setDateOfBirth(LocalDate.of(1995, 5, 5));
        walkIn.setGender(Gender.MALE);
        walkIn.setPhone("0911223344");
        walkIn.setUserAccount(null); // No account

        when(patients.findById(333L)).thenReturn(Optional.of(walkIn));

        PatientDetailView view = service.detail(receptionistActor, 333L);
        assertNotNull(view);
        assertEquals(333L, view.id());
        assertNull(view.userAccountId());
        assertNull(view.username());
        assertNull(view.accountStatus());
    }
}
