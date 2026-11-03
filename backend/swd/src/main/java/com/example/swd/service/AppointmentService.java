package com.example.swd.service;

import com.example.swd.dto.request.CancelAppointmentRequest;
import com.example.swd.dto.request.CreateAppointmentRequest;
import com.example.swd.dto.request.RescheduleRequest;
import com.example.swd.dto.request.UndoCheckInRequest;
import com.example.swd.dto.response.AppointmentResponse;
import com.example.swd.dto.response.AppointmentTicketResponse;
import com.example.swd.dto.response.WorkflowViews;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentService {
    AppointmentResponse createAppointment(CreateAppointmentRequest request, Long currentAccountId);
    AppointmentResponse checkIn(Long appointmentId, Long staffAccountId);
    AppointmentResponse undoCheckIn(Long appointmentId, UndoCheckInRequest request, Long staffAccountId);
    AppointmentResponse cancelAppointment(Long appointmentId, CancelAppointmentRequest request, Long currentAccountId, boolean isPatient);
    AppointmentResponse rescheduleAppointment(Long appointmentId, RescheduleRequest request, Long currentAccountId, boolean isPatient);
    AppointmentResponse getAppointmentDetail(Long appointmentId);
    List<AppointmentResponse> getAppointmentsByPatient(Long patientId);
    List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId, LocalDateTime from, LocalDateTime to);
    AppointmentTicketResponse getAppointmentTicket(Long appointmentId);
    List<WorkflowViews.SlotView> getAvailableSlots(LocalDate date, Long doctorId);
}
