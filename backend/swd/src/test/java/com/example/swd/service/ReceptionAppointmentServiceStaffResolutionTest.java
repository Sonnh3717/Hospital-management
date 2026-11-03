package com.example.swd.service;

import com.example.swd.dto.response.WorkflowViews.AppointmentView;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.appointment.AppointmentRule;
import com.example.swd.entity.appointment.AppointmentSlot;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Gender;
import com.example.swd.entity.identity.Role;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.scheduling.WorkSchedule;
import com.example.swd.entity.staff.DoctorProfile;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.repository.*;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.impl.ReceptionAppointmentServiceImpl;
import com.example.swd.entity.encounter.Encounter;
import com.example.swd.exception.WorkflowException;
import org.springframework.http.HttpStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReceptionAppointmentServiceStaffResolutionTest {

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

    @Test
    void checkInResolvesStaffIdWhenActorStaffIdIsNull() {
        // Actor with staffId = null
        StaffPrincipal actor = new StaffPrincipal(100L, null, "receptionist", "Lễ Tân", "RECEPTIONIST", null);

        HospitalStaff receptionistStaff = new HospitalStaff();
        receptionistStaff.setId(88L);
        receptionistStaff.setFullName("Lễ Tân A");

        when(staff.findByUserAccount_Id(100L)).thenReturn(Optional.of(receptionistStaff));
        when(staff.getReferenceById(88L)).thenReturn(receptionistStaff);

        HospitalStaff docStaff = new HospitalStaff();
        docStaff.setId(20L);
        docStaff.setFullName("BS C");
        WorkSchedule sched = new WorkSchedule();
        sched.setStaff(docStaff);

        // StartsAt today in Vietnam time
        ZoneId vietnamZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime startsAtUtc = LocalDate.now(vietnamZone).atTime(9, 0).atZone(vietnamZone).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();

        AppointmentSlot slot = new AppointmentSlot();
        slot.setId(500L);
        slot.setStartsAt(startsAtUtc);
        slot.setEndsAt(startsAtUtc.plusMinutes(30));
        slot.setCapacity(5);
        slot.setWorkSchedule(sched);

        Patient patient = new Patient();
        patient.setId(10L);
        patient.setPatientCode("PT-010");
        patient.setFullName("Bệnh Nhân");
        patient.setGender(Gender.MALE);

        Appointment appt = new Appointment();
        appt.setId(999L);
        appt.setAppointmentCode("APPT-999");
        appt.setStatus(Appointment.Status.BOOKED);
        appt.setPatient(patient);
        appt.setAppointmentSlot(slot);
        appt.setBookingSource(Appointment.BookingSource.WALK_IN);

        DoctorProfile docProfile = new DoctorProfile();
        docProfile.setId(20L);
        docProfile.setStaff(docStaff);
        docProfile.setSpecialization("Nhi khoa");

        when(appointments.lockById(999L)).thenReturn(Optional.of(appt));
        when(doctors.findById(20L)).thenReturn(Optional.of(docProfile));
        when(em.createQuery(anyString(), eq(Encounter.class))).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultStream()).thenAnswer(inv -> Stream.empty());

        AppointmentView result = service.checkIn(actor, 999L);
        assertNotNull(result);
        assertEquals("CHECKED_IN", result.status());
        assertEquals(Appointment.Status.CHECKED_IN, appt.getStatus());
        assertSame(receptionistStaff, appt.getCheckedInByStaff());
        verify(appointments).flush();
    }

    private void mockNoEncounter() {
        when(em.createQuery(anyString(), eq(Encounter.class))).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultStream()).thenAnswer(inv -> Stream.empty());
    }

    private void mockDoctorProfile(Long staffId) {
        HospitalStaff docStaff = new HospitalStaff();
        docStaff.setId(staffId);
        docStaff.setFullName("BS " + staffId);
        docStaff.setEmploymentStatus(ActiveStatus.ACTIVE);
        UserAccount docAccount = new UserAccount();
        docAccount.setId(200L + staffId);
        docAccount.setStatus(ActiveStatus.ACTIVE);
        Role docRole = new Role();
        docRole.setRoleCode(Role.RoleCode.DOCTOR);
        docAccount.setRole(docRole);
        docStaff.setUserAccount(docAccount);

        DoctorProfile docProfile = new DoctorProfile();
        docProfile.setId(staffId);
        docProfile.setStaff(docStaff);
        docProfile.setIsActive(true);
        docProfile.setSpecialization("Đa khoa");

        when(doctors.findById(staffId)).thenReturn(Optional.of(docProfile));
    }

    private Appointment buildTodayAppointment(Long apptId, Appointment.Status status, Long docStaffId) {
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);

        HospitalStaff docStaff = new HospitalStaff();
        docStaff.setId(docStaffId);
        docStaff.setFullName("BS " + docStaffId);
        docStaff.setEmploymentStatus(ActiveStatus.ACTIVE);
        UserAccount docAccount = new UserAccount();
        docAccount.setId(200L + docStaffId);
        docAccount.setStatus(ActiveStatus.ACTIVE);
        Role docRole = new Role();
        docRole.setRoleCode(Role.RoleCode.DOCTOR);
        docAccount.setRole(docRole);
        docStaff.setUserAccount(docAccount);

        WorkSchedule sched = new WorkSchedule();
        sched.setId(300L);
        sched.setStaff(docStaff);
        sched.setStatus(WorkSchedule.ScheduleStatus.SCHEDULED);
        sched.setStartsAt(nowUtc.minusHours(2));
        sched.setEndsAt(nowUtc.plusHours(8));

        AppointmentRule rule = new AppointmentRule();
        rule.setId(1L);
        rule.setActive(true);
        rule.setCancellationNoticeMinutes(1440L);
        rule.setRescheduleNoticeMinutes(1440L);
        rule.setMinBookingNoticeMinutes(0L);
        rule.setMaxBookingDaysAhead(30);

        AppointmentSlot slot = new AppointmentSlot();
        slot.setId(500L);
        slot.setStatus(AppointmentSlot.Status.OPEN);
        slot.setStartsAt(nowUtc.plusMinutes(15));
        slot.setEndsAt(nowUtc.plusMinutes(45));
        slot.setCapacity(5);
        slot.setWorkSchedule(sched);
        slot.setAppointmentRule(rule);

        Patient patient = new Patient();
        patient.setId(10L);
        patient.setPatientCode("PT-010");
        patient.setFullName("Bệnh Nhân");
        patient.setGender(Gender.MALE);

        Appointment appt = new Appointment();
        appt.setId(apptId);
        appt.setAppointmentCode("APPT-" + apptId);
        appt.setStatus(status);
        appt.setPatient(patient);
        appt.setAppointmentSlot(slot);
        appt.setBookingSource(Appointment.BookingSource.WALK_IN);
        return appt;
    }

    @Test
    @DisplayName("Receptionist can cancel same-day appointment without 24-hour notice constraint")
    void cancel_sameDayAppointment_bypassesNoticeConstraint() {
        StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
        Appointment appt = buildTodayAppointment(801L, Appointment.Status.BOOKED, 25L);
        // Slot starts in 15 minutes, 24-hour notice is 1440 minutes
        appt.getAppointmentSlot().setStartsAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(15));
        appt.getAppointmentSlot().getAppointmentRule().setCancellationNoticeMinutes(1440L);

        when(appointments.lockById(801L)).thenReturn(Optional.of(appt));
        mockNoEncounter();
        UserAccount recAccount = new UserAccount();
        recAccount.setId(101L);
        when(accounts.getReferenceById(101L)).thenReturn(recAccount);
        mockDoctorProfile(25L);

        AppointmentView view = service.cancel(actor, 801L, "Bệnh nhân báo hủy tại quầy");
        assertNotNull(view);
        assertEquals("CANCELLED", view.status());
        assertEquals(Appointment.Status.CANCELLED, appt.getStatus());
        assertNotNull(appt.getCancelledAt());
        assertEquals("Bệnh nhân báo hủy tại quầy", appt.getCancellationReason());
        verify(appointments).flush();
    }

    @Test
    @DisplayName("Receptionist can reschedule same-day appointment without 24-hour notice constraint")
    void reschedule_sameDayAppointment_bypassesNoticeConstraint() {
        StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
        Appointment appt = buildTodayAppointment(802L, Appointment.Status.BOOKED, 25L);
        appt.getAppointmentSlot().setStartsAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(30));
        appt.getAppointmentSlot().setEndsAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(60));
        appt.getAppointmentSlot().getAppointmentRule().setRescheduleNoticeMinutes(1440L);

        AppointmentSlot destSlot = buildTodayAppointment(802L, Appointment.Status.BOOKED, 25L).getAppointmentSlot();
        destSlot.setId(905L);
        destSlot.setStartsAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(45));
        destSlot.setEndsAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(75));

        when(appointments.lockById(802L)).thenReturn(Optional.of(appt));
        mockNoEncounter();
        when(slots.lockById(905L)).thenReturn(Optional.of(destSlot));
        mockDoctorProfile(25L);
        when(appointments.countActiveBySlotId(905L)).thenReturn(1L);
        when(appointments.hasActivePatientInSlot(appt.getPatient().getId(), 905L, 802L)).thenReturn(false);
        UserAccount recAccount = new UserAccount();
        recAccount.setId(101L);
        when(accounts.getReferenceById(101L)).thenReturn(recAccount);

        AppointmentView view = service.reschedule(actor, 802L, 905L);
        assertNotNull(view);
        assertEquals(destSlot, appt.getAppointmentSlot());
        assertNotNull(appt.getLastRescheduledAt());
        verify(appointments).flush();
    }

    private void mockActiveEncounter() {
        Encounter activeEncounter = new Encounter();
        activeEncounter.setId(777L);
        when(em.createQuery(anyString(), eq(Encounter.class))).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultStream()).thenAnswer(inv -> Stream.of(activeEncounter));
    }

    @Test
    @DisplayName("Clinical encounter guard strictly blocks cancellation if encounter exists")
    void cancel_blocksWhenClinicalEncounterExists() {
        StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
        Appointment appt = buildTodayAppointment(803L, Appointment.Status.BOOKED, 25L);

        when(appointments.lockById(803L)).thenReturn(Optional.of(appt));
        mockActiveEncounter();

        WorkflowException ex = assertThrows(WorkflowException.class, () -> service.cancel(actor, 803L, "Hủy lịch"));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("ENCOUNTER_STARTED", ex.getCode());
        verify(appointments, never()).flush();
        assertEquals(Appointment.Status.BOOKED, appt.getStatus());
    }

    @Test
    @DisplayName("Clinical encounter guard strictly blocks rescheduling if encounter exists")
    void reschedule_blocksWhenClinicalEncounterExists() {
        StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
        Appointment appt = buildTodayAppointment(804L, Appointment.Status.BOOKED, 25L);

        when(appointments.lockById(804L)).thenReturn(Optional.of(appt));
        mockActiveEncounter();

        WorkflowException ex = assertThrows(WorkflowException.class, () -> service.reschedule(actor, 804L, 905L));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("ENCOUNTER_STARTED", ex.getCode());
        verify(appointments, never()).flush();
        assertEquals(Appointment.Status.BOOKED, appt.getStatus());
    }

    @Test
    @DisplayName("Clinical encounter guard strictly blocks undo-checkin if encounter exists")
    void undoCheckIn_blocksWhenClinicalEncounterExists() {
        StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
        Appointment appt = buildTodayAppointment(805L, Appointment.Status.CHECKED_IN, 25L);

        when(appointments.lockById(805L)).thenReturn(Optional.of(appt));
        mockActiveEncounter();

        WorkflowException ex = assertThrows(WorkflowException.class, () -> service.undoCheckIn(actor, 805L));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("ENCOUNTER_STARTED", ex.getCode());
        verify(appointments, never()).flush();
        assertEquals(Appointment.Status.CHECKED_IN, appt.getStatus());
    }

    @Test
    @DisplayName("Complete appointment lifecycle transitions: BOOKED -> CHECKED_IN -> undo check-in -> BOOKED")
    void fullLifecycleTransition_bookedToCheckedInToUndoCheckIn() {
        StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
        Appointment appt = buildTodayAppointment(806L, Appointment.Status.BOOKED, 25L);

        HospitalStaff recStaff = new HospitalStaff();
        recStaff.setId(55L);
        recStaff.setFullName("Le Tan 1");
        when(staff.getReferenceById(55L)).thenReturn(recStaff);
        when(appointments.lockById(806L)).thenReturn(Optional.of(appt));
        mockNoEncounter();
        mockDoctorProfile(25L);

        // 1. Transition BOOKED -> CHECKED_IN
        AppointmentView checkedInView = service.checkIn(actor, 806L);
        assertEquals("CHECKED_IN", checkedInView.status());
        assertEquals(Appointment.Status.CHECKED_IN, appt.getStatus());
        assertNotNull(appt.getCheckedInAt());
        assertSame(recStaff, appt.getCheckedInByStaff());

        // 2. Transition CHECKED_IN -> BOOKED via undoCheckIn
        AppointmentView undoneView = service.undoCheckIn(actor, 806L);
        assertEquals("BOOKED", undoneView.status());
        assertEquals(Appointment.Status.BOOKED, appt.getStatus());
        assertNull(appt.getCheckedInAt());
        assertNull(appt.getCheckedInByStaff());
        assertNotNull(appt.getLastCheckInReversedAt());
        assertSame(recStaff, appt.getLastCheckInReversedByStaff());
    }
}
