package com.example.swd.service;

import com.example.swd.dto.request.ClinicalCommands.*;
import com.example.swd.dto.request.CreateAppointmentRequest;
import com.example.swd.dto.response.AppointmentResponse;
import com.example.swd.dto.response.ClinicalViews.*;
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
import com.example.swd.entity.staff.DoctorProfile;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.*;
import com.example.swd.security.StaffPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class DoctorClinicalIntegrationTest {

    @Autowired
    private DoctorClinicalService clinicalService;

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
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private RoleRepository roleRepository;

    private StaffPrincipal doctorPrincipal;
    private UserAccount patientAccount;
    private HospitalStaff receptionistStaff;
    private Patient testPatient;
    private AppointmentSlot testSlot;

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

        // 1. Tạo tài khoản Bác sĩ & DoctorProfile
        UserAccount docAcc = new UserAccount();
        docAcc.setUsername("doc.clinical." + System.nanoTime());
        docAcc.setLoginEmail(docAcc.getUsername() + "@test.vn");
        docAcc.setPasswordHash("$2a$10$dummyHashValueForTestingOnly1234567890123456789012");
        docAcc.setRole(doctorRole);
        docAcc.setStatus(ActiveStatus.ACTIVE);
        docAcc = userAccountRepository.save(docAcc);

        HospitalStaff doctorStaff = new HospitalStaff();
        doctorStaff.setUserAccount(docAcc);
        doctorStaff.setStaffCode("DOC-" + System.nanoTime() % 100000);
        doctorStaff.setFullName("BS. Nguyễn Văn A");
        doctorStaff.setGender(Gender.MALE);
        doctorStaff.setEmploymentStatus(ActiveStatus.ACTIVE);
        doctorStaff = hospitalStaffRepository.save(doctorStaff);

        DoctorProfile docProfile = new DoctorProfile();
        docProfile.setStaff(doctorStaff);
        docProfile.setLicenseNumber("LIC-" + System.nanoTime() % 100000);
        docProfile.setSpecialization("Da liễu");
        doctorProfileRepository.save(docProfile);

        doctorPrincipal = new StaffPrincipal(docAcc.getId(), doctorStaff.getId(), docAcc.getUsername(),
                doctorStaff.getFullName(), "DOCTOR");

        // 2. Tiếp tân
        UserAccount recAcc = new UserAccount();
        recAcc.setUsername("rec.clinical." + System.nanoTime());
        recAcc.setLoginEmail(recAcc.getUsername() + "@test.vn");
        recAcc.setPasswordHash("$2a$10$dummyHashValueForTestingOnly1234567890123456789012");
        recAcc.setRole(receptionRole);
        recAcc.setStatus(ActiveStatus.ACTIVE);
        recAcc = userAccountRepository.save(recAcc);

        receptionistStaff = new HospitalStaff();
        receptionistStaff.setUserAccount(recAcc);
        receptionistStaff.setStaffCode("REC-" + System.nanoTime() % 100000);
        receptionistStaff.setFullName("Tiếp tân Clinical");
        receptionistStaff.setGender(Gender.FEMALE);
        receptionistStaff.setEmploymentStatus(ActiveStatus.ACTIVE);
        receptionistStaff = hospitalStaffRepository.save(receptionistStaff);

        // 3. Bệnh nhân
        patientAccount = new UserAccount();
        patientAccount.setUsername("pat.clinical." + System.nanoTime());
        patientAccount.setLoginEmail(patientAccount.getUsername() + "@test.vn");
        patientAccount.setPasswordHash("$2a$10$dummyHashValueForTestingOnly1234567890123456789012");
        patientAccount.setRole(patientRole);
        patientAccount.setStatus(ActiveStatus.ACTIVE);
        patientAccount = userAccountRepository.save(patientAccount);

        testPatient = new Patient();
        testPatient.setUserAccount(patientAccount);
        testPatient.setPatientCode("PAT-" + System.nanoTime() % 100000);
        testPatient.setFullName("Trần Thị B");
        testPatient.setGender(Gender.FEMALE);
        testPatient.setDateOfBirth(LocalDate.of(1998, 3, 15));
        testPatient.setPhone("0912345678");
        testPatient = patientRepository.save(testPatient);

        // 4. Lịch làm việc và khung giờ
        ShiftTemplate shift = new ShiftTemplate();
        shift.setShiftCode("ST-" + System.nanoTime() % 10000);
        shift.setShiftName("Ca Sáng");
        shift.setStartTime(LocalTime.of(8, 0));
        shift.setEndTime(LocalTime.of(12, 0));
        shift.setIsActive(true);
        shift = shiftTemplateRepository.save(shift);

        WorkSchedule ws = new WorkSchedule();
        ws.setStaff(doctorStaff);
        ws.setShiftTemplate(shift);
        ws.setAssignedByStaff(doctorStaff);
        ws.setStartsAt(LocalDateTime.now().plusDays(1).with(LocalTime.of(8, 0)));
        ws.setEndsAt(LocalDateTime.now().plusDays(1).with(LocalTime.of(12, 0)));
        ws.setStatus(WorkSchedule.ScheduleStatus.SCHEDULED);
        ws = workScheduleRepository.save(ws);

        AppointmentRule rule = new AppointmentRule();
        rule.setRuleCode("RULE-" + System.nanoTime() % 10000);
        rule.setRuleName("Rule Clinic");
        rule.setSlotDurationMinutes(30);
        rule.setDefaultSlotCapacity(3);
        rule.setMinBookingNoticeMinutes(60L);
        rule.setMaxBookingDaysAhead(30);
        rule.setCancellationNoticeMinutes(1440L);
        rule.setRescheduleNoticeMinutes(1440L);
        rule.setNoShowGraceMinutes(15);
        rule.setActive(true);
        rule.setUpdatedByStaff(doctorStaff);
        rule = appointmentRuleRepository.save(rule);

        testSlot = new AppointmentSlot();
        testSlot.setWorkSchedule(ws);
        testSlot.setAppointmentRule(rule);
        testSlot.setStartsAt(LocalDateTime.now().plusDays(1).with(LocalTime.of(8, 0)));
        testSlot.setEndsAt(LocalDateTime.now().plusDays(1).with(LocalTime.of(8, 30)));
        testSlot.setCapacity(2);
        testSlot.setStatus(AppointmentSlot.Status.OPEN);
        testSlot = appointmentSlotRepository.save(testSlot);
    }

    private Long createAndCheckInAppointment() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setAppointmentSlotId(testSlot.getId());
        req.setPatientId(testPatient.getId());
        req.setReason("Khám viêm da tiết bã");
        req.setBookingSource("ONLINE");

        AppointmentResponse appt = appointmentService.createAppointment(req, patientAccount.getId());
        // Tiếp tân check-in
        appointmentService.checkIn(appt.getId(), receptionistStaff.getUserAccount().getId());
        return appt.getId();
    }

    @Test
    @DisplayName("1. Bác sĩ khởi tạo Encounter khi lịch hẹn đã CHECKED_IN thành công")
    void testStartEncounter_Success() {
        Long apptId = createAndCheckInAppointment();

        StartView startView = clinicalService.start(doctorPrincipal, apptId);
        assertNotNull(startView);
        assertNotNull(startView.encounterId());

        EncounterView encounter = clinicalService.get(doctorPrincipal, startView.encounterId());
        assertEquals("IN_PROGRESS", encounter.status());
        assertEquals(apptId, encounter.appointmentId());
        assertEquals("Trần Thị B", encounter.patient().fullName());
    }

    @Test
    @DisplayName("2. Khởi tạo Encounter thất bại khi lịch hẹn chưa CHECKED_IN (mới chỉ BOOKED)")
    void testStartEncounter_NotCheckedIn_ThrowsConflict() {
        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setAppointmentSlotId(testSlot.getId());
        req.setPatientId(testPatient.getId());
        req.setReason("Khám viêm da");
        req.setBookingSource("ONLINE");

        AppointmentResponse appt = appointmentService.createAppointment(req, patientAccount.getId());

        WorkflowException ex = assertThrows(WorkflowException.class, () -> {
            clinicalService.start(doctorPrincipal, appt.getId());
        });
        assertEquals("NOT_CHECKED_IN", ex.getCode());
    }

    @Test
    @DisplayName("3. Kiểm tra danh sách Blockers khi cố gắng hoàn thành Encounter chưa đủ thông tin")
    void testCompleteEncounter_BlockedWhenIncomplete() {
        Long apptId = createAndCheckInAppointment();
        StartView startView = clinicalService.start(doctorPrincipal, apptId);
        Long encId = startView.encounterId();

        // Kiểm tra blockers trước khi nhập thông tin
        EncounterView current = clinicalService.get(doctorPrincipal, encId);
        assertFalse(current.completionBlockers().isEmpty());
        assertTrue(current.completionBlockers().stream().anyMatch(b -> b.contains("lý do khám")));
        assertTrue(current.completionBlockers().stream().anyMatch(b -> b.contains("chẩn đoán")));
        assertTrue(current.completionBlockers().stream().anyMatch(b -> b.contains("điều trị")));

        // Cố gắng gọi complete
        WorkflowException ex = assertThrows(WorkflowException.class, () -> {
            clinicalService.complete(doctorPrincipal, encId);
        });
        assertEquals("COMPLETION_BLOCKED", ex.getCode());
    }

    @Test
    @DisplayName("4. Hoàn thành toàn bộ vòng đời Encounter (Khám -> Chẩn đoán -> Điều trị -> Hoàn tất)")
    void testCompleteEncounter_FullLifecycle_Success() {
        Long apptId = createAndCheckInAppointment();
        StartView startView = clinicalService.start(doctorPrincipal, apptId);
        Long encId = startView.encounterId();

        // 1. Nhập kết quả khám và chẩn đoán ICD-10
        ExaminationInput examInput = new ExaminationInput(
                "Ngứa rát đỏ vùng cánh mũi và chân mày",
                "Bong vảy nhờn, ban đỏ ngứa",
                "Mảng đỏ giới hạn rõ kèm vảy da nhờn màu vàng",
                "Tiền sử căng thẳng thần kinh kéo dài",
                List.of(new DiagnosisInput(null, "L21.0", "Viêm da tiết bã ở da đầu và mặt (Seborrhoeic dermatitis)", true))
        );
        EncounterView afterExam = clinicalService.examination(doctorPrincipal, encId, examInput);
        assertNotNull(afterExam);
        assertEquals(1, afterExam.diagnoses().size());
        assertEquals("L21.0", afterExam.diagnoses().get(0).diagnosisCode());

        // 2. Nhập phác đồ điều trị và dặn dò
        TreatmentInput treatInput = new TreatmentInput(
                "Kem bôi Ketoconazole 2% 2 lần/ngày trong 2 tuần, kết hợp kem dưỡng ẩm phục hồi phục B5",
                "Vệ sinh mặt bằng nước ấm, tránh cào gãi, ngủ đủ giấc",
                false,
                null
        );
        EncounterView afterTreatment = clinicalService.treatment(doctorPrincipal, encId, treatInput);
        assertNotNull(afterTreatment.treatment());
        assertEquals("Kem bôi Ketoconazole 2% 2 lần/ngày trong 2 tuần, kết hợp kem dưỡng ẩm phục hồi phục B5",
                afterTreatment.treatment().decisionText());

        // 3. Hoàn tất Encounter
        EncounterView completed = clinicalService.complete(doctorPrincipal, encId);
        assertEquals("COMPLETED", completed.status());
        assertNotNull(completed.completedAt());
        assertTrue(completed.completionBlockers().isEmpty());
    }
}
