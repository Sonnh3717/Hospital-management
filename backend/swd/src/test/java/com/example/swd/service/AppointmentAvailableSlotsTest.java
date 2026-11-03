package com.example.swd.service;

import com.example.swd.dto.response.WorkflowViews.SlotView;
import com.example.swd.entity.appointment.AppointmentSlot;
import com.example.swd.entity.scheduling.WorkSchedule;
import com.example.swd.entity.staff.DoctorProfile;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.repository.*;
import com.example.swd.service.impl.AppointmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentAvailableSlotsTest {

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

    @Test
    void getAvailableSlotsReturnsOpenSlotsWithRemainingCapacity() {
        HospitalStaff docStaff = new HospitalStaff();
        docStaff.setId(10L);
        docStaff.setFullName("Bác sĩ Nguyễn Văn Minh");

        WorkSchedule schedule = new WorkSchedule();
        schedule.setStaff(docStaff);

        LocalDateTime futureStart = LocalDateTime.now(ZoneOffset.UTC).plusHours(2);
        LocalDateTime futureEnd = futureStart.plusMinutes(30);

        AppointmentSlot slot1 = new AppointmentSlot();
        slot1.setId(100L);
        slot1.setStatus(AppointmentSlot.Status.OPEN);
        slot1.setStartsAt(futureStart);
        slot1.setEndsAt(futureEnd);
        slot1.setCapacity(5);
        slot1.setWorkSchedule(schedule);

        DoctorProfile profile = new DoctorProfile();
        profile.setId(10L);
        profile.setStaff(docStaff);
        profile.setSpecialization("Da liễu");

        when(appointmentSlotRepository.findForDate(any(), any())).thenReturn(List.of(slot1));
        when(appointmentRepository.countActiveBySlotId(100L)).thenReturn(2L);
        when(doctorProfileRepository.findById(10L)).thenReturn(Optional.of(profile));

        List<SlotView> available = service.getAvailableSlots(LocalDate.now(), null);
        assertNotNull(available);
        assertEquals(1, available.size());
        assertEquals(100L, available.get(0).id());
        assertEquals(3, available.get(0).remaining());
        assertEquals("Bác sĩ Nguyễn Văn Minh", available.get(0).doctorName());
        assertEquals("Da liễu", available.get(0).specialization());
    }

    @Test
    void getAvailableSlotsExcludesFullSlots() {
        HospitalStaff docStaff = new HospitalStaff();
        docStaff.setId(10L);
        WorkSchedule schedule = new WorkSchedule();
        schedule.setStaff(docStaff);

        LocalDateTime futureStart = LocalDateTime.now(ZoneOffset.UTC).plusHours(2);
        LocalDateTime futureEnd = futureStart.plusMinutes(30);

        AppointmentSlot slotFull = new AppointmentSlot();
        slotFull.setId(101L);
        slotFull.setStatus(AppointmentSlot.Status.OPEN);
        slotFull.setStartsAt(futureStart);
        slotFull.setEndsAt(futureEnd);
        slotFull.setCapacity(3);
        slotFull.setWorkSchedule(schedule);

        when(appointmentSlotRepository.findForDate(any(), any())).thenReturn(List.of(slotFull));
        when(appointmentRepository.countActiveBySlotId(101L)).thenReturn(3L);

        List<SlotView> available = service.getAvailableSlots(LocalDate.now(), null);
        assertTrue(available.isEmpty());
    }

    @Test
    void getAvailableSlotsFiltersByDoctorId() {
        HospitalStaff doc1 = new HospitalStaff(); doc1.setId(10L); doc1.setFullName("BS A");
        HospitalStaff doc2 = new HospitalStaff(); doc2.setId(20L); doc2.setFullName("BS B");
        WorkSchedule sched1 = new WorkSchedule(); sched1.setStaff(doc1);
        WorkSchedule sched2 = new WorkSchedule(); sched2.setStaff(doc2);

        LocalDateTime futureStart = LocalDateTime.now(ZoneOffset.UTC).plusHours(2);
        LocalDateTime futureEnd = futureStart.plusMinutes(30);

        AppointmentSlot slotDoc1 = new AppointmentSlot();
        slotDoc1.setId(102L); slotDoc1.setStatus(AppointmentSlot.Status.OPEN);
        slotDoc1.setStartsAt(futureStart); slotDoc1.setEndsAt(futureEnd);
        slotDoc1.setCapacity(5); slotDoc1.setWorkSchedule(sched1);

        AppointmentSlot slotDoc2 = new AppointmentSlot();
        slotDoc2.setId(103L); slotDoc2.setStatus(AppointmentSlot.Status.OPEN);
        slotDoc2.setStartsAt(futureStart); slotDoc2.setEndsAt(futureEnd);
        slotDoc2.setCapacity(5); slotDoc2.setWorkSchedule(sched2);

        when(appointmentSlotRepository.findForDate(any(), any())).thenReturn(List.of(slotDoc1, slotDoc2));
        when(appointmentRepository.countActiveBySlotId(102L)).thenReturn(0L);
        when(doctorProfileRepository.findById(10L)).thenReturn(Optional.empty());

        List<SlotView> available = service.getAvailableSlots(LocalDate.now(), 10L);
        assertEquals(1, available.size());
        assertEquals(102L, available.get(0).id());
        assertEquals("BS A", available.get(0).doctorName());
    }
}
