package com.example.swd.service;

import com.example.swd.dto.request.ReceptionRequests.CreateAppointment;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.appointment.AppointmentSlot;
import com.example.swd.entity.encounter.Encounter;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.*;
import com.example.swd.security.StaffPrincipal;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReceptionAppointmentServiceTest {
    @Mock AppointmentRepository appointments;
    @Mock AppointmentSlotRepository slots;
    @Mock PatientRepository patients;
    @Mock DoctorProfileRepository doctors;
    @Mock HospitalStaffRepository staff;
    @Mock UserAccountRepository accounts;
    @Mock EntityManager em;
    @Mock TypedQuery<Encounter> query;
    ReceptionAppointmentService service;
    StaffPrincipal actor = new StaffPrincipal(10L, 20L, "reception", "Tiếp nhận", "RECEPTIONIST");

    @BeforeEach void setup() {
        service = new ReceptionAppointmentService(appointments, slots, patients, doctors, staff, accounts, em);
    }

    @Test void startRacePreventsUndoAndLeavesCheckInUntouched() {
        Appointment appointment = new Appointment(); appointment.setId(1L); appointment.setStatus(Appointment.Status.CHECKED_IN);
        when(appointments.lockById(1L)).thenReturn(Optional.of(appointment));
        when(em.createQuery(anyString(), eq(Encounter.class))).thenReturn(query);
        when(query.setParameter("id", 1L)).thenReturn(query);
        when(query.getResultStream()).thenReturn(Stream.of(new Encounter()));
        var error = assertThrows(WorkflowException.class, () -> service.undoCheckIn(actor, 1L));
        assertEquals("ENCOUNTER_STARTED", error.getCode());
        assertEquals(Appointment.Status.CHECKED_IN, appointment.getStatus());
        verify(appointments, never()).flush();
    }

    @Test void checkInRejectsAnotherVietnamDate() {
        AppointmentSlot slot = new AppointmentSlot();
        slot.setStartsAt(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(1).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime());
        Appointment appointment = new Appointment(); appointment.setId(1L); appointment.setAppointmentSlot(slot);
        when(appointments.lockById(1L)).thenReturn(Optional.of(appointment));
        when(em.createQuery(anyString(), eq(Encounter.class))).thenReturn(query);
        when(query.setParameter("id", 1L)).thenReturn(query);
        when(query.getResultStream()).thenReturn(Stream.empty());
        assertThrows(WorkflowException.class, () -> service.checkIn(actor, 1L));
        assertEquals(Appointment.Status.BOOKED, appointment.getStatus());
        assertNull(appointment.getCheckedInAt());
    }

    @Test void createRequiresExactlyOnePatientSourceBeforeWrites() {
        var input = new CreateAppointment(null, null, 1L, Appointment.BookingSource.WALK_IN, null, "one");
        var error = assertThrows(WorkflowException.class, () -> service.create(actor, input));
        assertTrue(error.getFieldErrors().containsKey("patientId"));
        verifyNoInteractions(accounts, appointments, slots, patients);
    }

    @Test void directServiceCallCannotImpersonateReceptionist() {
        var doctor = new StaffPrincipal(11L, 21L, "doctor", "Bác sĩ", "DOCTOR");
        assertThrows(WorkflowException.class, () -> service.checkIn(doctor, 1L));
        verifyNoInteractions(appointments);
    }
}
