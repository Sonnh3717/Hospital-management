package com.example.swd.service;

import com.example.swd.entity.appointment.Appointment;
import com.example.swd.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentSchedulerService {

    private final AppointmentRepository appointmentRepository;

    /**
     * Quét định kỳ kiểm tra các ca làm việc đã kết thúc để đánh dấu NO_SHOW cho các cuộc hẹn không check-in.
     */
    @Scheduled(cron = "0 0/15 * * * ?") // Chạy mỗi 15 phút
    @Transactional
    public int scanAndMarkNoShow() {
        LocalDateTime now = LocalDateTime.now();
        List<Appointment> pendingAppointments = appointmentRepository.findUncheckedAppointmentsPastShiftEnd(now);
        for (Appointment a : pendingAppointments) {
            a.setStatus(Appointment.Status.NO_SHOW);
            a.setNoShowMarkedAt(now);
            appointmentRepository.save(a);
            log.info("Lịch hẹn {} đã được đánh dấu NO_SHOW do quá ca khám.", a.getAppointmentCode());
        }
        return pendingAppointments.size();
    }
}

