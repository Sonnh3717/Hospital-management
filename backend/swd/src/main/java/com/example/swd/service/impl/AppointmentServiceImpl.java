package com.example.swd.service.impl;

import com.example.swd.dto.request.CancelAppointmentRequest;
import com.example.swd.dto.request.CreateAppointmentRequest;
import com.example.swd.dto.request.RescheduleRequest;
import com.example.swd.dto.request.UndoCheckInRequest;
import com.example.swd.dto.response.AppointmentResponse;
import com.example.swd.dto.response.AppointmentTicketResponse;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.appointment.AppointmentSlot;
import com.example.swd.entity.common.enums.Gender;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.swd.dto.response.WorkflowViews;
import com.example.swd.config.WorkflowMapper;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements com.example.swd.service.AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentSlotRepository appointmentSlotRepository;
    private final PatientRepository patientRepository;
    private final HospitalStaffRepository hospitalStaffRepository;
    private final UserAccountRepository userAccountRepository;
    private final EncounterRepository encounterRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request, Long currentAccountId) {
        UserAccount currentAccount = userAccountRepository.findById(currentAccountId)
                .orElseThrow(() -> new WorkflowException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED",
                        "Không tìm thấy tài khoản thao tác"));

        AppointmentSlot slot = appointmentSlotRepository.lockById(request.getAppointmentSlotId())
                .orElseThrow(() -> new WorkflowException(HttpStatus.NOT_FOUND, "SLOT_NOT_FOUND",
                        "Khung giờ khám không tồn tại"));

        if (slot.getStatus() != AppointmentSlot.Status.OPEN) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "SLOT_NOT_OPEN", "Khung giờ khám hiện đang bị khóa");
        }

        long activeCount = appointmentRepository.countActiveBySlotId(slot.getId());
        if (activeCount >= slot.getCapacity()) {
            throw new WorkflowException(HttpStatus.CONFLICT, "SLOT_FULL", "Khung giờ khám đã đủ số lượng tiếp nhận");
        }

        Patient patient = resolveOrCreatePatient(request, currentAccount);

        if (appointmentRepository.hasActivePatientInSlot(patient.getId(), slot.getId(), null)) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "DUPLICATE_BOOKING",
                    "Người bệnh đã có một lịch khám trong khung giờ này");
        }

        Appointment appointment = new Appointment();
        appointment.setAppointmentCode("APPT-" + System.currentTimeMillis() % 100000000);
        appointment.setPatient(patient);
        appointment.setAppointmentSlot(slot);
        appointment.setBookingSource(parseBookingSource(request.getBookingSource()));
        appointment.setStatus(Appointment.Status.BOOKED);
        appointment.setReason(request.getReason());
        appointment.setNote(request.getNote());
        appointment.setCreatedByAccount(currentAccount);

        appointment = appointmentRepository.save(appointment);
        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse checkIn(Long appointmentId, Long staffAccountId) {
        Appointment appointment = appointmentRepository.lockById(appointmentId)
                .orElseThrow(
                        () -> new WorkflowException(HttpStatus.NOT_FOUND, "APPT_NOT_FOUND", "Lịch hẹn không tồn tại"));

        if (appointment.getStatus() != Appointment.Status.BOOKED) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Lịch hẹn không ở trạng thái chờ tiếp đón (BOOKED)");
        }

        HospitalStaff staff = hospitalStaffRepository.findByUserAccount_Id(staffAccountId)
                .orElseThrow(() -> new WorkflowException(HttpStatus.FORBIDDEN, "STAFF_NOT_FOUND",
                        "Chỉ nhân viên y tế mới được thực hiện tiếp đón"));

        appointment.setStatus(Appointment.Status.CHECKED_IN);
        appointment.setCheckedInAt(LocalDateTime.now());
        appointment.setCheckedInByStaff(staff);

        appointment = appointmentRepository.save(appointment);
        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse undoCheckIn(Long appointmentId, UndoCheckInRequest request, Long staffAccountId) {
        Appointment appointment = appointmentRepository.lockById(appointmentId)
                .orElseThrow(
                        () -> new WorkflowException(HttpStatus.NOT_FOUND, "APPT_NOT_FOUND", "Lịch hẹn không tồn tại"));

        if (appointment.getStatus() != Appointment.Status.CHECKED_IN) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Chỉ có thể hoàn tác lịch hẹn đã check-in");
        }

        boolean encounterStarted = encounterRepository.findByAppointment_Id(appointmentId).isPresent();
        if (encounterStarted) {
            throw new WorkflowException(HttpStatus.CONFLICT, "ENCOUNTER_STARTED",
                    "Không thể hoàn tác check-in vì Bác sĩ đã bắt đầu lượt khám");
        }

        HospitalStaff staff = hospitalStaffRepository.findByUserAccount_Id(staffAccountId)
                .orElseThrow(() -> new WorkflowException(HttpStatus.FORBIDDEN, "STAFF_NOT_FOUND",
                        "Chỉ nhân viên y tế mới có quyền hoàn tác tiếp đón"));

        appointment.setStatus(Appointment.Status.BOOKED);
        appointment.setLastCheckInReversedAt(LocalDateTime.now());
        appointment.setLastCheckInReversedByStaff(staff);

        appointment = appointmentRepository.save(appointment);
        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, CancelAppointmentRequest request,
            Long currentAccountId, boolean isPatient) {
        Appointment appointment = appointmentRepository.lockById(appointmentId)
                .orElseThrow(
                        () -> new WorkflowException(HttpStatus.NOT_FOUND, "APPT_NOT_FOUND", "Lịch hẹn không tồn tại"));

        if (appointment.getStatus() != Appointment.Status.BOOKED) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Lịch hẹn không ở trạng thái có thể hủy");
        }

        UserAccount currentAccount = userAccountRepository.findById(currentAccountId)
                .orElseThrow(() -> new WorkflowException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED",
                        "Không tìm thấy tài khoản"));

        // Ràng buộc hủy trước 24 giờ (1440 phút)
        if (isPatient) {
            Duration duration = Duration.between(LocalDateTime.now(), appointment.getAppointmentSlot().getStartsAt());
            if (duration.toMinutes() < 1440) {
                throw new WorkflowException(HttpStatus.BAD_REQUEST, "DEADLINE_EXCEEDED",
                        "Chỉ được phép hủy lịch hẹn trước giờ khám tối thiểu 24 giờ");
            }
        }

        appointment.setStatus(Appointment.Status.CANCELLED);
        appointment.setCancelledAt(LocalDateTime.now());
        appointment.setCancelledByAccount(currentAccount);
        appointment.setCancellationReason(request.getReason());

        appointment = appointmentRepository.save(appointment);
        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, RescheduleRequest request,
            Long currentAccountId, boolean isPatient) {
        Appointment appointment = appointmentRepository.lockById(appointmentId)
                .orElseThrow(
                        () -> new WorkflowException(HttpStatus.NOT_FOUND, "APPT_NOT_FOUND", "Lịch hẹn không tồn tại"));

        if (appointment.getStatus() != Appointment.Status.BOOKED) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                    "Lịch hẹn không ở trạng thái có thể đổi lịch");
        }

        UserAccount currentAccount = userAccountRepository.findById(currentAccountId)
                .orElseThrow(() -> new WorkflowException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED",
                        "Không tìm thấy tài khoản"));

        // Ràng buộc đổi lịch trước 24 giờ
        if (isPatient) {
            Duration duration = Duration.between(LocalDateTime.now(), appointment.getAppointmentSlot().getStartsAt());
            if (duration.toMinutes() < 1440) {
                throw new WorkflowException(HttpStatus.BAD_REQUEST, "DEADLINE_EXCEEDED",
                        "Chỉ được phép đổi lịch hẹn trước giờ khám tối thiểu 24 giờ");
            }
        }

        AppointmentSlot newSlot = appointmentSlotRepository.lockById(request.getNewAppointmentSlotId())
                .orElseThrow(() -> new WorkflowException(HttpStatus.NOT_FOUND, "SLOT_NOT_FOUND",
                        "Khung giờ mới không tồn tại"));

        if (newSlot.getStatus() != AppointmentSlot.Status.OPEN) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "SLOT_NOT_OPEN", "Khung giờ mới đang bị khóa");
        }

        long activeCount = appointmentRepository.countActiveBySlotId(newSlot.getId());
        if (activeCount >= newSlot.getCapacity()) {
            throw new WorkflowException(HttpStatus.CONFLICT, "SLOT_FULL", "Khung giờ mới đã đủ số lượng");
        }

        if (appointmentRepository.hasActivePatientInSlot(appointment.getPatient().getId(), newSlot.getId(),
                appointment.getId())) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "DUPLICATE_BOOKING",
                    "Người bệnh đã có lịch hẹn khác trong khung giờ mới này");
        }

        appointment.setAppointmentSlot(newSlot);
        appointment.setLastRescheduledAt(LocalDateTime.now());
        appointment.setLastRescheduledByAccount(currentAccount);

        appointment = appointmentRepository.save(appointment);
        return mapToResponse(appointment);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentDetail(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(
                        () -> new WorkflowException(HttpStatus.NOT_FOUND, "APPT_NOT_FOUND", "Lịch hẹn không tồn tại"));
        return mapToResponse(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatient_IdOrderByAppointmentSlot_StartsAtDesc(patientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId, LocalDateTime from, LocalDateTime to) {
        return appointmentRepository.findDoctorAppointments(doctorId, from, to)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AppointmentTicketResponse getAppointmentTicket(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(
                        () -> new WorkflowException(HttpStatus.NOT_FOUND, "APPT_NOT_FOUND", "Lịch hẹn không tồn tại"));

        String qrData = "APPT:" + appointment.getAppointmentCode() + "|" + appointment.getPatient().getFullName();

        return AppointmentTicketResponse.builder()
                .appointmentId(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .status(appointment.getStatus().name())
                .patientName(appointment.getPatient().getFullName())
                .patientPhone(appointment.getPatient().getPhone())
                .doctorName(appointment.getAppointmentSlot().getWorkSchedule().getStaff().getFullName())
                .specialization("Da liễu chuyên sâu")
                .startsAt(appointment.getAppointmentSlot().getStartsAt())
                .endsAt(appointment.getAppointmentSlot().getEndsAt())
                .paymentStatus("PAID")
                .qrCodeData(qrData)
                .build();
    }

    @Transactional(readOnly = true)
    public List<WorkflowViews.SlotView> getAvailableSlots(LocalDate date, Long doctorId) {
        ZoneId vietnamZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate queryDate = date != null ? date : LocalDate.now(vietnamZone);
        LocalDateTime from = queryDate.atStartOfDay(vietnamZone).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime to = queryDate.plusDays(1).atStartOfDay(vietnamZone).withZoneSameInstant(ZoneOffset.UTC)
                .toLocalDateTime();
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        List<AppointmentSlot> slots = appointmentSlotRepository.findForDate(from, to);
        List<WorkflowViews.SlotView> result = new ArrayList<>();

        for (AppointmentSlot slot : slots) {
            if (slot.getStatus() != AppointmentSlot.Status.OPEN || !slot.getEndsAt().isAfter(now)) {
                continue;
            }
            if (doctorId != null && !slot.getWorkSchedule().getStaff().getId().equals(doctorId)) {
                continue;
            }
            int activeCount = (int) appointmentRepository.countActiveBySlotId(slot.getId());
            int remaining = slot.getCapacity() - activeCount;
            if (remaining <= 0) {
                continue;
            }
            var doctorOpt = doctorProfileRepository.findById(slot.getWorkSchedule().getStaff().getId());
            if (doctorOpt.isPresent()) {
                result.add(WorkflowMapper.slot(slot, doctorOpt.get(), remaining));
            } else {
                result.add(WorkflowMapper.slot(slot, remaining));
            }
        }
        return result;
    }

    private Patient resolveOrCreatePatient(CreateAppointmentRequest request, UserAccount currentAccount) {
        if (request.getPatientId() != null) {
            return patientRepository.findById(request.getPatientId())
                    .orElseThrow(() -> new WorkflowException(HttpStatus.NOT_FOUND, "PATIENT_NOT_FOUND",
                            "Hồ sơ người bệnh không tồn tại"));
        }

        // Tìm theo tài khoản đăng nhập
        var existing = patientRepository.findByUserAccount_Id(currentAccount.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        // Tạo mới hồ sơ bệnh nhân
        Patient newPatient = new Patient();
        newPatient.setPatientCode("BN-" + System.currentTimeMillis() % 1000000);
        newPatient.setFullName(
                request.getFullName() != null ? request.getFullName().trim() : currentAccount.getUsername());
        newPatient.setPhone(request.getPhoneNumber());
        newPatient.setContactEmail(request.getEmail() != null ? request.getEmail() : currentAccount.getLoginEmail());
        newPatient.setAddress(request.getAddress());
        newPatient.setUserAccount(currentAccount);

        if (request.getGender() != null) {
            try {
                newPatient.setGender(Gender.valueOf(request.getGender().toUpperCase()));
            } catch (Exception ignored) {
                newPatient.setGender(Gender.UNSPECIFIED);
            }
        }

        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            try {
                newPatient.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
            } catch (Exception ignored) {
            }
        }

        return patientRepository.save(newPatient);
    }

    private Appointment.BookingSource parseBookingSource(String source) {
        if (source == null)
            return Appointment.BookingSource.ONLINE;
        try {
            return Appointment.BookingSource.valueOf(source.toUpperCase());
        } catch (Exception e) {
            return Appointment.BookingSource.ONLINE;
        }
    }

    private AppointmentResponse mapToResponse(Appointment a) {
        var slot = a.getAppointmentSlot();
        var doctor = slot.getWorkSchedule().getStaff();
        var encounter = encounterRepository.findByAppointment_Id(a.getId()).orElse(null);
        return AppointmentResponse.builder()
                .id(a.getId())
                .appointmentCode(a.getAppointmentCode())
                .status(a.getStatus().name())
                .bookingSource(a.getBookingSource().name())
                .reason(a.getReason())
                .note(a.getNote())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getFullName())
                .patientPhone(a.getPatient().getPhone())
                .patientGender(a.getPatient().getGender().name())
                .slotId(slot.getId())
                .startsAt(slot.getStartsAt())
                .endsAt(slot.getEndsAt())
                .doctorId(doctor.getId())
                .doctorName(doctor.getFullName())
                .specialization("Da liễu tổng quát")
                .checkedInAt(a.getCheckedInAt())
                .checkedInByStaffName(a.getCheckedInByStaff() != null ? a.getCheckedInByStaff().getFullName() : null)
                .cancelledAt(a.getCancelledAt())
                .cancellationReason(a.getCancellationReason())
                .lastRescheduledAt(a.getLastRescheduledAt())
                .lastCheckInReversedAt(a.getLastCheckInReversedAt())
                .encounterId(encounter != null ? encounter.getId() : null)
                .encounterStatus(encounter != null ? encounter.getStatus().name() : null)
                .build();
    }
}
