package com.example.swd.service;

import com.example.swd.dto.request.ReceptionRequests.CreateAppointment;
import com.example.swd.dto.request.ReceptionRequests.NewPatient;
import com.example.swd.dto.response.WorkflowViews.AppointmentView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.dto.response.WorkflowViews.PatientView;
import com.example.swd.dto.response.WorkflowViews.ReceptionOptions;
import com.example.swd.dto.response.WorkflowViews.SlotView;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.appointment.AppointmentSlot;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Gender;
import com.example.swd.entity.encounter.Encounter;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.scheduling.WorkSchedule;
import com.example.swd.entity.staff.DoctorProfile;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.AppointmentRepository;
import com.example.swd.repository.AppointmentSlotRepository;
import com.example.swd.repository.DoctorProfileRepository;
import com.example.swd.repository.HospitalStaffRepository;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.UserAccountRepository;
import com.example.swd.security.StaffPrincipal;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.Predicate;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReceptionAppointmentService {
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private final AppointmentRepository appointments;
    private final AppointmentSlotRepository slots;
    private final PatientRepository patients;
    private final DoctorProfileRepository doctors;
    private final HospitalStaffRepository staff;
    private final UserAccountRepository accounts;
    private final EntityManager em;

    public ReceptionAppointmentService(AppointmentRepository appointments, AppointmentSlotRepository slots,
                                       PatientRepository patients, DoctorProfileRepository doctors,
                                       HospitalStaffRepository staff, UserAccountRepository accounts, EntityManager em) {
        this.appointments = appointments;
        this.slots = slots;
        this.patients = patients;
        this.doctors = doctors;
        this.staff = staff;
        this.accounts = accounts;
        this.em = em;
    }

    public PageView<AppointmentView> list(StaffPrincipal actor, LocalDate date, Long doctorId,
                                          Appointment.Status status, String search, int page, int size) {
        receptionist(actor);
        if (page < 0 || size < 1 || size > 100) throw invalid("page", "Phân trang không hợp lệ; số dòng từ 1 đến 100.");
        var day = date == null ? today() : date;
        var from = utcStart(day);
        var to = utcStart(day.plusDays(1));
        String keyword = normalize(search);
        var result = appointments.findAll((root, query, cb) -> {
            var conditions = new ArrayList<Predicate>();
            conditions.add(cb.greaterThanOrEqualTo(root.get("appointmentSlot").get("startsAt"), from));
            conditions.add(cb.lessThan(root.get("appointmentSlot").get("startsAt"), to));
            if (doctorId != null) conditions.add(cb.equal(root.get("appointmentSlot").get("workSchedule").get("staff").get("id"), doctorId));
            if (status != null) conditions.add(cb.equal(root.get("status"), status));
            if (keyword != null) {
                String pattern = "%" + escapeLike(keyword.toLowerCase(java.util.Locale.ROOT)) + "%";
                var p = root.get("patient");
                conditions.add(cb.or(cb.like(cb.lower(root.get("appointmentCode")), pattern, '\\'),
                        cb.like(cb.lower(p.get("patientCode")), pattern, '\\'),
                        cb.like(cb.lower(p.get("fullName")), pattern, '\\'),
                        cb.like(cb.lower(p.get("phone")), pattern, '\\')));
            }
            return cb.and(conditions.toArray(Predicate[]::new));
        }, PageRequest.of(page, size, Sort.by("appointmentSlot.startsAt").ascending().and(Sort.by("id"))));
        return new PageView<>(result.getContent().stream().map(this::view).toList(), result.getTotalElements(), page, size);
    }

    public AppointmentView detail(StaffPrincipal actor, Long id) {
        receptionist(actor);
        return view(appointments.findById(id).orElseThrow(() -> missing("Lịch hẹn")));
    }

    public ReceptionOptions options(StaffPrincipal actor, LocalDate date) {
        receptionist(actor);
        var day = date == null ? today() : date;
        var doctorViews = new LinkedHashMap<Long, com.example.swd.dto.response.WorkflowViews.DoctorView>();
        List<SlotView> available = new ArrayList<>();
        for (AppointmentSlot slot : slots.findForDate(utcStart(day), utcStart(day.plusDays(1)))) {
            var profile = doctors.findById(slot.getWorkSchedule().getStaff().getId());
            if (profile.isEmpty()) continue;
            DoctorProfile doctor = profile.get();
            if (!isUsable(slot, doctor) || !slot.getEndsAt().isAfter(now())) continue;
            int remaining = Math.max(0, slot.getCapacity() - (int) appointments.countActiveBySlotId(slot.getId()));
            available.add(WorkflowMapper.slot(slot, doctor, remaining));
            doctorViews.putIfAbsent(doctor.getId(), WorkflowMapper.doctor(doctor));
        }
        return new ReceptionOptions(List.copyOf(doctorViews.values()), available);
    }

    public List<PatientView> searchPatients(StaffPrincipal actor, String search) {
        receptionist(actor);
        String keyword = normalize(search);
        if (keyword == null) return List.of();
        String pattern = "%" + escapeLike(keyword.toLowerCase(java.util.Locale.ROOT)) + "%";
        return patients.findAll((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("patientCode")), pattern, '\\'),
                cb.like(cb.lower(root.get("fullName")), pattern, '\\'),
                cb.like(cb.lower(root.get("phone")), pattern, '\\')),
                PageRequest.of(0, 30, Sort.by("fullName"))).getContent().stream().map(WorkflowMapper::patient).toList();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AppointmentView create(StaffPrincipal actor, CreateAppointment input) {
        receptionist(actor);
        if ((input.patientId() == null) == (input.patient() == null)) {
            throw invalid("patientId", "Chọn một hồ sơ bệnh nhân hoặc nhập thông tin bệnh nhân mới.");
        }
        if (input.bookingSource() == Appointment.BookingSource.ONLINE) throw invalid("bookingSource", "Chọn đặt lịch hỗ trợ hoặc walk-in.");
        // Serialize retries for the same account before looking up the unique code.
        var creator = accounts.lockById(actor.accountId()).orElseThrow(() -> missing("Tài khoản"));
        String code = appointmentCode(actor.accountId(), input.idempotencyKey());
        var existing = appointments.findByAppointmentCode(code);
        if (existing.isPresent()) {
            if (!sameCreation(existing.get(), input)) {
                throw new WorkflowException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED", "Mã gửi yêu cầu đã được dùng cho thông tin khác.");
            }
            return view(existing.get());
        }
        AppointmentSlot slot = slots.lockById(input.slotId()).orElseThrow(() -> missing("Khung giờ"));
        validateSlot(slot, input.bookingSource());
        ensureCapacity(slot);
        Patient patient;
        if (input.patientId() != null) {
            patient = patients.findById(input.patientId()).orElseThrow(() -> missing("Bệnh nhân"));
            ensurePatientSlot(patient.getId(), slot.getId(), null);
        } else {
            patient = newPatient(input.patient());
            patients.saveAndFlush(patient);
        }
        Appointment appointment = new Appointment();
        appointment.setAppointmentCode(code);
        appointment.setPatient(patient);
        appointment.setAppointmentSlot(slot);
        appointment.setBookingSource(input.bookingSource());
        appointment.setCreatedByAccount(creator);
        appointment.setReason(normalize(input.reason()));
        appointments.saveAndFlush(appointment);
        return view(appointment);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AppointmentView checkIn(StaffPrincipal actor, Long id) {
        Appointment appointment = locked(actor, id);
        if (appointment.getStatus() == Appointment.Status.CHECKED_IN) return view(appointment);
        requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể check-in lại.");
        if (appointment.getStatus() != Appointment.Status.BOOKED) throw state("Chỉ lịch đã đặt mới được check-in.");
        if (!appointment.getAppointmentSlot().getStartsAt().atOffset(ZoneOffset.UTC).atZoneSameInstant(VIETNAM).toLocalDate().equals(today())) {
            throw state("Chỉ check-in lịch hẹn thuộc ngày tiếp nhận hôm nay.");
        }
        appointment.setStatus(Appointment.Status.CHECKED_IN);
        appointment.setCheckedInAt(now());
        appointment.setCheckedInByStaff(staff.getReferenceById(actor.staffId()));
        appointments.flush();
        return view(appointment);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AppointmentView undoCheckIn(StaffPrincipal actor, Long id) {
        Appointment appointment = locked(actor, id);
        requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể hoàn tác check-in.");
        if (appointment.getStatus() == Appointment.Status.BOOKED) return view(appointment);
        if (appointment.getStatus() != Appointment.Status.CHECKED_IN) throw state("Lịch hẹn chưa check-in hoặc đã kết thúc.");
        appointment.setStatus(Appointment.Status.BOOKED);
        clearCheckIn(appointment);
        appointment.setLastCheckInReversedAt(now());
        appointment.setLastCheckInReversedByStaff(staff.getReferenceById(actor.staffId()));
        appointments.flush();
        return view(appointment);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AppointmentView cancel(StaffPrincipal actor, Long id, String reason) {
        Appointment appointment = locked(actor, id);
        if (appointment.getStatus() == Appointment.Status.CANCELLED) return view(appointment);
        requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể hủy lịch.");
        if (appointment.getStatus() != Appointment.Status.BOOKED && appointment.getStatus() != Appointment.Status.CHECKED_IN) {
            throw state("Lịch hẹn không còn được phép hủy.");
        }
        requireNotice(appointment, appointment.getAppointmentSlot().getAppointmentRule().getCancellationNoticeMinutes(), "hủy lịch");
        appointment.setStatus(Appointment.Status.CANCELLED);
        clearCheckIn(appointment);
        appointment.setCancelledAt(now());
        appointment.setCancelledByAccount(accounts.getReferenceById(actor.accountId()));
        appointment.setCancellationReason(normalize(reason));
        appointments.flush();
        return view(appointment);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AppointmentView reschedule(StaffPrincipal actor, Long id, Long destinationId) {
        Appointment appointment = locked(actor, id);
        requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể đổi lịch.");
        if (appointment.getStatus() != Appointment.Status.BOOKED) throw state("Hoàn tác check-in trước khi đổi lịch.");
        if (appointment.getAppointmentSlot().getId().equals(destinationId)) return view(appointment);
        requireNotice(appointment, appointment.getAppointmentSlot().getAppointmentRule().getRescheduleNoticeMinutes(), "đổi lịch");
        AppointmentSlot destination = slots.lockById(destinationId).orElseThrow(() -> missing("Khung giờ"));
        validateSlot(destination, appointment.getBookingSource());
        ensureCapacity(destination);
        ensurePatientSlot(appointment.getPatient().getId(), destinationId, id);
        appointment.setAppointmentSlot(destination);
        appointment.setLastRescheduledAt(now());
        appointment.setLastRescheduledByAccount(accounts.getReferenceById(actor.accountId()));
        appointments.flush();
        return view(appointment);
    }

    private Appointment locked(StaffPrincipal actor, Long id) {
        receptionist(actor);
        return appointments.lockById(id).orElseThrow(() -> missing("Lịch hẹn"));
    }

    private AppointmentView view(Appointment appointment) {
        AppointmentSlot slot = appointment.getAppointmentSlot();
        DoctorProfile doctor = doctorFor(slot);
        Encounter encounter = encounter(appointment.getId());
        return new AppointmentView(appointment.getId(), appointment.getAppointmentCode(), WorkflowMapper.patient(appointment.getPatient()),
                WorkflowMapper.doctor(doctor), WorkflowMapper.slot(slot, doctor, slot.getCapacity() - (int) appointments.countActiveBySlotId(slot.getId())),
                appointment.getBookingSource().name(), appointment.getStatus().name(), appointment.getReason(), appointment.getNote(),
                WorkflowMapper.timestamp(appointment.getCheckedInAt()), encounter == null ? null : encounter.getId(), encounter == null ? null : encounter.getStatus().name());
    }

    private Encounter encounter(Long appointmentId) {
        return em.createQuery("select e from Encounter e where e.appointment.id = :id", Encounter.class)
                .setParameter("id", appointmentId).getResultStream().findFirst().orElse(null);
    }

    private void requireNoEncounter(Appointment appointment, String message) {
        if (encounter(appointment.getId()) != null) throw new WorkflowException(HttpStatus.CONFLICT, "ENCOUNTER_STARTED", message);
    }

    private DoctorProfile doctorFor(AppointmentSlot slot) {
        return doctors.findById(slot.getWorkSchedule().getStaff().getId()).orElseThrow(() -> missing("Bác sĩ của khung giờ"));
    }

    private boolean isUsable(AppointmentSlot slot, DoctorProfile doctor) {
        return slot.getStatus() == AppointmentSlot.Status.OPEN && Boolean.TRUE.equals(slot.getAppointmentRule().getActive())
                && slot.getWorkSchedule().getStatus() == WorkSchedule.ScheduleStatus.SCHEDULED
                && Boolean.TRUE.equals(doctor.getIsActive()) && doctor.getStaff().getEmploymentStatus() == ActiveStatus.ACTIVE
                && doctor.getStaff().getUserAccount().getStatus() == ActiveStatus.ACTIVE
                && doctor.getStaff().getUserAccount().getRole().getRoleCode().name().equals("DOCTOR");
    }

    private void validateSlot(AppointmentSlot slot, Appointment.BookingSource source) {
        if (!isUsable(slot, doctorFor(slot))) throw invalid("slotId", "Khung giờ hoặc bác sĩ hiện không nhận lịch.");
        LocalDateTime instant = now();
        if (!slot.getEndsAt().isAfter(instant)) throw invalid("slotId", "Khung giờ đã kết thúc.");
        LocalDate slotDate = slot.getStartsAt().atOffset(ZoneOffset.UTC).atZoneSameInstant(VIETNAM).toLocalDate();
        if (source == Appointment.BookingSource.WALK_IN) {
            if (!slotDate.equals(today())) throw invalid("slotId", "Walk-in chỉ nhận khung giờ hôm nay.");
        } else {
            var rule = slot.getAppointmentRule();
            if (slot.getStartsAt().isBefore(instant.plusMinutes(rule.getMinBookingNoticeMinutes()))) {
                throw invalid("slotId", "Khung giờ không đủ thời gian đặt trước theo quy định.");
            }
            if (slotDate.isAfter(today().plusDays(rule.getMaxBookingDaysAhead()))) {
                throw invalid("slotId", "Khung giờ vượt quá thời hạn đặt lịch.");
            }
        }
        if (slot.getStartsAt().isBefore(slot.getWorkSchedule().getStartsAt()) || slot.getEndsAt().isAfter(slot.getWorkSchedule().getEndsAt())) {
            throw invalid("slotId", "Khung giờ nằm ngoài lịch làm việc của bác sĩ.");
        }
    }

    private void ensureCapacity(AppointmentSlot slot) {
        if (appointments.countActiveBySlotId(slot.getId()) >= slot.getCapacity()) {
            throw new WorkflowException(HttpStatus.CONFLICT, "SLOT_FULL", "Khung giờ vừa hết chỗ. Vui lòng chọn khung khác.", Map.of("slotId", "Khung giờ đã hết chỗ."), List.of());
        }
    }

    private void ensurePatientSlot(Long patientId, Long slotId, Long excludeId) {
        if (appointments.hasActivePatientInSlot(patientId, slotId, excludeId)) {
            throw invalid("slotId", "Bệnh nhân đã có lịch trong khung giờ này.");
        }
    }

    private void requireNotice(Appointment appointment, long noticeMinutes, String action) {
        if (appointment.getAppointmentSlot().getStartsAt().isBefore(now().plusMinutes(noticeMinutes))) {
            throw new WorkflowException(HttpStatus.CONFLICT, "NOTICE_PERIOD", "Không đủ thời gian báo trước để " + action + " theo quy định.");
        }
    }

    private static Patient newPatient(NewPatient input) {
        Patient patient = new Patient();
        patient.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        patient.setFullName(input.fullName().trim());
        patient.setDateOfBirth(input.dateOfBirth());
        patient.setGender(input.gender() == null ? Gender.UNSPECIFIED : input.gender());
        patient.setPhone(normalize(input.phone()));
        patient.setContactEmail(normalize(input.contactEmail()));
        return patient;
    }

    private static boolean sameCreation(Appointment previous, CreateAppointment input) {
        if (!previous.getAppointmentSlot().getId().equals(input.slotId()) || previous.getBookingSource() != input.bookingSource()
                || !Objects.equals(normalize(previous.getReason()), normalize(input.reason()))) return false;
        if (input.patientId() != null) return previous.getPatient().getId().equals(input.patientId());
        NewPatient incoming = input.patient();
        Patient patient = previous.getPatient();
        return Objects.equals(patient.getFullName(), incoming.fullName().trim())
                && Objects.equals(patient.getDateOfBirth(), incoming.dateOfBirth())
                && patient.getGender() == (incoming.gender() == null ? Gender.UNSPECIFIED : incoming.gender())
                && Objects.equals(patient.getPhone(), normalize(incoming.phone()))
                && Objects.equals(patient.getContactEmail(), normalize(incoming.contactEmail()));
    }

    public static String appointmentCode(Long accountId, String idempotencyKey) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest((accountId + ":" + idempotencyKey).getBytes(StandardCharsets.UTF_8));
            return "APT-" + HexFormat.of().formatHex(digest).substring(0, 36);
        } catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }

    private static void clearCheckIn(Appointment appointment) { appointment.setCheckedInAt(null); appointment.setCheckedInByStaff(null); }
    private static void receptionist(StaffPrincipal actor) {
        if (actor == null || !"RECEPTIONIST".equals(actor.role())) throw new WorkflowException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chức năng dành cho nhân viên tiếp nhận.");
    }
    private static WorkflowException missing(String resource) { return new WorkflowException(HttpStatus.NOT_FOUND, "NOT_FOUND", resource + " không tồn tại."); }
    private static WorkflowException invalid(String field, String message) { return new WorkflowException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, Map.of(field, message), List.of()); }
    private static WorkflowException state(String message) { return new WorkflowException(HttpStatus.CONFLICT, "INVALID_STATE", message); }
    private static String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String escapeLike(String value) { return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_"); }
    private static LocalDateTime now() { return LocalDateTime.now(ZoneOffset.UTC); }
    private static LocalDate today() { return LocalDate.now(VIETNAM); }
    private static LocalDateTime utcStart(LocalDate date) { return date.atStartOfDay(VIETNAM).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime(); }
}
