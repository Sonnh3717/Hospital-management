package com.example.swd.service;

import com.example.swd.dto.request.ReceptionRequests.CreateAppointment;
import com.example.swd.dto.request.ReceptionRequests.NewPatient;
import com.example.swd.dto.response.WorkflowViews.AppointmentView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.dto.response.WorkflowViews.PatientView;
import com.example.swd.dto.response.WorkflowViews.ReceptionOptions;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.security.StaffPrincipal;
import java.time.LocalDate;
import java.util.List;

public interface ReceptionAppointmentService {
    PageView<AppointmentView> list(StaffPrincipal actor, LocalDate date, Long doctorId, Appointment.Status status, String search, int page, int size);
    AppointmentView detail(StaffPrincipal actor, Long id);
    ReceptionOptions options(StaffPrincipal actor, LocalDate date);
    List<PatientView> searchPatients(StaffPrincipal actor, String search);
    AppointmentView create(StaffPrincipal actor, CreateAppointment input);
    AppointmentView checkIn(StaffPrincipal actor, Long id);
    AppointmentView undoCheckIn(StaffPrincipal actor, Long id);
    AppointmentView cancel(StaffPrincipal actor, Long id, String reason);
    AppointmentView reschedule(StaffPrincipal actor, Long id, Long destinationId);
}
