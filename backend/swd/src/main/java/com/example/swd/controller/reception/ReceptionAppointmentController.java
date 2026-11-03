package com.example.swd.controller.reception;

import com.example.swd.dto.request.ReceptionRequests.CancelAppointment;
import com.example.swd.dto.request.ReceptionRequests.CreateAppointment;
import com.example.swd.dto.request.ReceptionRequests.RescheduleAppointment;
import com.example.swd.dto.response.WorkflowViews.AppointmentView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.dto.response.WorkflowViews.ReceptionOptions;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.ReceptionAppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reception")
@PreAuthorize("hasRole('RECEPTIONIST')")
@RequiredArgsConstructor
public class ReceptionAppointmentController {

    private final ReceptionAppointmentService reception;

    @GetMapping("/appointments")
    public PageView<AppointmentView> appointments(
            @AuthenticationPrincipal StaffPrincipal actor,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Appointment.Status status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return reception.list(actor, date, doctorId, status, search, page, size);
    }

    @GetMapping("/appointments/{id}")
    public AppointmentView detail(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return reception.detail(actor, id);
    }

    @GetMapping("/options")
    public ReceptionOptions options(
            @AuthenticationPrincipal StaffPrincipal actor,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reception.options(actor, date);
    }

    @PostMapping("/appointments")
    public AppointmentView create(
            @AuthenticationPrincipal StaffPrincipal actor,
            @Valid @RequestBody CreateAppointment input) {
        return reception.create(actor, input);
    }

    @PostMapping("/appointments/{id}/check-in")
    public AppointmentView checkIn(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return reception.checkIn(actor, id);
    }

    @PostMapping("/appointments/{id}/undo-check-in")
    public AppointmentView undoCheckIn(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return reception.undoCheckIn(actor, id);
    }

    @PostMapping("/appointments/{id}/cancel")
    public AppointmentView cancel(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CancelAppointment input) {
        return reception.cancel(actor, id, input == null ? null : input.reason());
    }

    @PostMapping("/appointments/{id}/reschedule")
    public AppointmentView reschedule(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody RescheduleAppointment input) {
        return reception.reschedule(actor, id, input.slotId());
    }
}
