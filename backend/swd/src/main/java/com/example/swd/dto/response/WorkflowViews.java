package com.example.swd.dto.response;

import java.time.LocalDate;
import java.util.List;

public final class WorkflowViews {
    private WorkflowViews() {}
    public record PatientView(Long id, String patientCode, String fullName, LocalDate dateOfBirth,
                              String gender, String phone, String contactEmail) {}
    public record DoctorView(Long id, String fullName, String specialization) {}
    public record SlotView(Long id, Long doctorId, String doctorName, String specialization,
                           String startsAt, String endsAt, Integer capacity, int remaining) {}
    public record AppointmentView(Long id, String appointmentCode, PatientView patient, DoctorView doctor,
                                  SlotView slot, String bookingSource, String status, String reason,
                                  String note, String checkedInAt, Long encounterId, String encounterStatus) {}
    public record PageView<T>(List<T> items, long total, int page, int size) {}
    public record ReceptionOptions(List<DoctorView> doctors, List<SlotView> slots) {}
}
