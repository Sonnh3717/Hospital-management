package com.example.swd.repository;

import com.example.swd.entity.appointment.Appointment;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Appointment a where a.id = :id")
    Optional<Appointment> lockById(Long id);
    Optional<Appointment> findByAppointmentCode(String appointmentCode);
    @Query("select count(a) from Appointment a where a.appointmentSlot.id = :slotId and a.status in ('BOOKED','CHECKED_IN')")
    long countActiveBySlotId(Long slotId);
    @Query("select (count(a) > 0) from Appointment a where a.patient.id = :patientId and a.appointmentSlot.id = :slotId and a.status in ('BOOKED','CHECKED_IN') and (:excludeId is null or a.id <> :excludeId)")
    boolean hasActivePatientInSlot(Long patientId, Long slotId, Long excludeId);
}
