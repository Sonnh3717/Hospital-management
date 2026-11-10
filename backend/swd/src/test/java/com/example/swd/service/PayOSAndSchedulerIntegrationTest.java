package com.example.swd.service;
import com.example.swd.config.PayOSService;

import com.example.swd.entity.appointment.Appointment;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class PayOSAndSchedulerIntegrationTest {

    @Autowired
    private PayOSService payOSService;

    @Autowired
    private AppointmentSchedulerService appointmentSchedulerService;

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

    @Test
    @DisplayName("Test tạo link thanh toán payOS và xử lý webhook thành công")
    void testPayOSCreateAndWebhook() {
        Role patientRole = roleRepository.findByRoleCode(Role.RoleCode.PATIENT)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setId((short) 6);
                    r.setRoleCode(Role.RoleCode.PATIENT);
                    r.setRoleName("Patient");
                    return roleRepository.save(r);
                });

        UserAccount acc = new UserAccount();
        acc.setUsername("payos.test." + System.nanoTime());
        acc.setLoginEmail(acc.getUsername() + "@test.vn");
        acc.setPasswordHash("$2a$10$dummyHashValueForTestingOnly1234567890123456789012");
        acc.setRole(patientRole);
        acc.setStatus(ActiveStatus.ACTIVE);
        acc = userAccountRepository.save(acc);

        Patient patient = new Patient();
        patient.setUserAccount(acc);
        patient.setPatientCode("PAT-P-" + System.nanoTime() % 10000);
        patient.setFullName("Bệnh nhân PayOS");
        patient.setGender(Gender.FEMALE);
        patient = patientRepository.save(patient);

        Appointment appt = new Appointment();
        appt.setAppointmentCode("APPT-PAYOS-" + System.nanoTime() % 10000);
        appt.setPatient(patient);
        appt.setBookingSource(Appointment.BookingSource.ONLINE);
        appt.setStatus(Appointment.Status.BOOKED);
        appt.setCreatedByAccount(acc);

        // Tạo link thanh toán
        var checkout = payOSService.createPaymentLink(appt, BigDecimal.valueOf(280000), acc);
        assertNotNull(checkout);
        assertEquals(BigDecimal.valueOf(280000), checkout.getAmount());
        assertNotNull(checkout.getCheckoutUrl());
        assertNotNull(checkout.getQrCodeText());

        // Mô phỏng webhook từ payOS
        Map<String, Object> webhookData = Map.of(
                "code", "00",
                "desc", "success",
                "data", Map.of(
                        "orderCode", checkout.getOrderCode(),
                        "amount", 280000,
                        "description", "Thanh toan lich hen",
                        "accountNumber", "0987654321",
                        "reference", "FT123456"
                )
        );

        boolean processed = payOSService.processWebhook(webhookData);
        assertTrue(processed);
    }

    @Test
    @DisplayName("Test Cron Job quét NO_SHOW cho ca làm việc đã kết thúc")
    void testSchedulerNoShow() {
        Role doctorRole = roleRepository.findByRoleCode(Role.RoleCode.DOCTOR)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setId((short) 3);
                    r.setRoleCode(Role.RoleCode.DOCTOR);
                    r.setRoleName("Doctor");
                    return roleRepository.save(r);
                });

        UserAccount docAcc = new UserAccount();
        docAcc.setUsername("doc.sched." + System.nanoTime());
        docAcc.setLoginEmail(docAcc.getUsername() + "@test.vn");
        docAcc.setPasswordHash("$2a$10$dummyHashValueForTestingOnly1234567890123456789012");
        docAcc.setRole(doctorRole);
        docAcc.setStatus(ActiveStatus.ACTIVE);
        docAcc = userAccountRepository.save(docAcc);

        HospitalStaff docStaff = new HospitalStaff();
        docStaff.setUserAccount(docAcc);
        docStaff.setStaffCode("DOC-SCHED-" + System.nanoTime() % 10000);
        docStaff.setFullName("Bác sĩ Ca Trực");
        docStaff.setGender(Gender.MALE);
        docStaff.setEmploymentStatus(ActiveStatus.ACTIVE);
        docStaff = hospitalStaffRepository.save(docStaff);

        ShiftTemplate shiftTemplate = new ShiftTemplate();
        shiftTemplate.setShiftCode("ST-PAST-" + System.nanoTime() % 10000);
        shiftTemplate.setShiftName("Ca Đã Qua");
        shiftTemplate.setStartTime(LocalTime.of(8, 0));
        shiftTemplate.setEndTime(LocalTime.of(12, 0));
        shiftTemplate.setIsActive(true);
        shiftTemplate = shiftTemplateRepository.save(shiftTemplate);

        // Ca làm việc đã kết thúc trong quá khứ (hôm qua)
        WorkSchedule pastWs = new WorkSchedule();
        pastWs.setStaff(docStaff);
        pastWs.setShiftTemplate(shiftTemplate);
        pastWs.setAssignedByStaff(docStaff);
        pastWs.setStartsAt(LocalDateTime.now().minusDays(1).with(LocalTime.of(8, 0)));
        pastWs.setEndsAt(LocalDateTime.now().minusDays(1).with(LocalTime.of(12, 0)));
        pastWs.setStatus(WorkSchedule.ScheduleStatus.SCHEDULED);
        pastWs = workScheduleRepository.save(pastWs);

        AppointmentRule rule = new AppointmentRule();
        rule.setRuleCode("RULE-PAST-" + System.nanoTime() % 10000);
        rule.setRuleName("Rule Test");
        rule.setSlotDurationMinutes(30);
        rule.setDefaultSlotCapacity(3);
        rule.setMinBookingNoticeMinutes(60L);
        rule.setMaxBookingDaysAhead(30);
        rule.setCancellationNoticeMinutes(1440L);
        rule.setRescheduleNoticeMinutes(1440L);
        rule.setNoShowGraceMinutes(15);
        rule.setActive(true);
        rule.setUpdatedByStaff(docStaff);
        rule = appointmentRuleRepository.save(rule);

        AppointmentSlot pastSlot = new AppointmentSlot();
        pastSlot.setWorkSchedule(pastWs);
        pastSlot.setAppointmentRule(rule);
        pastSlot.setStartsAt(LocalDateTime.now().minusDays(1).with(LocalTime.of(8, 0)));
        pastSlot.setEndsAt(LocalDateTime.now().minusDays(1).with(LocalTime.of(8, 30)));
        pastSlot.setCapacity(2);
        pastSlot.setStatus(AppointmentSlot.Status.OPEN);
        pastSlot = appointmentSlotRepository.save(pastSlot);

        Patient patient = new Patient();
        patient.setUserAccount(docAcc);
        patient.setPatientCode("PAT-PAST-" + System.nanoTime() % 10000);
        patient.setFullName("Bệnh nhân Quá Ca");
        patient.setGender(Gender.MALE);
        patient = patientRepository.save(patient);

        Appointment pastAppt = new Appointment();
        pastAppt.setAppointmentCode("APPT-PAST-" + System.nanoTime() % 10000);
        pastAppt.setPatient(patient);
        pastAppt.setAppointmentSlot(pastSlot);
        pastAppt.setBookingSource(Appointment.BookingSource.ONLINE);
        pastAppt.setStatus(Appointment.Status.BOOKED);
        pastAppt.setCreatedByAccount(docAcc);
        pastAppt = appointmentRepository.save(pastAppt);

        // Chạy cron scheduler
        int count = appointmentSchedulerService.scanAndMarkNoShow();
        assertTrue(count >= 1);

        Appointment refreshed = appointmentRepository.findById(pastAppt.getId()).orElseThrow();
        assertEquals(Appointment.Status.NO_SHOW, refreshed.getStatus());
        assertNotNull(refreshed.getNoShowMarkedAt());
    }
}

