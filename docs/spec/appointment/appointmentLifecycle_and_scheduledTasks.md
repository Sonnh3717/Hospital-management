# Đặc Tả Tính Năng: Quản Lý Vòng Đời Lịch Hẹn & Tác Vụ Tự Động (Appointment Lifecycle & Scheduled Tasks)

## 1. Giới Thiệu & Mục Đích
Tài liệu này đặc tả toàn bộ vòng đời trạng thái của Lịch hẹn (`Appointment`), mối liên hệ đồng bộ giữa `Appointment` và Buổi khám lâm sàng (`Encounter`), cùng cơ chế thực thi của **Tác vụ lập lịch tự động (Scheduled Cron Job)** quét và xử lý các cuộc hẹn vắng mặt (`NO_SHOW`) mỗi khi một ca làm việc của bệnh viện kết thúc.

---

## 2. Mô Hình Trạng Thái Lịch Hẹn (Appointment State Machine)

### 2.1. Danh Sách Các Trạng Thái Của `Appointment`
Theo mô hình nghiệp vụ đã được chuẩn hóa:
- **`BOOKED`** (Đã Đặt Lịch): Lịch hẹn được tạo thành công bởi Bệnh nhân (Online) hoặc Tiếp tân (Assisted / Walk-in). Bệnh nhân giữ chỗ trong khung giờ (`AppointmentSlot`).
- **`CHECKED_IN`** (Đã Tiếp Đón / Check-in): Bệnh nhân đã có mặt tại bệnh viện, tiếp tân đã kiểm tra thông tin và xác nhận. Bệnh nhân được xếp vào hàng đợi chờ Bác sĩ khám. **Lịch hẹn sẽ giữ trạng thái này trong suốt quá trình bệnh nhân chờ và tiến hành khám lâm sàng.**
- **`COMPLETED`** (Đã Hoàn Thành): Khi Bác sĩ kết thúc toàn bộ buổi khám lâm sàng (`Encounter.status = COMPLETED`), hệ thống sẽ **tự động chuyển trạng thái của `Appointment` từ `CHECKED_IN` sang `COMPLETED`**.
- **`CANCELLED`** (Đã Hủy): Bệnh nhân hoặc Tiếp tân/Admin hủy lịch hẹn trước thời hạn quy định (tối thiểu trước 24 giờ). Khung giờ được giải phóng cho người khác.
- **`NO_SHOW`** (Vắng Mặt / Không Đến Khám): Bệnh nhân đã đặt lịch nhưng không đến làm thủ tục check-in trong suốt ca làm việc. Hệ thống tự động chuyển trạng thái sang `NO_SHOW` sau khi ca làm việc kết thúc.

```
       [ Đặt Lịch ]
            │
            ▼
        ┌───────┐     Hủy hẹn (trước >= 24h)     ┌───────────┐
        │BOOKED │ ─────────────────────────────> │ CANCELLED │
        └───┬───┘                                └───────────┘
            │
            │ Tiếp tân Check-in
            │   (Có thể Undo Check-in nếu chưa khám)
            ▼
      ┌───────────┐
      │CHECKED_IN │ ──(Encounter Hoàn Thành)──>  ┌───────────┐
      └───────────┘                              │ COMPLETED │
            │                                    └───────────┘
            │
            │ (Nếu hết ca làm việc mà vẫn ở BOOKED)
            ▼
      ┌───────────┐
      │  NO_SHOW  │
      └───────────┘
```

---

## 3. Đặc Tả Tác Vụ Lập Lịch Sau Mỗi Ca Làm Việc (Scheduled Shift End Task)

### 3.1. Mục Tiêu & Cơ Chế Kích Hoạt
Hệ thống thiết lập một tiến trình nền tự động (**Spring `@Scheduled` Task**) nhằm quét và xử lý các cuộc hẹn còn tồn đọng sau khi mỗi ca làm việc (`WorkSchedule`) kết thúc.

- **Thời điểm kích hoạt**:
  - Chạy định kỳ vào các khung giờ kết thúc ca chuẩn của bệnh viện (Ví dụ: Ca sáng kết thúc lúc `12:00`, Ca chiều kết thúc lúc `17:30`, Ca tối kết thúc lúc `21:00`).
  - Hoặc cấu hình chạy mỗi 15-30 phút một lần để kiểm tra các ca làm việc vừa kết thúc trong khoảng thời gian vừa qua:
    ```java
    @Scheduled(cron = "0 0/15 * * * ?") // Mỗi 15 phút quét một lần
    ```

### 3.2. Quy Trình Xử Lý Của Scheduled Task
1. **Truy vấn ca làm việc vừa hoàn tất**:
   - Tìm tất cả các ca làm việc (`work_schedules`) có `ends_at <= NOW()` và chưa được đánh dấu là đã xử lý no-show (hoặc xử lý trong ngày hôm nay).
