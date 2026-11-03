package com.example.swd.repository;

import com.example.swd.entity.appointment.Appointment;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Appointment a where a.id = :id")
    Optional<Appointment> lockById(@Param("id") Long id);

    Optional<Appointment> findByAppointmentCode(String appointmentCode);

    @Query("select count(a) from Appointment a where a.appointmentSlot.id = :slotId and a.status in ('BOOKED','CHECKED_IN')")
    long countActiveBySlotId(@Param("slotId") Long slotId);

    @Query("select (count(a) > 0) from Appointment a where a.patient.id = :patientId and a.appointmentSlot.id = :slotId and a.status in ('BOOKED','CHECKED_IN') and (:excludeId is null or a.id <> :excludeId)")
    boolean hasActivePatientInSlot(@Param("patientId") Long patientId, @Param("slotId") Long slotId, @Param("excludeId") Long excludeId);

    List<Appointment> findByPatient_IdOrderByAppointmentSlot_StartsAtDesc(Long patientId);

    @Query("select a from Appointment a join a.appointmentSlot s join s.workSchedule w where w.staff.id = :doctorId and s.startsAt >= :from and s.startsAt < :to order by s.startsAt")
    List<Appointment> findDoctorAppointments(@Param("doctorId") Long doctorId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("select a from Appointment a join a.appointmentSlot s join s.workSchedule w where a.status = 'BOOKED' and w.endsAt <= :now")
    List<Appointment> findUncheckedAppointmentsPastShiftEnd(@Param("now") LocalDateTime now);
}
