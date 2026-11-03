package com.example.swd.mapper;

import com.example.swd.dto.response.WorkflowViews.DoctorView;
import com.example.swd.dto.response.WorkflowViews.PatientView;
import com.example.swd.dto.response.WorkflowViews.SlotView;
import com.example.swd.entity.appointment.AppointmentSlot;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.staff.DoctorProfile;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

public final class WorkflowMapper {
    private WorkflowMapper() {}
    public static String timestamp(LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC).toString();
    }
    public static PatientView patient(Patient value) {
        return new PatientView(value.getId(), value.getPatientCode(), value.getFullName(), value.getDateOfBirth(),
                value.getGender().name(), value.getPhone(), value.getContactEmail());
    }
    public static DoctorView doctor(DoctorProfile value) {
        return new DoctorView(value.getId(), value.getStaff().getFullName(), value.getSpecialization());
    }
    public static SlotView slot(AppointmentSlot value, int remaining) {
        var staff = value.getWorkSchedule().getStaff();
        var shift = value.getWorkSchedule().getShiftTemplate();
        String shiftCode = shift != null ? shift.getShiftCode() : null;
        String shiftName = shift != null ? shift.getShiftName() : null;
        // The schedule staff id is the doctor's shared primary key.
        return new SlotView(value.getId(), staff.getId(), staff.getFullName(), null,
                timestamp(value.getStartsAt()), timestamp(value.getEndsAt()), value.getCapacity(), Math.max(0, remaining),
                shiftCode, shiftName);
    }
    public static SlotView slot(AppointmentSlot value, DoctorProfile doctor, int remaining) {
        var shift = value.getWorkSchedule().getShiftTemplate();
        String shiftCode = shift != null ? shift.getShiftCode() : null;
        String shiftName = shift != null ? shift.getShiftName() : null;
        return new SlotView(value.getId(), doctor.getId(), doctor.getStaff().getFullName(), doctor.getSpecialization(),
                timestamp(value.getStartsAt()), timestamp(value.getEndsAt()), value.getCapacity(), Math.max(0, remaining),
                shiftCode, shiftName);
    }
}
