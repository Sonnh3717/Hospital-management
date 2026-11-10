package com.example.swd.service;

import com.example.swd.controller.appointment.AppointmentController;
import com.example.swd.dto.request.CancelAppointmentRequest;
import com.example.swd.dto.request.RescheduleRequest;
import com.example.swd.dto.response.ApiResponse;
import com.example.swd.dto.response.AppointmentResponse;
import com.example.swd.dto.response.WorkflowViews.AppointmentView;
import com.example.swd.dto.response.WorkflowViews.SlotView;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.appointment.AppointmentSlot;
import com.example.swd.entity.common.enums.Gender;
import com.example.swd.entity.encounter.Encounter;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.scheduling.WorkSchedule;
import com.example.swd.entity.staff.DoctorProfile;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.exception.WorkflowException;
import com.example.swd.config.PayOSService;
import com.example.swd.repository.*;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.impl.AppointmentServiceImpl;
import com.example.swd.service.impl.ReceptionAppointmentServiceImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentLifecycleChallengerTest {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    // =========================================================================
    // SECTION 1: AppointmentController.getPatientAppointments Stress Tests
    // =========================================================================
    @Nested
    @DisplayName("1. Patient Appointment Resolution Adversarial Tests")
    class PatientAppointmentResolutionTests {

        @Mock AppointmentService appointmentService;
        @Mock PayOSService payOSService;
        @Mock AppointmentRepository appointmentRepository;
        @Mock UserAccountRepository userAccountRepository;
        @Mock PatientRepository patientRepository;

        AppointmentController controller;

        @BeforeEach
        void setUp() {
            controller = new AppointmentController(
                    appointmentService,
                    payOSService,
                    appointmentRepository,
                    userAccountRepository,
                    patientRepository
            );
        }

        @Test
        @DisplayName("1.1 PatientId omitted: resolves via principal.patientId() without querying accountId")
        void patientIdOmitted_resolvesViaPrincipalPatientId() {
            // principal has accountId = 10L, patientId = 77L
            StaffPrincipal principal = new StaffPrincipal(10L, null, "patient_user", "Nguyen Van An", "PATIENT", 77L);

            AppointmentResponse mockResp = AppointmentResponse.builder().id(1L).patientId(77L).build();
            when(appointmentService.getAppointmentsByPatient(77L)).thenReturn(List.of(mockResp));

            ResponseEntity<ApiResponse<List<AppointmentResponse>>> response =
                    controller.getPatientAppointments(null, principal);

            assertNotNull(response);
            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getData().size());
            assertEquals(77L, response.getBody().getData().get(0).getPatientId());

            // CRITICAL: verify service was called with patientId (77L), NOT accountId (10L)
            verify(appointmentService).getAppointmentsByPatient(77L);
            verify(appointmentService, never()).getAppointmentsByPatient(10L);
            // patientRepository need not be called if principal already contains patientId
            verifyNoInteractions(patientRepository);
        }

        @Test
        @DisplayName("1.2 PatientId omitted & principal.patientId() is null: falls back to patientRepository.findByUserAccount_Id")
        void patientIdOmitted_fallsBackToPatientRepository() {
            // principal has accountId = 15L, but patientId is null
            StaffPrincipal principal = new StaffPrincipal(15L, null, "patient_fallback", "Tran Thi Mai", "PATIENT", null);

            Patient patient = new Patient();
            patient.setId(99L);
            patient.setFullName("Tran Thi Mai");

            when(patientRepository.findByUserAccount_Id(15L)).thenReturn(Optional.of(patient));
            when(appointmentService.getAppointmentsByPatient(99L)).thenReturn(List.of());

            ResponseEntity<ApiResponse<List<AppointmentResponse>>> response =
                    controller.getPatientAppointments(null, principal);

            assertNotNull(response);
            assertEquals(200, response.getStatusCode().value());
            verify(patientRepository).findByUserAccount_Id(15L);
            verify(appointmentService).getAppointmentsByPatient(99L);
            verify(appointmentService, never()).getAppointmentsByPatient(15L);
        }

        @Test
        @DisplayName("1.3 PatientId omitted & patient profile not found: returns empty list cleanly without NPE or querying accountId")
        void patientIdOmitted_noProfileFound_returnsEmptyCleanly() {
            StaffPrincipal principal = new StaffPrincipal(20L, null, "no_profile", "Chua Co Ho So", "PATIENT", null);
            when(patientRepository.findByUserAccount_Id(20L)).thenReturn(Optional.empty());

            ResponseEntity<ApiResponse<List<AppointmentResponse>>> response =
                    controller.getPatientAppointments(null, principal);

            assertNotNull(response);
            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
            assertEquals("Chưa có hồ sơ bệnh nhân", response.getBody().getMessage());
            assertTrue(response.getBody().getData().isEmpty());
            verifyNoInteractions(appointmentService);
        }

        @Test
        @DisplayName("1.4 Admin caller: explicit patientId query parameter is respected for ADMIN")
        void explicitPatientId_respectedForAdmin() {
            StaffPrincipal adminPrincipal = new StaffPrincipal(1L, null, "admin_user", "Admin", "ADMIN", null);
            when(appointmentService.getAppointmentsByPatient(888L)).thenReturn(List.of());

            ResponseEntity<ApiResponse<List<AppointmentResponse>>> response =
                    controller.getPatientAppointments(888L, adminPrincipal);

            assertEquals(200, response.getStatusCode().value());
            verify(appointmentService).getAppointmentsByPatient(888L);
        }

        @Test
        @DisplayName("1.5 IDOR Prevention: non-admin patient cannot view another patient's appointments via patientId param")
        void nonAdmin_patientCannotViewOtherPatientAppointments() {
            StaffPrincipal patientPrincipal = new StaffPrincipal(10L, null, "patient_user", "Nguyen Van An", "PATIENT", 77L);
            when(appointmentService.getAppointmentsByPatient(77L)).thenReturn(List.of());

            ResponseEntity<ApiResponse<List<AppointmentResponse>>> response =
                    controller.getPatientAppointments(888L, patientPrincipal);

            assertEquals(200, response.getStatusCode().value());
            // Verifies targetPatientId was bound strictly to caller's patientId (77L), ignoring 888L
            verify(appointmentService).getAppointmentsByPatient(77L);
            verify(appointmentService, never()).getAppointmentsByPatient(888L);
        }
    }

    // =========================================================================
    // SECTION 2: Available Slots Discovery & Boundaries Stress Tests
    // =========================================================================
    @Nested
    @DisplayName("2. Available Slots Boundary & Filtering Tests")
    class AvailableSlotsTests {

        @Mock AppointmentRepository appointmentRepository;
        @Mock AppointmentSlotRepository appointmentSlotRepository;
        @Mock PatientRepository patientRepository;
        @Mock HospitalStaffRepository hospitalStaffRepository;
        @Mock UserAccountRepository userAccountRepository;
        @Mock EncounterRepository encounterRepository;
        @Mock DoctorProfileRepository doctorProfileRepository;

        AppointmentServiceImpl service;

        @BeforeEach
        void setUp() {
            service = new AppointmentServiceImpl(
                    appointmentRepository,
                    appointmentSlotRepository,
                    patientRepository,
                    hospitalStaffRepository,
                    userAccountRepository,
                    encounterRepository,
                    doctorProfileRepository
            );
        }

        private AppointmentSlot buildSlot(Long id, AppointmentSlot.Status status,
                                          LocalDateTime startsAt, LocalDateTime endsAt,
                                          int capacity, Long docStaffId, String docName) {
            HospitalStaff staff = new HospitalStaff();
            staff.setId(docStaffId);
            staff.setFullName(docName);

            WorkSchedule schedule = new WorkSchedule();
            schedule.setStaff(staff);

            AppointmentSlot slot = new AppointmentSlot();
            slot.setId(id);
            slot.setStatus(status);
            slot.setStartsAt(startsAt);
            slot.setEndsAt(endsAt);
            slot.setCapacity(capacity);
            slot.setWorkSchedule(schedule);
            return slot;
        }

        @Test
        @DisplayName("2.1 Past date query: all ended slots are excluded")
        void pastDate_allEndedSlotsExcluded() {
            LocalDate yesterday = LocalDate.now(VIETNAM_ZONE).minusDays(1);
            LocalDateTime slotStart = yesterday.atTime(8, 0).atZone(VIETNAM_ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
            LocalDateTime slotEnd = slotStart.plusMinutes(30);

            AppointmentSlot pastSlot = buildSlot(201L, AppointmentSlot.Status.OPEN, slotStart, slotEnd, 5, 10L, "BS Nguyen");
            when(appointmentSlotRepository.findForDate(any(), any())).thenReturn(List.of(pastSlot));

            List<SlotView> available = service.getAvailableSlots(yesterday, null);
            assertNotNull(available);
            assertTrue(available.isEmpty(), "Past slots whose endsAt <= now must be excluded");
        }

        @Test
        @DisplayName("2.2 Today date: slots that already ended earlier today are excluded, future slots retained")
        void todayDate_filtersPastSlotsWithinSameDay() {
            LocalDate today = LocalDate.now(VIETNAM_ZONE);
            LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);

            // Slot 1: ended 1 hour ago
            AppointmentSlot endedToday = buildSlot(202L, AppointmentSlot.Status.OPEN,
                    nowUtc.minusHours(2), nowUtc.minusHours(1), 5, 10L, "BS Nguyen");

            // Slot 2: starts in 1 hour, ends in 1.5 hours
            AppointmentSlot futureToday = buildSlot(203L, AppointmentSlot.Status.OPEN,
                    nowUtc.plusHours(1), nowUtc.plusMinutes(90), 5, 10L, "BS Nguyen");

            when(appointmentSlotRepository.findForDate(any(), any())).thenReturn(List.of(endedToday, futureToday));
            when(appointmentRepository.countActiveBySlotId(203L)).thenReturn(2L); // remaining = 3

            DoctorProfile profile = new DoctorProfile();
            profile.setId(10L);
            HospitalStaff st = new HospitalStaff(); st.setId(10L); st.setFullName("BS Nguyen");
            profile.setStaff(st);
            profile.setSpecialization("Da lieu");
            when(doctorProfileRepository.findById(10L)).thenReturn(Optional.of(profile));

            List<SlotView> available = service.getAvailableSlots(today, null);
            assertEquals(1, available.size(), "Only future slots today should be returned");
            assertEquals(203L, available.get(0).id());
            assertEquals(3, available.get(0).remaining());
        }

        @Test
        @DisplayName("2.3 Slot capacity boundaries: capacity=0, remaining=0, or overbooked are excluded")
        void slotCapacityBoundaries() {
            LocalDateTime futureStart = LocalDateTime.now(ZoneOffset.UTC).plusHours(3);
            LocalDateTime futureEnd = futureStart.plusMinutes(30);

            // Slot with capacity = 0
            AppointmentSlot zeroCapSlot = buildSlot(301L, AppointmentSlot.Status.OPEN,
                    futureStart, futureEnd, 0, 10L, "BS Nguyen");

            // Slot with capacity = 4, activeCount = 4 (full)
            AppointmentSlot fullSlot = buildSlot(302L, AppointmentSlot.Status.OPEN,
                    futureStart, futureEnd, 4, 10L, "BS Nguyen");

            // Slot with capacity = 3, activeCount = 5 (overbooked anomaly)
            AppointmentSlot overbookedSlot = buildSlot(303L, AppointmentSlot.Status.OPEN,
                    futureStart, futureEnd, 3, 10L, "BS Nguyen");

            // Slot with capacity = 5, activeCount = 2 (remaining = 3)
            AppointmentSlot availableSlot = buildSlot(304L, AppointmentSlot.Status.OPEN,
                    futureStart, futureEnd, 5, 10L, "BS Nguyen");

            when(appointmentSlotRepository.findForDate(any(), any()))
                    .thenReturn(List.of(zeroCapSlot, fullSlot, overbookedSlot, availableSlot));
            when(appointmentRepository.countActiveBySlotId(301L)).thenReturn(0L);
            when(appointmentRepository.countActiveBySlotId(302L)).thenReturn(4L);
            when(appointmentRepository.countActiveBySlotId(303L)).thenReturn(5L);
            when(appointmentRepository.countActiveBySlotId(304L)).thenReturn(2L);

            List<SlotView> available = service.getAvailableSlots(LocalDate.now(VIETNAM_ZONE), null);
            assertEquals(1, available.size());
            assertEquals(304L, available.get(0).id());
            assertEquals(3, available.get(0).remaining());
        }

        @Test
        @DisplayName("2.4 Slot status boundary: CANCELLED or CLOSED slots are excluded even if remaining > 0")
        void nonOpenSlotsExcluded() {
            LocalDateTime futureStart = LocalDateTime.now(ZoneOffset.UTC).plusHours(3);
            LocalDateTime futureEnd = futureStart.plusMinutes(30);

            AppointmentSlot cancelledSlot = buildSlot(401L, AppointmentSlot.Status.BLOCKED,
                    futureStart, futureEnd, 10, 10L, "BS Nguyen");
            AppointmentSlot openSlot = buildSlot(402L, AppointmentSlot.Status.OPEN,
                    futureStart, futureEnd, 10, 10L, "BS Nguyen");

            when(appointmentSlotRepository.findForDate(any(), any()))
                    .thenReturn(List.of(cancelledSlot, openSlot));
            when(appointmentRepository.countActiveBySlotId(402L)).thenReturn(0L);

            List<SlotView> available = service.getAvailableSlots(LocalDate.now(VIETNAM_ZONE), null);
            assertEquals(1, available.size());
            assertEquals(402L, available.get(0).id());
            verify(appointmentRepository, never()).countActiveBySlotId(401L);
        }

        @Test
        @DisplayName("2.5 Doctor filter: filters out other doctors cleanly")
        void doctorFilterIsRespected() {
            LocalDateTime futureStart = LocalDateTime.now(ZoneOffset.UTC).plusHours(3);
            LocalDateTime futureEnd = futureStart.plusMinutes(30);

            AppointmentSlot doc1Slot = buildSlot(501L, AppointmentSlot.Status.OPEN, futureStart, futureEnd, 5, 10L, "BS A");
            AppointmentSlot doc2Slot = buildSlot(502L, AppointmentSlot.Status.OPEN, futureStart, futureEnd, 5, 20L, "BS B");

            when(appointmentSlotRepository.findForDate(any(), any()))
                    .thenReturn(List.of(doc1Slot, doc2Slot));
            when(appointmentRepository.countActiveBySlotId(502L)).thenReturn(0L);

            List<SlotView> available = service.getAvailableSlots(LocalDate.now(VIETNAM_ZONE), 20L);
            assertEquals(1, available.size());
            assertEquals(502L, available.get(0).id());
            assertEquals("BS B", available.get(0).doctorName());
            verify(appointmentRepository, never()).countActiveBySlotId(501L);
        }

        @Test
        @DisplayName("2.6 Null date parameter defaults to today in Vietnam zone")
        void nullDate_defaultsToTodayInVietnamZone() {
            when(appointmentSlotRepository.findForDate(any(), any())).thenReturn(List.of());

            List<SlotView> available = service.getAvailableSlots(null, null);
            assertNotNull(available);
            assertTrue(available.isEmpty());

            ArgumentCaptor<LocalDateTime> fromCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
            ArgumentCaptor<LocalDateTime> toCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
            verify(appointmentSlotRepository).findForDate(fromCaptor.capture(), toCaptor.capture());

            LocalDate expectedToday = LocalDate.now(VIETNAM_ZONE);
            LocalDateTime expectedFrom = expectedToday.atStartOfDay(VIETNAM_ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
            assertEquals(expectedFrom, fromCaptor.getValue());
        }
    }

    // =========================================================================
    // SECTION 3: Receptionist Check-In & Undo Check-In Adversarial Tests
    // =========================================================================
    @Nested
    @DisplayName("3. Receptionist Check-In & Undo Check-In Staff Resolution Tests")
    class ReceptionCheckInTests {

        @Mock AppointmentRepository appointments;
        @Mock AppointmentSlotRepository slots;
        @Mock PatientRepository patients;
        @Mock DoctorProfileRepository doctors;
        @Mock HospitalStaffRepository staff;
        @Mock UserAccountRepository accounts;
        @Mock EntityManager em;
        @Mock TypedQuery<Encounter> query;

        ReceptionAppointmentServiceImpl service;

        @BeforeEach
        void setUp() {
            service = new ReceptionAppointmentServiceImpl(appointments, slots, patients, doctors, staff, accounts, em);
        }

        private Appointment buildTodayAppointment(Long id, Appointment.Status status, Long docStaffId) {
            HospitalStaff docStaff = new HospitalStaff();
            docStaff.setId(docStaffId);
            docStaff.setFullName("BS C");

            WorkSchedule sched = new WorkSchedule();
            sched.setStaff(docStaff);

            LocalDateTime startsAtUtc = LocalDate.now(VIETNAM_ZONE)
                    .atTime(10, 0)
                    .atZone(VIETNAM_ZONE)
                    .withZoneSameInstant(ZoneOffset.UTC)
                    .toLocalDateTime();

            AppointmentSlot slot = new AppointmentSlot();
            slot.setId(600L);
            slot.setStartsAt(startsAtUtc);
            slot.setEndsAt(startsAtUtc.plusMinutes(30));
            slot.setCapacity(5);
            slot.setWorkSchedule(sched);

            Patient patient = new Patient();
            patient.setId(10L);
            patient.setPatientCode("PT-0010");
            patient.setFullName("Nguyen Van B");
            patient.setGender(Gender.MALE);

            Appointment appt = new Appointment();
            appt.setId(id);
            appt.setAppointmentCode("APPT-" + id);
            appt.setStatus(status);
            appt.setPatient(patient);
            appt.setAppointmentSlot(slot);
            appt.setBookingSource(Appointment.BookingSource.WALK_IN);
            return appt;
        }

        private void mockNoEncounter() {
            when(em.createQuery(anyString(), eq(Encounter.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.getResultStream()).thenAnswer(inv -> Stream.empty());
        }

        private void mockDoctorProfile(Long docStaffId) {
            DoctorProfile profile = new DoctorProfile();
            profile.setId(docStaffId);
            HospitalStaff st = new HospitalStaff(); st.setId(docStaffId); st.setFullName("BS C");
            profile.setStaff(st);
            profile.setSpecialization("Noi khoa");
            when(doctors.findById(docStaffId)).thenReturn(Optional.of(profile));
        }

        @Test
        @DisplayName("3.1 Check-in with actor.staffId() == null resolves receptionist via actor.accountId()")
        void checkIn_resolvesStaffFromAccountIdWhenStaffIdNull() {
            StaffPrincipal actor = new StaffPrincipal(101L, null, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
            Appointment appt = buildTodayAppointment(701L, Appointment.Status.BOOKED, 25L);

            HospitalStaff receptionistStaff = new HospitalStaff();
            receptionistStaff.setId(55L);
            receptionistStaff.setFullName("Le Tan 1");

            when(appointments.lockById(701L)).thenReturn(Optional.of(appt));
            mockNoEncounter();
            when(staff.findByUserAccount_Id(101L)).thenReturn(Optional.of(receptionistStaff));
            when(staff.getReferenceById(55L)).thenReturn(receptionistStaff);
            mockDoctorProfile(25L);

            AppointmentView result = service.checkIn(actor, 701L);
            assertNotNull(result);
            assertEquals("CHECKED_IN", result.status());
            assertEquals(Appointment.Status.CHECKED_IN, appt.getStatus());
            assertNotNull(appt.getCheckedInAt());
            assertSame(receptionistStaff, appt.getCheckedInByStaff());
            verify(appointments).flush();
        }

        @Test
        @DisplayName("3.2 Check-in with actor.staffId() != null directly uses staffId without account lookup")
        void checkIn_usesDirectStaffIdWhenPresent() {
            StaffPrincipal actor = new StaffPrincipal(102L, 88L, "receptionist_2", "Le Tan 2", "RECEPTIONIST", null);
            Appointment appt = buildTodayAppointment(702L, Appointment.Status.BOOKED, 25L);

            HospitalStaff receptionistStaff = new HospitalStaff();
            receptionistStaff.setId(88L);
            receptionistStaff.setFullName("Le Tan 2");

            when(appointments.lockById(702L)).thenReturn(Optional.of(appt));
            mockNoEncounter();
            when(staff.getReferenceById(88L)).thenReturn(receptionistStaff);
            mockDoctorProfile(25L);

            AppointmentView result = service.checkIn(actor, 702L);
            assertEquals("CHECKED_IN", result.status());
            assertSame(receptionistStaff, appt.getCheckedInByStaff());
            verify(staff, never()).findByUserAccount_Id(any());
        }

        @Test
        @DisplayName("3.3 Check-in fails when receptionist has no staff record in DB (throws 403 STAFF_NOT_FOUND)")
        void checkIn_throwsWhenStaffRecordNotFound() {
            StaffPrincipal actor = new StaffPrincipal(999L, null, "rogue_receptionist", "Rogue", "RECEPTIONIST", null);
            Appointment appt = buildTodayAppointment(703L, Appointment.Status.BOOKED, 25L);

            when(appointments.lockById(703L)).thenReturn(Optional.of(appt));
            mockNoEncounter();
            when(staff.findByUserAccount_Id(999L)).thenReturn(Optional.empty());

            WorkflowException ex = assertThrows(WorkflowException.class, () -> service.checkIn(actor, 703L));
            assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
            assertEquals("STAFF_NOT_FOUND", ex.getCode());
        }

        @Test
        @DisplayName("3.4 Check-in idempotency: appointment already CHECKED_IN returns current view cleanly")
        void checkIn_isIdempotentWhenAlreadyCheckedIn() {
            StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
            Appointment appt = buildTodayAppointment(704L, Appointment.Status.CHECKED_IN, 25L);

            when(appointments.lockById(704L)).thenReturn(Optional.of(appt));
            mockNoEncounter();
            mockDoctorProfile(25L);

            AppointmentView result = service.checkIn(actor, 704L);
            assertEquals("CHECKED_IN", result.status());
            verify(appointments, never()).flush();
        }

        @Test
        @DisplayName("3.5 Check-in rejection: cannot check in an appointment from a different day (yesterday/tomorrow)")
        void checkIn_rejectsAppointmentsFromOtherDays() {
            StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
            Appointment appt = buildTodayAppointment(705L, Appointment.Status.BOOKED, 25L);

            // Change slot date to tomorrow
            LocalDateTime tomorrowUtc = LocalDate.now(VIETNAM_ZONE).plusDays(1)
                    .atTime(10, 0).atZone(VIETNAM_ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
            appt.getAppointmentSlot().setStartsAt(tomorrowUtc);

            when(appointments.lockById(705L)).thenReturn(Optional.of(appt));
            mockNoEncounter();

            WorkflowException ex = assertThrows(WorkflowException.class, () -> service.checkIn(actor, 705L));
            assertEquals(HttpStatus.CONFLICT, ex.getStatus());
            assertEquals("INVALID_STATE", ex.getCode());
            assertTrue(ex.getMessage().contains("tiếp nhận hôm nay"));
        }

        @Test
        @DisplayName("3.6 Check-in conflict: cannot check in when clinical Encounter has already started")
        void checkIn_conflictsWhenEncounterAlreadyStarted() {
            StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
            Appointment appt = buildTodayAppointment(706L, Appointment.Status.BOOKED, 25L);

            when(appointments.lockById(706L)).thenReturn(Optional.of(appt));
            Encounter activeEncounter = new Encounter();
            activeEncounter.setId(99L);
            when(em.createQuery(anyString(), eq(Encounter.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.getResultStream()).thenAnswer(inv -> Stream.of(activeEncounter));

            WorkflowException ex = assertThrows(WorkflowException.class, () -> service.checkIn(actor, 706L));
            assertEquals(HttpStatus.CONFLICT, ex.getStatus());
            assertEquals("ENCOUNTER_STARTED", ex.getCode());
        }

        @Test
        @DisplayName("3.7 Undo check-in: reverts to BOOKED, clears checkedInByStaff, records lastCheckInReversedByStaff")
        void undoCheckIn_revertsToBookedWithStaffResolution() {
            StaffPrincipal actor = new StaffPrincipal(101L, null, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
            Appointment appt = buildTodayAppointment(707L, Appointment.Status.CHECKED_IN, 25L);
            appt.setCheckedInAt(LocalDateTime.now().minusMinutes(10));

            HospitalStaff receptionistStaff = new HospitalStaff();
            receptionistStaff.setId(55L);
            receptionistStaff.setFullName("Le Tan 1");

            when(appointments.lockById(707L)).thenReturn(Optional.of(appt));
            mockNoEncounter();
            when(staff.findByUserAccount_Id(101L)).thenReturn(Optional.of(receptionistStaff));
            when(staff.getReferenceById(55L)).thenReturn(receptionistStaff);
            mockDoctorProfile(25L);

            AppointmentView result = service.undoCheckIn(actor, 707L);
            assertEquals("BOOKED", result.status());
            assertEquals(Appointment.Status.BOOKED, appt.getStatus());
            assertNull(appt.getCheckedInAt());
            assertNull(appt.getCheckedInByStaff());
            assertNotNull(appt.getLastCheckInReversedAt());
            assertSame(receptionistStaff, appt.getLastCheckInReversedByStaff());
            verify(appointments).flush();
        }

        @Test
        @DisplayName("3.8 Undo check-in idempotency: if already BOOKED, returns view cleanly")
        void undoCheckIn_idempotentWhenAlreadyBooked() {
            StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
            Appointment appt = buildTodayAppointment(708L, Appointment.Status.BOOKED, 25L);

            when(appointments.lockById(708L)).thenReturn(Optional.of(appt));
            mockNoEncounter();
            mockDoctorProfile(25L);

            AppointmentView result = service.undoCheckIn(actor, 708L);
            assertEquals("BOOKED", result.status());
            verify(appointments, never()).flush();
        }

        @Test
        @DisplayName("3.9 Unauthorized role: non-RECEPTIONIST actor is rejected with 403 FORBIDDEN")
        void nonReceptionistActor_rejected() {
            StaffPrincipal doctorActor = new StaffPrincipal(201L, 10L, "doctor_c", "BS C", "DOCTOR", null);

            WorkflowException ex = assertThrows(WorkflowException.class, () -> service.checkIn(doctorActor, 701L));
            assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
            assertEquals("FORBIDDEN", ex.getCode());
        }
    }

    // =========================================================================
    // SECTION 4: Patient Appointment Cancellation, Rescheduling & 24h Notice
    // =========================================================================
    @Nested
    @DisplayName("4. Patient Appointment Lifecycle, 24h Notice & State Guards Tests")
    class PatientAppointmentLifecycleTests {

        @Mock AppointmentRepository appointmentRepository;
        @Mock AppointmentSlotRepository appointmentSlotRepository;
        @Mock PatientRepository patientRepository;
        @Mock HospitalStaffRepository hospitalStaffRepository;
        @Mock UserAccountRepository userAccountRepository;
        @Mock EncounterRepository encounterRepository;
        @Mock DoctorProfileRepository doctorProfileRepository;

        AppointmentServiceImpl service;

        @BeforeEach
        void setUp() {
            service = new AppointmentServiceImpl(
                    appointmentRepository,
                    appointmentSlotRepository,
                    patientRepository,
                    hospitalStaffRepository,
                    userAccountRepository,
                    encounterRepository,
                    doctorProfileRepository
            );
        }

        private Appointment buildAppointment(Long id, Appointment.Status status, LocalDateTime startsAt) {
            HospitalStaff docStaff = new HospitalStaff();
            docStaff.setId(10L);
            docStaff.setFullName("BS Le Van Minh");

            WorkSchedule ws = new WorkSchedule();
            ws.setStaff(docStaff);

            AppointmentSlot slot = new AppointmentSlot();
            slot.setId(100L);
            slot.setStartsAt(startsAt);
            slot.setEndsAt(startsAt.plusMinutes(30));
            slot.setStatus(AppointmentSlot.Status.OPEN);
            slot.setCapacity(5);
            slot.setWorkSchedule(ws);

            Patient patient = new Patient();
            patient.setId(50L);
            patient.setFullName("Nguyen Van A");
            patient.setGender(Gender.MALE);

            Appointment appt = new Appointment();
            appt.setId(id);
            appt.setAppointmentCode("APPT-" + id);
            appt.setStatus(status);
            appt.setAppointmentSlot(slot);
            appt.setPatient(patient);
            appt.setBookingSource(Appointment.BookingSource.ONLINE);
            return appt;
        }

        @Test
        @DisplayName("4.1 Cancel <24h notice: patient attempting to cancel within 23 hours is rejected with DEADLINE_EXCEEDED")
        void cancel_lessThan24hNotice_rejected() {
            LocalDateTime nearFuture = LocalDateTime.now().plusHours(23); // < 24h (1380 mins < 1440 mins)
            Appointment appt = buildAppointment(1L, Appointment.Status.BOOKED, nearFuture);
            UserAccount account = new UserAccount(); account.setId(10L);

            when(appointmentRepository.lockById(1L)).thenReturn(Optional.of(appt));
            when(userAccountRepository.findById(10L)).thenReturn(Optional.of(account));

            CancelAppointmentRequest req = new CancelAppointmentRequest();
            req.setReason("Ban viec dot xuat");

            WorkflowException ex = assertThrows(WorkflowException.class, () ->
                    service.cancelAppointment(1L, req, 10L, true));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
            assertEquals("DEADLINE_EXCEEDED", ex.getCode());
            assertTrue(ex.getMessage().contains("24 giờ"));
            verify(appointmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("4.2 Reschedule <24h notice: patient attempting to reschedule within 23 hours is rejected with DEADLINE_EXCEEDED")
        void reschedule_lessThan24hNotice_rejected() {
            LocalDateTime nearFuture = LocalDateTime.now().plusHours(23);
            Appointment appt = buildAppointment(2L, Appointment.Status.BOOKED, nearFuture);
            UserAccount account = new UserAccount(); account.setId(10L);

            when(appointmentRepository.lockById(2L)).thenReturn(Optional.of(appt));
            when(userAccountRepository.findById(10L)).thenReturn(Optional.of(account));

            RescheduleRequest req = new RescheduleRequest();
            req.setNewAppointmentSlotId(200L);

            WorkflowException ex = assertThrows(WorkflowException.class, () ->
                    service.rescheduleAppointment(2L, req, 10L, true));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
            assertEquals("DEADLINE_EXCEEDED", ex.getCode());
            assertTrue(ex.getMessage().contains("24 giờ"));
            verify(appointmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("4.3 Cancel >24h notice: patient can successfully cancel appointment scheduled 48h away")
        void cancel_moreThan24hNotice_succeeds() {
            LocalDateTime farFuture = LocalDateTime.now().plusHours(48);
            Appointment appt = buildAppointment(3L, Appointment.Status.BOOKED, farFuture);
            UserAccount account = new UserAccount(); account.setId(10L);

            when(appointmentRepository.lockById(3L)).thenReturn(Optional.of(appt));
            when(userAccountRepository.findById(10L)).thenReturn(Optional.of(account));
            when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

            CancelAppointmentRequest req = new CancelAppointmentRequest();
            req.setReason("Co lich cong tac");

            AppointmentResponse resp = service.cancelAppointment(3L, req, 10L, true);

            assertNotNull(resp);
            assertEquals("CANCELLED", resp.getStatus());
            assertEquals(Appointment.Status.CANCELLED, appt.getStatus());
            assertEquals("Co lich cong tac", appt.getCancellationReason());
            assertNotNull(appt.getCancelledAt());
            assertSame(account, appt.getCancelledByAccount());
            verify(appointmentRepository).save(appt);
        }

        @Test
        @DisplayName("4.4 Reschedule >24h notice: patient can reschedule appointment scheduled 48h away to available OPEN slot")
        void reschedule_moreThan24hNotice_succeeds() {
            LocalDateTime farFuture = LocalDateTime.now().plusHours(48);
            Appointment appt = buildAppointment(4L, Appointment.Status.BOOKED, farFuture);
            UserAccount account = new UserAccount(); account.setId(10L);

            HospitalStaff docStaff = new HospitalStaff();
            docStaff.setId(10L);
            docStaff.setFullName("BS Le Van Minh");
            WorkSchedule ws = new WorkSchedule();
            ws.setStaff(docStaff);

            AppointmentSlot newSlot = new AppointmentSlot();
            newSlot.setId(205L);
            newSlot.setStatus(AppointmentSlot.Status.OPEN);
            newSlot.setCapacity(5);
            newSlot.setStartsAt(farFuture.plusDays(1));
            newSlot.setEndsAt(farFuture.plusDays(1).plusMinutes(30));
            newSlot.setWorkSchedule(ws);

            when(appointmentRepository.lockById(4L)).thenReturn(Optional.of(appt));
            when(userAccountRepository.findById(10L)).thenReturn(Optional.of(account));
            when(appointmentSlotRepository.lockById(205L)).thenReturn(Optional.of(newSlot));
            when(appointmentRepository.countActiveBySlotId(205L)).thenReturn(1L);
            when(appointmentRepository.hasActivePatientInSlot(50L, 205L, 4L)).thenReturn(false);
            when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

            RescheduleRequest req = new RescheduleRequest();
            req.setNewAppointmentSlotId(205L);
            req.setReason("Doi gio kham");

            AppointmentResponse resp = service.rescheduleAppointment(4L, req, 10L, true);

            assertNotNull(resp);
            assertEquals(205L, appt.getAppointmentSlot().getId());
            assertNotNull(appt.getLastRescheduledAt());
            assertSame(account, appt.getLastRescheduledByAccount());
            verify(appointmentRepository).save(appt);
        }

        @Test
        @DisplayName("4.5 Receptionist bypass: staff (isPatient = false) can cancel appointment <24h away")
        void cancel_staffBypasses24hRule() {
            LocalDateTime nearFuture = LocalDateTime.now().plusHours(2); // Only 2h away
            Appointment appt = buildAppointment(5L, Appointment.Status.BOOKED, nearFuture);
            UserAccount staffAccount = new UserAccount(); staffAccount.setId(99L);

            when(appointmentRepository.lockById(5L)).thenReturn(Optional.of(appt));
            when(userAccountRepository.findById(99L)).thenReturn(Optional.of(staffAccount));
            when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

            CancelAppointmentRequest req = new CancelAppointmentRequest();
            req.setReason("Tiep tan ho tro huy theo yeu cau");

            AppointmentResponse resp = service.cancelAppointment(5L, req, 99L, false);

            assertEquals("CANCELLED", resp.getStatus());
            assertEquals(Appointment.Status.CANCELLED, appt.getStatus());
            verify(appointmentRepository).save(appt);
        }

        @Test
        @DisplayName("4.6 Receptionist bypass: staff (isPatient = false) can reschedule appointment <24h away")
        void reschedule_staffBypasses24hRule() {
            LocalDateTime nearFuture = LocalDateTime.now().plusHours(2);
            Appointment appt = buildAppointment(6L, Appointment.Status.BOOKED, nearFuture);
            UserAccount staffAccount = new UserAccount(); staffAccount.setId(99L);

            HospitalStaff docStaff = new HospitalStaff();
            docStaff.setId(10L);
            docStaff.setFullName("BS Le Van Minh");
            WorkSchedule ws = new WorkSchedule();
            ws.setStaff(docStaff);

            AppointmentSlot newSlot = new AppointmentSlot();
            newSlot.setId(206L);
            newSlot.setStatus(AppointmentSlot.Status.OPEN);
            newSlot.setCapacity(5);
            newSlot.setStartsAt(nearFuture.plusHours(4));
            newSlot.setEndsAt(nearFuture.plusHours(4).plusMinutes(30));
            newSlot.setWorkSchedule(ws);

            when(appointmentRepository.lockById(6L)).thenReturn(Optional.of(appt));
            when(userAccountRepository.findById(99L)).thenReturn(Optional.of(staffAccount));
            when(appointmentSlotRepository.lockById(206L)).thenReturn(Optional.of(newSlot));
            when(appointmentRepository.countActiveBySlotId(206L)).thenReturn(0L);
            when(appointmentRepository.hasActivePatientInSlot(50L, 206L, 6L)).thenReturn(false);
            when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

            RescheduleRequest req = new RescheduleRequest();
            req.setNewAppointmentSlotId(206L);
            req.setReason("Tiep tan doi gio");

            AppointmentResponse resp = service.rescheduleAppointment(6L, req, 99L, false);

            assertNotNull(resp);
            assertEquals(206L, appt.getAppointmentSlot().getId());
            verify(appointmentRepository).save(appt);
        }

        @Test
        @DisplayName("4.7 State Guard: cancel fails with INVALID_STATUS if appointment is CHECKED_IN")
        void cancel_failsIfCheckedIn() {
            Appointment appt = buildAppointment(7L, Appointment.Status.CHECKED_IN, LocalDateTime.now().plusHours(48));
            when(appointmentRepository.lockById(7L)).thenReturn(Optional.of(appt));

            CancelAppointmentRequest req = new CancelAppointmentRequest();
            req.setReason("Test");

            WorkflowException ex = assertThrows(WorkflowException.class, () ->
                    service.cancelAppointment(7L, req, 10L, true));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
            assertEquals("INVALID_STATUS", ex.getCode());
        }

        @Test
        @DisplayName("4.8 State Guard: cancel fails with INVALID_STATUS if appointment is CANCELLED")
        void cancel_failsIfAlreadyCancelled() {
            Appointment appt = buildAppointment(8L, Appointment.Status.CANCELLED, LocalDateTime.now().plusHours(48));
            when(appointmentRepository.lockById(8L)).thenReturn(Optional.of(appt));

            CancelAppointmentRequest req = new CancelAppointmentRequest();
            req.setReason("Test");

            WorkflowException ex = assertThrows(WorkflowException.class, () ->
                    service.cancelAppointment(8L, req, 10L, true));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
            assertEquals("INVALID_STATUS", ex.getCode());
        }

        @Test
        @DisplayName("4.9 State Guard: reschedule fails with INVALID_STATUS if appointment is CHECKED_IN")
        void reschedule_failsIfCheckedIn() {
            Appointment appt = buildAppointment(9L, Appointment.Status.CHECKED_IN, LocalDateTime.now().plusHours(48));
            when(appointmentRepository.lockById(9L)).thenReturn(Optional.of(appt));

            RescheduleRequest req = new RescheduleRequest();
            req.setNewAppointmentSlotId(300L);

            WorkflowException ex = assertThrows(WorkflowException.class, () ->
                    service.rescheduleAppointment(9L, req, 10L, true));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
            assertEquals("INVALID_STATUS", ex.getCode());
        }

        @Test
        @DisplayName("4.10 State Guard: reschedule fails with INVALID_STATUS if appointment is CANCELLED")
        void reschedule_failsIfAlreadyCancelled() {
            Appointment appt = buildAppointment(10L, Appointment.Status.CANCELLED, LocalDateTime.now().plusHours(48));
            when(appointmentRepository.lockById(10L)).thenReturn(Optional.of(appt));

            RescheduleRequest req = new RescheduleRequest();
            req.setNewAppointmentSlotId(300L);

            WorkflowException ex = assertThrows(WorkflowException.class, () ->
                    service.rescheduleAppointment(10L, req, 10L, true));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
            assertEquals("INVALID_STATUS", ex.getCode());
        }

        @Test
        @DisplayName("4.11 RescheduleRequest DTO integrity: binds newAppointmentSlotId and reason")
        void rescheduleRequest_dtoIntegrity() {
            RescheduleRequest req = new RescheduleRequest();
            req.setNewAppointmentSlotId(456L);
            req.setReason("Doi gio");

            assertEquals(456L, req.getNewAppointmentSlotId());
            assertEquals("Doi gio", req.getReason());
        }
    }
}
