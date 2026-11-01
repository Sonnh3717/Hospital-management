package com.example.swd.service;

import com.example.swd.dto.request.CancelAppointmentRequest;
import com.example.swd.dto.request.CreateAppointmentRequest;
import com.example.swd.dto.request.RescheduleRequest;
import com.example.swd.dto.request.UndoCheckInRequest;
import com.example.swd.dto.response.AppointmentResponse;
import com.example.swd.entity.appointment.AppointmentRule;
import com.example.swd.entity.appointment.AppointmentSlot;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Gender;
import com.example.swd.entity.identity.Role;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.scheduling.ShiftTemplate;
import com.example.swd.entity.scheduling.WorkSchedule;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class AppointmentWorkflowIntegrationTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AppointmentSlotRepository appointmentSlotRepository;

    @Autowired
    private AppointmentRuleRepository appointmentRuleRepository;

    @Autowired
    private WorkScheduleRepository workScheduleRepository;

    @Autowired
    private ShiftTemplateRepository shiftTemplateRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private HospitalStaffRepository hospitalStaffRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private RoleRepository roleRepository;

    private UserAccount patientAccount;
    private UserAccount staffAccount;
    private HospitalStaff doctorStaff;
    private HospitalStaff receptionistStaff;
    private Patient testPatient;
    private AppointmentSlot futureSlot;
    private AppointmentSlot secondSlot;

    @BeforeEach
    void setUp() {
        Role doctorRole = roleRepository.findByRoleCode(Role.RoleCode.DOCTOR)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setId((short) 3);
                    r.setRoleCode(Role.RoleCode.DOCTOR);
                    r.setRoleName("Doctor");
                    return roleRepository.save(r);
                });

        Role receptionRole = roleRepository.findByRoleCode(Role.RoleCode.RECEPTIONIST)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setId((short) 5);
                    r.setRoleCode(Role.RoleCode.RECEPTIONIST);
                    r.setRoleName("Receptionist");
                    return roleRepository.save(r);
                });

        Role patientRole = roleRepository.findByRoleCode(Role.RoleCode.PATIENT)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setId((short) 6);
                    r.setRoleCode(Role.RoleCode.PATIENT);
                    r.setRoleName("Patient");
                    return roleRepository.save(r);
                });

        // 1. Tạo tài khoản bác sĩ
        UserAccount docAcc = new UserAccount();
        docAcc.setUsername("doc.test." + System.nanoTime());
        docAcc.setLoginEmail(docAcc.getUsername() + "@test.vn");
        docAcc.setPasswordHash("$2a$10$dummyHashValueForTestingOnly1234567890123456789012");
        docAcc.setRole(doctorRole);
        docAcc.setStatus(ActiveStatus.ACTIVE);
        docAcc = userAccountRepository.save(docAcc);

        doctorStaff = new HospitalStaff();
        doctorStaff.setUserAccount(docAcc);
        doctorStaff.setStaffCode("DOC-" + System.nanoTime() % 100000);
        doctorStaff.setFullName("Bác sĩ Test");
        doctorStaff.setGender(Gender.MALE);
        doctorStaff.setEmploymentStatus(ActiveStatus.ACTIVE);
        doctorStaff = hospitalStaffRepository.save(doctorStaff);

        // 2. Tạo tài khoản tiếp tân
        staffAccount = new UserAccount();
        staffAccount.setUsername("rec.test." + System.nanoTime());
        staffAccount.setLoginEmail(staffAccount.getUsername() + "@test.vn");
        staffAccount.setPasswordHash("$2a$10$dummyHashValueForTestingOnly1234567890123456789012");
        staffAccount.setRole(receptionRole);
        staffAccount.setStatus(ActiveStatus.ACTIVE);
        staffAccount = userAccountRepository.save(staffAccount);

        receptionistStaff = new HospitalStaff();
        receptionistStaff.setUserAccount(staffAccount);
        receptionistStaff.setStaffCode("REC-" + System.nanoTime() % 100000);
        receptionistStaff.setFullName("Tiếp tân Test");
        receptionistStaff.setGender(Gender.FEMALE);
        receptionistStaff.setEmploymentStatus(ActiveStatus.ACTIVE);
        receptionistStaff = hospitalStaffRepository.save(receptionistStaff);

        // 3. Tạo tài khoản bệnh nhân
        patientAccount = new UserAccount();
        patientAccount.setUsername("pat.test." + System.nanoTime());
        patientAccount.setLoginEmail(patientAccount.getUsername() + "@test.vn");
        patientAccount.setPasswordHash("$2a$10$dummyHashValueForTestingOnly1234567890123456789012");
        patientAccount.setRole(patientRole);
        patientAccount.setStatus(ActiveStatus.ACTIVE);
        patientAccount = userAccountRepository.save(patientAccount);

        testPatient = new Patient();
        testPatient.setUserAccount(patientAccount);
        testPatient.setPatientCode("PAT-" + System.nanoTime() % 100000);
        testPatient.setFullName("Bệnh nhân Test");
        testPatient.setGender(Gender.FEMALE);
        testPatient.setDateOfBirth(LocalDate.of(1995, 5, 20));
        testPatient.setPhone("0987654321");
        testPatient = patientRepository.save(testPatient);

        // 4. Tạo ShiftTemplate
        ShiftTemplate shiftTemplate = new ShiftTemplate();
        shiftTemplate.setShiftCode("ST-" + System.nanoTime() % 10000);
        shiftTemplate.setShiftName("Ca Sáng Test");
        shiftTemplate.setStartTime(LocalTime.of(8, 0));
        shiftTemplate.setEndTime(LocalTime.of(12, 0));
        shiftTemplate.setIsActive(true);
        shiftTemplate = shiftTemplateRepository.save(shiftTemplate);

        // 5. Tạo ca làm việc & khung giờ khám (> 24h tới để test Hủy & Đổi)
        WorkSchedule ws = new WorkSchedule();
        ws.setStaff(doctorStaff);
        ws.setShiftTemplate(shiftTemplate);
        ws.setAssignedByStaff(doctorStaff);
        ws.setStartsAt(LocalDateTime.now().plusDays(2).with(LocalTime.of(8, 0)));
        ws.setEndsAt(LocalDateTime.now().plusDays(2).with(LocalTime.of(12, 0)));
        ws.setStatus(WorkSchedule.ScheduleStatus.SCHEDULED);
        ws = workScheduleRepository.save(ws);

        AppointmentRule rule = new AppointmentRule();
        rule.setRuleCode("RULE-" + System.nanoTime() % 10000);
        rule.setRuleName("Rule Test");
        rule.setSlotDurationMinutes(30);
        rule.setDefaultSlotCapacity(3);
        rule.setMinBookingNoticeMinutes(60L);
        rule.setMaxBookingDaysAhead(30);
        rule.setCancellationNoticeMinutes(1440L); // 24h
        rule.setRescheduleNoticeMinutes(1440L);   // 24h
        rule.setNoShowGraceMinutes(15);
        rule.setActive(true);
        rule.setUpdatedByStaff(doctorStaff);
        rule = appointmentRuleRepository.save(rule);

        futureSlot = new AppointmentSlot();
        futureSlot.setWorkSchedule(ws);
        futureSlot.setAppointmentRule(rule);
        futureSlot.setStartsAt(LocalDateTime.now().plusDays(2).with(LocalTime.of(8, 0)));
        futureSlot.setEndsAt(LocalDateTime.now().plusDays(2).with(LocalTime.of(8, 30)));
        futureSlot.setCapacity(2);
        futureSlot.setStatus(AppointmentSlot.Status.OPEN);
        futureSlot = appointmentSlotRepository.save(futureSlot);

        secondSlot = new AppointmentSlot();
        secondSlot.setWorkSchedule(ws);
        secondSlot.setAppointmentRule(rule);
        secondSlot.setStartsAt(LocalDateTime.now().plusDays(2).with(LocalTime.of(8, 30)));
        secondSlot.setEndsAt(LocalDateTime.now().plusDays(2).with(LocalTime.of(9, 0)));
        secondSlot.setCapacity(2);
        secondSlot.setStatus(AppointmentSlot.Status.OPEN);
        secondSlot = appointmentSlotRepository.save(secondSlot);
    }

    @Test
    @DisplayName("Test đặt lịch hẹn thành công với trạng thái khởi tạo BOOKED")
    void testCreateAppointment() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setAppointmentSlotId(futureSlot.getId());
        req.setPatientId(testPatient.getId());
        req.setReason("Khám mụn trứng cá");
        req.setBookingSource("ONLINE");

        AppointmentResponse resp = appointmentService.createAppointment(req, patientAccount.getId());
        assertNotNull(resp);
        assertEquals("BOOKED", resp.getStatus());
        assertEquals("Khám mụn trứng cá", resp.getReason());
        assertNotNull(resp.getAppointmentCode());
    }

    @Test
    @DisplayName("Test Tiếp đón Check-in và Hoàn tác Check-in")
    void testCheckInAndUndoCheckIn() {
        // Tạo cuộc hẹn
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setAppointmentSlotId(futureSlot.getId());
        req.setPatientId(testPatient.getId());
        req.setReason("Khám viêm da cơ địa");
        AppointmentResponse created = appointmentService.createAppointment(req, patientAccount.getId());

        // Tiếp tân Check-in
        AppointmentResponse checkedIn = appointmentService.checkIn(created.getId(), staffAccount.getId());
        assertEquals("CHECKED_IN", checkedIn.getStatus());
        assertNotNull(checkedIn.getCheckedInAt());
        assertEquals("Tiếp tân Test", checkedIn.getCheckedInByStaffName());

        // Tiếp tân Hoàn tác Check-in
        UndoCheckInRequest undoReq = new UndoCheckInRequest();
        undoReq.setReason("Tiếp tân bấm nhầm mã");
        AppointmentResponse undone = appointmentService.undoCheckIn(created.getId(), undoReq, staffAccount.getId());
        assertEquals("BOOKED", undone.getStatus());
        assertNotNull(undone.getLastCheckInReversedAt());
    }

    @Test
    @DisplayName("Test Hủy lịch hẹn thỏa mãn điều kiện >= 24h")
    void testCancelAppointmentSuccess() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setAppointmentSlotId(futureSlot.getId());
        req.setPatientId(testPatient.getId());
        req.setReason("Khám sẹo lồi");
        AppointmentResponse created = appointmentService.createAppointment(req, patientAccount.getId());

        CancelAppointmentRequest cancelReq = new CancelAppointmentRequest();
        cancelReq.setReason("Bận việc đột xuất");

        AppointmentResponse cancelled = appointmentService.cancelAppointment(created.getId(), cancelReq, patientAccount.getId(), true);
        assertEquals("CANCELLED", cancelled.getStatus());
        assertNotNull(cancelled.getCancelledAt());
        assertEquals("Bận việc đột xuất", cancelled.getCancellationReason());
    }

    @Test
    @DisplayName("Test Đổi lịch hẹn (Reschedule) sang khung giờ mới")
    void testRescheduleAppointmentSuccess() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setAppointmentSlotId(futureSlot.getId());
        req.setPatientId(testPatient.getId());
        req.setReason("Khám dị ứng da");
        AppointmentResponse created = appointmentService.createAppointment(req, patientAccount.getId());

        RescheduleRequest reschedReq = new RescheduleRequest();
        reschedReq.setNewAppointmentSlotId(secondSlot.getId());
        reschedReq.setReason("Muốn khám muộn hơn 30 phút");

        AppointmentResponse rescheduled = appointmentService.rescheduleAppointment(created.getId(), reschedReq, patientAccount.getId(), true);
        assertEquals("BOOKED", rescheduled.getStatus());
        assertEquals(secondSlot.getId(), rescheduled.getSlotId());
        assertNotNull(rescheduled.getLastRescheduledAt());
    }
}
