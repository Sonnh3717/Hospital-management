package com.example.swd.service;

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
import com.example.swd.service.impl.ReceptionPatientServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReceptionPatientServiceTest {

    @Mock PatientRepository patients;
    @Mock UserAccountRepository accounts;

    ReceptionPatientService service;
    StaffPrincipal receptionist;
    StaffPrincipal patientActor;

    @BeforeEach
    void setUp() {
        service = new ReceptionPatientServiceImpl(patients, accounts);
        receptionist = new StaffPrincipal(100L, 2L, "receptionist", "Lễ Tân 1", "RECEPTIONIST", null);
        patientActor = new StaffPrincipal(200L, null, "patient", "Bệnh Nhân 1", "PATIENT", 5L);
    }

    @Test
    void nonReceptionistThrowsForbidden() {
        WorkflowException ex = assertThrows(WorkflowException.class,
                () -> service.list(patientActor, null, 0, 20));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void listReturnsPaginatedPatients() {
        Patient p = new Patient();
        p.setId(1L);
        p.setPatientCode("PT-001");
        p.setFullName("Nguyễn Văn An");
        p.setDateOfBirth(LocalDate.of(1990, 1, 1));
        p.setGender(Gender.MALE);
        p.setPhone("0901234567");
        p.setContactEmail("an@example.com");
        p.setAddress("Hà Nội");

        when(patients.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(p)));

        PageView<PatientListItemView> result = service.list(receptionist, "Nguyễn", 0, 20);
        assertNotNull(result);
        assertEquals(1, result.items().size());
        assertEquals("PT-001", result.items().get(0).patientCode());
        assertEquals("Nguyễn Văn An", result.items().get(0).fullName());
        assertEquals(1L, result.total());
    }

    @Test
    void detailReturnsPatientWhenFound() {
        Patient p = new Patient();
        p.setId(10L);
        p.setPatientCode("PT-010");
        p.setFullName("Trần Văn Bình");
        p.setDateOfBirth(LocalDate.of(1985, 3, 15));
        p.setGender(Gender.MALE);
        p.setPhone("0912345678");
        p.setContactEmail("binh@example.com");
        p.setAddress("TP HCM");
        p.setEmergencyContactName("Trần Thị Hoa");
        p.setEmergencyContactPhone("0987654321");

        UserAccount acc = new UserAccount();
        acc.setId(50L);
        acc.setUsername("binh.tran");
        acc.setStatus(ActiveStatus.ACTIVE);
        p.setUserAccount(acc);

        when(patients.findById(10L)).thenReturn(Optional.of(p));

        PatientDetailView view = service.detail(receptionist, 10L);
        assertNotNull(view);
        assertEquals(10L, view.id());
        assertEquals("PT-010", view.patientCode());
        assertEquals("Trần Văn Bình", view.fullName());
        assertEquals("Trần Thị Hoa", view.emergencyContactName());
        assertEquals(50L, view.userAccountId());
        assertEquals("binh.tran", view.username());
        assertEquals(ActiveStatus.ACTIVE, view.accountStatus());
    }

    @Test
    void detailThrowsNotFoundWhenPatientDoesNotExist() {
        when(patients.findById(999L)).thenReturn(Optional.empty());
        WorkflowException ex = assertThrows(WorkflowException.class,
                () -> service.detail(receptionist, 999L));
        assertEquals("PATIENT_NOT_FOUND", ex.getCode());
    }

    @Test
    void createWalkInPatientGeneratesCodeAndSaves() {
        CreatePatientRequest req = new CreatePatientRequest(
                "Lê Thị Lan", LocalDate.of(1992, 7, 24), Gender.FEMALE,
                "0933445566", "lan@example.com", "Đà Nẵng",
                "Lê Văn Hùng", "0944556677"
        );

        when(patients.saveAndFlush(any(Patient.class))).thenAnswer(inv -> {
            Patient p = inv.getArgument(0);
            p.setId(25L);
            return p;
        });

        PatientDetailView created = service.create(receptionist, req);
        assertNotNull(created);
        assertEquals(25L, created.id());
        assertEquals("Lê Thị Lan", created.fullName());
        assertTrue(created.patientCode().startsWith("PT-"));
        assertEquals(Gender.FEMALE, created.gender());
        assertEquals("Đà Nẵng", created.address());
        assertNull(created.userAccountId());
    }

    @Test
    void updateModifiesPatientFields() {
        Patient p = new Patient();
        p.setId(15L);
        p.setPatientCode("PT-015");
        p.setFullName("Hoàng Văn Cường");
        p.setDateOfBirth(LocalDate.of(1980, 10, 10));
        p.setGender(Gender.MALE);
        p.setPhone("0988112233");
        p.setAddress("Hải Phòng");

        when(patients.findById(15L)).thenReturn(Optional.of(p));

        UpdatePatientRequest req = new UpdatePatientRequest(
                "Hoàng Văn Cường (Đã đổi tên)", LocalDate.of(1980, 10, 10), Gender.MALE,
                "0988112299", "cuong.new@example.com", "Quảng Ninh",
                "Hoàng Thị Mơ", "0977889900"
        );

        PatientDetailView updated = service.update(receptionist, 15L, req);
        assertNotNull(updated);
        assertEquals("Hoàng Văn Cường (Đã đổi tên)", updated.fullName());
        assertEquals("0988112299", updated.phone());
        assertEquals("cuong.new@example.com", updated.contactEmail());
        assertEquals("Quảng Ninh", updated.address());
        assertEquals("Hoàng Thị Mơ", updated.emergencyContactName());
        verify(patients).flush();
    }

    @Test
    void updateStatusTogglesAccountStatus() {
        Patient p = new Patient();
        p.setId(20L);
        p.setPatientCode("PT-020");
        p.setFullName("Phạm Văn Dũng");

        UserAccount acc = new UserAccount();
        acc.setId(70L);
        acc.setUsername("dung.pham");
        acc.setStatus(ActiveStatus.ACTIVE);
        p.setUserAccount(acc);

        when(patients.findById(20L)).thenReturn(Optional.of(p));

        UpdateStatusRequest req = new UpdateStatusRequest(ActiveStatus.INACTIVE);
        PatientDetailView result = service.updateStatus(receptionist, 20L, req);

        assertNotNull(result);
        assertEquals(ActiveStatus.INACTIVE, result.accountStatus());
        assertEquals(ActiveStatus.INACTIVE, acc.getStatus());
        verify(accounts).flush();
    }

    @Test
    void updateStatusThrowsWhenPatientHasNoUserAccount() {
        Patient p = new Patient();
        p.setId(30L);
        p.setPatientCode("PT-030");
        p.setFullName("Walk-in Patient");
        p.setUserAccount(null);

        when(patients.findById(30L)).thenReturn(Optional.of(p));

        UpdateStatusRequest req = new UpdateStatusRequest(ActiveStatus.INACTIVE);
        WorkflowException ex = assertThrows(WorkflowException.class,
                () -> service.updateStatus(receptionist, 30L, req));
        assertEquals("NO_USER_ACCOUNT", ex.getCode());
        verifyNoInteractions(accounts);
    }
}
