package com.example.swd.controller.appointment;

import com.example.swd.dto.request.CancelAppointmentRequest;
import com.example.swd.dto.request.CreateAppointmentRequest;
import com.example.swd.dto.request.RescheduleRequest;
import com.example.swd.dto.request.UndoCheckInRequest;
import com.example.swd.dto.response.ApiResponse;
import com.example.swd.dto.response.AppointmentResponse;
import com.example.swd.dto.response.AppointmentTicketResponse;
import com.example.swd.dto.response.BookingCheckoutResponse;
import com.example.swd.dto.response.WorkflowViews;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.repository.AppointmentRepository;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.UserAccountRepository;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.AppointmentService;
import com.example.swd.integration.PayOSService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final PayOSService payOSService;
    private final AppointmentRepository appointmentRepository;
    private final UserAccountRepository userAccountRepository;
    private final PatientRepository patientRepository;

    /**
     * Đặt lịch khám và khởi tạo thanh toán payOS
     */
    @PostMapping("/public/appointments/checkout")
    public ResponseEntity<ApiResponse<BookingCheckoutResponse>> bookingCheckout(
            @Valid @RequestBody CreateAppointmentRequest request,
            @RequestParam(value = "amount", defaultValue = "280000") BigDecimal amount) {

        // Tìm tài khoản mặc định cho đặt lịch công khai nếu không có auth
        UserAccount account = userAccountRepository.findByUsername("patient")
                .orElseGet(() -> userAccountRepository.findAll().stream().findFirst().orElseThrow());

        AppointmentResponse apptResp = appointmentService.createAppointment(request, account.getId());
        Appointment appt = appointmentRepository.findById(apptResp.getId()).orElseThrow();

        BookingCheckoutResponse checkout = payOSService.createPaymentLink(appt, amount, account);
        return ResponseEntity.ok(ApiResponse.ok("Khởi tạo đặt lịch & thanh toán thành công", checkout));
    }

    /**
     * Webhook nhận thông báo từ payOS
     */
    @PostMapping("/public/payments/payos-webhook")
    public ResponseEntity<Map<String, Object>> payosWebhook(@RequestBody Map<String, Object> webhookData) {
        boolean processed = payOSService.processWebhook(webhookData);
        return ResponseEntity.ok(Map.of("success", processed));
    }

    /**
     * Lấy phiếu khám bệnh điện tử kèm mã QR
     */
    @GetMapping("/public/appointments/{id}/ticket")
    public ResponseEntity<ApiResponse<AppointmentTicketResponse>> getTicket(@PathVariable Long id) {
        AppointmentTicketResponse ticket = appointmentService.getAppointmentTicket(id);
        return ResponseEntity.ok(ApiResponse.ok(ticket));
    }

    /**
     * Khung giờ khả dụng
     */
    @GetMapping("/appointments/available-slots")
    public ResponseEntity<ApiResponse<List<WorkflowViews.SlotView>>> getAvailableSlots(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long doctorId) {
        List<WorkflowViews.SlotView> slots = appointmentService.getAvailableSlots(date, doctorId);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách khung giờ khả dụng", slots));
    }

    /**
     * Hủy lịch hẹn
     */
    @PostMapping("/appointments/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long id,
            @Valid @RequestBody CancelAppointmentRequest request,
            @AuthenticationPrincipal StaffPrincipal principal) {
        boolean isPatient = "PATIENT".equalsIgnoreCase(principal.role());
        AppointmentResponse response = appointmentService.cancelAppointment(id, request, principal.accountId(),
                isPatient);
        return ResponseEntity.ok(ApiResponse.ok("Hủy lịch hẹn thành công", response));
    }

    /**
     * Đổi lịch hẹn (Reschedule)
     */
    @PutMapping("/appointments/{id}/reschedule")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleRequest request,
            @AuthenticationPrincipal StaffPrincipal principal) {
        boolean isPatient = "PATIENT".equalsIgnoreCase(principal.role());
        AppointmentResponse response = appointmentService.rescheduleAppointment(id, request, principal.accountId(),
                isPatient);
        return ResponseEntity.ok(ApiResponse.ok("Đổi lịch hẹn thành công", response));
    }

    /**
     * Xem chi tiết lịch hẹn
     */
    @GetMapping("/appointments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentDetail(@PathVariable Long id) {
        AppointmentResponse response = appointmentService.getAppointmentDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Danh sách lịch hẹn của bệnh nhân
     */
    @GetMapping("/patient/appointments")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getPatientAppointments(
            @RequestParam(required = false) Long patientId,
            @AuthenticationPrincipal StaffPrincipal principal) {
        Long targetPatientId = patientId;
        boolean isAdmin = principal != null && ("ADMIN".equalsIgnoreCase(principal.role()) || "ROLE_ADMIN".equalsIgnoreCase(principal.role()));

        if (!isAdmin) {
            targetPatientId = principal != null && principal.patientId() != null
                    ? principal.patientId()
                    : (principal != null && principal.accountId() != null
                            ? patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null)
                            : null);
        }

        if (targetPatientId == null) {
            return ResponseEntity.ok(ApiResponse.ok("Chưa có hồ sơ bệnh nhân", List.of()));
        }
        List<AppointmentResponse> list = appointmentService.getAppointmentsByPatient(targetPatientId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Danh sách lịch hẹn của Bác sĩ trong ngày
     */
    @GetMapping("/doctor/appointments")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getDoctorAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal StaffPrincipal principal) {
        Long targetDocId = doctorId != null ? doctorId : principal.accountId();
        LocalDate targetDate = date != null ? date : LocalDate.now();
        LocalDateTime from = targetDate.atStartOfDay();
        LocalDateTime to = targetDate.plusDays(1).atStartOfDay();

        List<AppointmentResponse> list = appointmentService.getAppointmentsByDoctor(targetDocId, from, to);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
}
