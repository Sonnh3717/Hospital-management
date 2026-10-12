package com.example.swd.repository;

import com.example.swd.entity.appointment.AppointmentSlot;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface AppointmentSlotRepository extends JpaRepository<AppointmentSlot, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from AppointmentSlot s where s.id = :id")
    Optional<AppointmentSlot> lockById(Long id);
    @Query("select s from AppointmentSlot s where s.startsAt >= :from and s.startsAt < :to order by s.startsAt")
    List<AppointmentSlot> findForDate(LocalDateTime from, LocalDateTime to);
}
