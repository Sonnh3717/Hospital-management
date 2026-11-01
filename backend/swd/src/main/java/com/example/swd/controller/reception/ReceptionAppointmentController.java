package com.example.swd.controller.reception;

import com.example.swd.dto.request.ReceptionRequests.CancelAppointment;
import com.example.swd.dto.request.ReceptionRequests.CreateAppointment;
import com.example.swd.dto.request.ReceptionRequests.RescheduleAppointment;
import com.example.swd.dto.response.WorkflowViews.AppointmentView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.dto.response.WorkflowViews.PatientView;
import com.example.swd.dto.response.WorkflowViews.ReceptionOptions;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.ReceptionAppointmentService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reception")
@PreAuthorize("hasRole('RECEPTIONIST')")
public class ReceptionAppointmentController {
    private final ReceptionAppointmentService reception;
    public ReceptionAppointmentController(ReceptionAppointmentService reception) { this.reception = reception; }

    @GetMapping("/appointments")
    PageView<AppointmentView> appointments(@AuthenticationPrincipal StaffPrincipal actor,
            @RequestParam(required = false) LocalDate date, @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Appointment.Status status, @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return reception.list(actor, date, doctorId, status, search, page, size);
    }
    @GetMapping("/appointments/{id}")
    AppointmentView detail(@AuthenticationPrincipal StaffPrincipal actor, @PathVariable Long id) { return reception.detail(actor, id); }
    @GetMapping("/options")
    ReceptionOptions options(@AuthenticationPrincipal StaffPrincipal actor, @RequestParam(required = false) LocalDate date) { return reception.options(actor, date); }
    @GetMapping("/patients")
    List<PatientView> patients(@AuthenticationPrincipal StaffPrincipal actor, @RequestParam(required = false) String search) { return reception.searchPatients(actor, search); }
    @PostMapping("/appointments")
    AppointmentView create(@AuthenticationPrincipal StaffPrincipal actor, @Valid @RequestBody CreateAppointment input) { return reception.create(actor, input); }
    @PostMapping("/appointments/{id}/check-in")
    AppointmentView checkIn(@AuthenticationPrincipal StaffPrincipal actor, @PathVariable Long id) { return reception.checkIn(actor, id); }
    @PostMapping("/appointments/{id}/undo-check-in")
    AppointmentView undo(@AuthenticationPrincipal StaffPrincipal actor, @PathVariable Long id) { return reception.undoCheckIn(actor, id); }
    @PostMapping("/appointments/{id}/cancel")
    AppointmentView cancel(@AuthenticationPrincipal StaffPrincipal actor, @PathVariable Long id,
                            @Valid @RequestBody(required = false) CancelAppointment input) { return reception.cancel(actor, id, input == null ? null : input.reason()); }
    @PostMapping("/appointments/{id}/reschedule")
    AppointmentView reschedule(@AuthenticationPrincipal StaffPrincipal actor, @PathVariable Long id,
                               @Valid @RequestBody RescheduleAppointment input) { return reception.reschedule(actor, id, input.slotId()); }
}
