package com.example.swd.service.impl;

import com.example.swd.entity.appointment.Appointment;
import com.example.swd.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentSchedulerServiceImpl implements com.example.swd.service.AppointmentSchedulerService {

    private final AppointmentRepository appointmentRepository;

    /**
     * Quét ngay khi ứng dụng khởi động thành công
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            int count = scanAndMarkNoShow();
            log.info("Quét NO_SHOW lúc khởi động hoàn tất: đã cập nhật {} lịch hẹn.", count);
        } catch (Exception e) {
            log.error("Lỗi khi quét NO_SHOW lúc khởi động: {}", e.getMessage(), e);
        }
    }

    /**
     * Quét định kỳ kiểm tra các ca làm việc đã kết thúc để đánh dấu NO_SHOW cho các
     * cuộc hẹn không check-in.
     */
    @Scheduled(cron = "0 */1 * * * ?") // Chạy định kỳ mỗi phút
    @Transactional
    public int scanAndMarkNoShow() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
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