2. **Tìm các cuộc hẹn vắng mặt (`NO_SHOW`)**:
   - Tìm tất cả các `appointments` thuộc các khung giờ của ca làm việc đó mà:
     - `status == 'BOOKED'` (Bệnh nhân không hề đến làm thủ tục tiếp đón/check-in).
3. **Cập nhật trạng thái**:
   - Chuyển `status = 'NO_SHOW'`.
   - Cập nhật thời điểm: `no_show_marked_at = LocalDateTime.now()`.
4. **Gửi thông báo & Ghi log**:
   - Kích hoạt dịch vụ gửi email thông báo đến bệnh nhân: Thông báo lịch hẹn mã `APPT-XXXX` đã bị ghi nhận vắng mặt do không đến khám theo giờ đã đăng ký.
   - Ghi nhận lịch sử phục vụ báo cáo tỷ lệ No-show của Quản lý (`UC 3.6.2 - View Appointment and No-Show Reports`).
5. **[Cần Xác Nhận: Xử lý các cuộc hẹn CHECKED_IN nhưng chưa hoàn thành ca khám]**:
   - [ CẦN XÁC NHẬN: Nếu ca làm việc đã kết thúc nhưng vẫn còn cuộc hẹn ở trạng thái `CHECKED_IN` (bệnh nhân đã đến viện nhưng bác sĩ chưa kịp khám hoặc quên bấm hoàn thành Encounter), hệ thống xử lý như thế nào? Tự động gia hạn ca, gửi cảnh báo cho Bác sĩ, hay chuyển sang trạng thái chờ xử lý đặc biệt? ]

### 3.3. Mã Nguồn Minh Họa (Spring Boot Scheduled Task)
```java
package com.example.swd.scheduler;

import com.example.swd.entity.appointment.Appointment;
import com.example.swd.repository.appointment.AppointmentRepository;
import com.example.swd.service.notification.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentShiftEndScheduler {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    /**
     * Tự động quét và đánh dấu NO_SHOW cho các cuộc hẹn không check-in sau khi ca làm việc kết thúc
     */
    @Scheduled(cron = "0 0/15 * * * ?") // Chạy mỗi 15 phút
    @Transactional
    public void scanAndMarkNoShowAppointments() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Bắt đầu quét lịch hẹn vắng mặt (No-Show) tại thời điểm: {}", now);

        // Lấy danh sách cuộc hẹn BOOKED thuộc các slot có ca làm việc đã kết thúc
        List<Appointment> expiredAppointments = appointmentRepository.findUncheckedAppointmentsPastShiftEnd(now);

        for (Appointment appt : expiredAppointments) {
            log.warn("Đánh dấu NO_SHOW cho lịch hẹn: {}, Slot kết thúc: {}", 
                     appt.getAppointmentCode(), appt.getAppointmentSlot().getEndsAt());
            
            appt.setStatus(Appointment.Status.NO_SHOW);
            appt.setNoShowMarkedAt(now);
            appointmentRepository.save(appt);

            // Gửi email thông báo No-Show cho bệnh nhân
            emailService.sendNoShowNoticeEmail(appt);
        }

        log.info("Hoàn tất xử lý No-Show. Tổng số cuộc hẹn đã xử lý: {}", expiredAppointments.size());
    }
}
```

---

## 4. Bảng Quy Định Thời Gian & Ràng Buộc (Summary Table)

| Tham Số Nghiệp Vụ | Giá Trị Quy Định | Áp Dụng Cho | Mô Tả |
| :--- | :--- | :--- | :--- |
| **Hủy lịch hẹn tối thiểu** | `>= 24 giờ` trước giờ khám | Bệnh nhân (`PATIENT`) | Nếu còn dưới 24h, bệnh nhân không thể tự hủy trên web |
| **Đổi lịch hẹn tối thiểu** | `>= 24 giờ` trước giờ khám | Bệnh nhân (`PATIENT`) | Nếu còn dưới 24h, bệnh nhân không thể tự đổi lịch trên web |
| **Quét No-Show** | Mỗi khi ca làm việc kết thúc | Hệ thống (Cron Task) | Đưa tất cả `BOOKED` chưa check-in sang `NO_SHOW` |
| **Chuyển COMPLETED** | Khi Bác sĩ hoàn thành `Encounter` | Bác sĩ / Hệ thống | `Encounter.COMPLETED` đồng thời chuyển `Appointment.COMPLETED` |

---

## 5. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Bệnh nhân bị ghi nhận `NO_SHOW` nhiều lần (ví dụ: quá 3 lần trong tháng) có bị áp dụng chính sách tạm khóa quyền đặt lịch hẹn online trong một khoảng thời gian nhất định không? ]
- [ CẦN XÁC NHẬN: Sau khi ca kết thúc, các bác sĩ có nhận được email tổng kết số lượng bệnh nhân đã khám (`COMPLETED`) và số lượng vắng mặt (`NO_SHOW`) trong ca của mình không? ]

