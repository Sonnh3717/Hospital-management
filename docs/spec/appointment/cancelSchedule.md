# Đặc Tả Tính Năng: Hủy Lịch Hẹn (Cancel Appointment / Schedule)

## 1. Thông Tin Chung
- **Mã Use Case**: UC15 - Cancel Appointment
- **Tác Nhân (Actors)**:
  - Bệnh nhân (Patient): Tự hủy lịch hẹn của mình.
  - Nhân viên Tiếp tân (Receptionist): Hủy lịch hẹn thay mặt bệnh nhân hoặc hủy theo yêu cầu điều phối.
  - Quản trị viên / Quản lý (Admin / Manager): Hủy lịch hẹn do sự cố lịch trình của bác sĩ.
- **Mô Tả**:
  Người dùng hủy một lịch hẹn đã đặt trước đó. Hệ thống kiểm tra điều kiện hủy (đặc biệt là quy định thời gian tối thiểu trước giờ khám), cập nhật trạng thái lịch hẹn sang `CANCELLED`, ghi nhận lý do hủy, người thực hiện hủy, giải phóng chỗ trống trong khung giờ (`AppointmentSlot`) để người khác có thể đặt, và gửi email thông báo hủy cho bệnh nhân.

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Người dùng đã đăng nhập và có quyền đối với lịch hẹn (Bệnh nhân chỉ được hủy lịch của chính mình theo BR-53; Tiếp tân/Admin có thể hủy theo thẩm quyền).
  - Lịch hẹn đang ở trạng thái `BOOKED`. Tuyệt đối không hủy cuộc hẹn đã `CHECKED_IN`, `COMPLETED`, hoặc đã `CANCELLED`.
  - **Quy tắc thời gian hủy tối thiểu**: Thời điểm gửi yêu cầu hủy phải **trước thời điểm bắt đầu ca khám ít nhất 24 giờ** (Theo quy định hệ thống: `cancellation_notice_minutes >= 1440`).
- **Hậu điều kiện (Postconditions)**:
  - Trạng thái `status` của lịch hẹn chuyển sang `CANCELLED`.
  - Cập nhật thời điểm hủy: `cancelled_at = NOW()`.
  - Ghi nhận tài khoản hủy: `cancelled_by_account_id = <currentAccountId>`.
  - Lưu lý do hủy: `cancellation_reason = "..."`.
  - Giải phóng slot: Số lượng người đặt trong khung giờ đó giảm đi 1, cho phép bệnh nhân khác đặt slot này.
  - Hệ thống gửi email xác nhận hủy lịch hẹn đến bệnh nhân.

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **BR-55**: Bệnh nhân chỉ có thể hủy lịch hẹn khi trạng thái lịch hẹn cho phép hủy (`BOOKED`) và **phải trước thời hạn chót hủy hẹn (tối thiểu trước 24 giờ so với giờ khám)**.
- **BR-56**: Việc hủy cuộc hẹn phải bảo lưu toàn bộ bản ghi lịch hẹn trong cơ sở dữ liệu (không xóa cứng `DELETE`), cập nhật trạng thái sang `CANCELLED`, lưu vết người hủy, thời điểm hủy và lý do hủy. Lịch hẹn đã hủy không còn hiệu lực để thực hiện tiếp đón.
- **Quy định 24h đối với Bệnh nhân**:
  - Nếu `startsAt - now < 24 giờ`: Bệnh nhân không được tự ý hủy trên giao diện web. Hệ thống hiển thị thông báo yêu cầu liên hệ trực tiếp hotline hoặc bàn tiếp tân nếu có trường hợp bất khả kháng.
  - Tiếp tân/Quản lý có thể có thẩm quyền xem xét hủy trong trường hợp khẩn cấp (có ghi rõ lý do nội bộ).

---

## 4. Luồng Thực Hiện (Flow of Events)

### 4.1. Luồng chính (Normal Flow)
1. Bệnh nhân truy cập danh sách "Lịch hẹn của tôi" (`/my-appointments`) hoặc Tiếp tân tìm kiếm lịch hẹn tại `/reception/appointments`.
2. Người dùng chọn lịch hẹn có trạng thái `BOOKED` và bấm nút "Hủy Lịch Hẹn" (Cancel Appointment).
3. Hệ thống kiểm tra điều kiện thời gian:
   - Tính toán khoảng cách thời gian từ thời điểm hiện tại đến `startsAt` của slot hẹn.
   - Nếu `>= 24 giờ`, cho phép mở Modal Hủy hẹn.
4. Giao diện hiển thị Modal xác nhận hủy hẹn:
   - Tóm tắt thông tin: Mã hẹn, Bác sĩ, Ngày giờ khám.
   - Form chọn/nhập lý do hủy (Select dropdown: *"Thay đổi kế hoạch cá nhân"*, *"Đã khỏi bệnh"*, *"Khác"* + Textarea ghi chú).
5. Người dùng nhấn nút "Xác Nhận Hủy".
6. Frontend gửi request `POST /api/v1/appointments/{id}/cancel` kèm lý do hủy đến Backend.
7. Backend kiểm tra tính hợp lệ:
   - Kiểm tra quyền sở hữu (Bệnh nhân chỉ hủy lịch của chính mình).
   - Kiểm tra trạng thái hiện tại phải là `BOOKED`.
   - Kiểm tra điều kiện thời gian tối thiểu 24 giờ (đối với Bệnh nhân).
8. Backend thực hiện cập nhật CSDL:
   - `status = 'CANCELLED'`
   - `cancelled_at = LocalDateTime.now()`
   - `cancelled_by_account_id = currentAccountId`
   - `cancellation_reason = reason`
9. Backend kích hoạt dịch vụ gửi Email thông báo lịch hẹn đã bị hủy.
10. Backend trả về `HTTP 200 OK`.
11. Frontend cập nhật trạng thái lịch hẹn trên giao diện sang badge màu đỏ `CANCELLED`, hiển thị thông báo thành công: *"Lịch hẹn đã được hủy thành công."*

### 4.2. Luồng ngoại lệ & Luồng phụ (Alternative & Exception Flows)
- **3.a. Hủy muộn hơn quy định 24 giờ (Vi phạm deadline)**:
  - Bệnh nhân bấm hủy khi còn dưới 24 giờ trước giờ khám.
  - Nút Hủy bị disable trên giao diện hoặc Backend từ chối với mã `HTTP 400 Bad Request`:
    *"Không thể hủy lịch hẹn do đã quá thời hạn cho phép (yêu cầu tối thiểu trước 24 giờ). Vui lòng liên hệ hotline viện để được hỗ trợ."*
- **7.a. Lịch hẹn không ở trạng thái BOOKED**:
  - Lịch hẹn đã bị hủy trước đó hoặc bệnh nhân đã check-in.
  - Backend trả về lỗi `HTTP 400 Bad Request`: *"Trạng thái lịch hẹn không hợp lệ để hủy."*
- **7.b. Không có quyền hủy**:
  - Bệnh nhân A cố tình gửi ID cuộc hẹn của Bệnh nhân B.
  - Backend trả về lỗi `HTTP 403 Forbidden`: *"Bạn không có quyền thao tác trên lịch hẹn này."*

---

## 5. Đặc Tả Giao Diện Người Dùng (UI/UX - ReactJS)
- **Vị trí nút Hủy**:
  - Trong thẻ cuộc hẹn sắp tới ở trang Dashboard của bệnh nhân hoặc màn hình Chi tiết lịch hẹn.
  - Nút màu đỏ/viền đỏ: *"Hủy lịch hẹn"*.
  - Nếu thời gian còn lại < 24h: Nút chuyển sang trạng thái disabled kèm Tooltip giải thích: *"Chỉ được hủy trước giờ khám tối thiểu 24 giờ"*.
- **Modal Hủy lịch hẹn**:
  - Icon cảnh báo màu đỏ.
  - Cảnh báo: *"Bạn có chắc chắn muốn hủy lịch hẹn [Mã hẹn] không? Hành động này không thể hoàn tác và khung giờ của bạn sẽ được nhường cho người khác."*
  - Dropdown: *"Lý do hủy (bắt buộc)"*.
  - Textarea: *"Chi tiết lý do (tùy chọn)"*.
  - 2 nút: *"Giữ lại lịch"* và *"Xác nhận Hủy"*.

---

## 6. Đặc Tả API & Backend (Spring Boot)

### 6.1. Chi tiết API
- **Endpoint**: `POST /api/v1/appointments/{id}/cancel`
- **Quyền truy cập (Auth)**: `@PreAuthorize("hasAnyRole('PATIENT', 'RECEPTIONIST', 'ADMIN')")`
- **Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

#### Request Body
```json
{
  "reason": "Bận lịch công tác đột xuất vào ngày mai"
}
```

#### Response Body (Thành công - HTTP 200 OK)
```json
{
  "success": true,
  "message": "Hủy lịch hẹn thành công",
  "data": {
    "appointmentId": 1052,
    "appointmentCode": "APPT-20261102-K9F4",
    "status": "CANCELLED",
    "cancelledAt": "2026-11-02T08:00:00",
    "cancellationReason": "Bận lịch công tác đột xuất vào ngày mai"
  }
}
```

#### Response Body (Lỗi vi phạm thời hạn 24h - HTTP 400 Bad Request)
```json
{
  "success": false,
  "errorCode": "CANCELLATION_DEADLINE_EXCEEDED",
  "message": "Không thể hủy lịch hẹn trong vòng 24 giờ trước thời điểm bắt đầu khám"
}
```

---

## 7. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Tiếp tân hoặc Quản trị viên khi hủy lịch hẹn có bị ràng buộc mốc 24h giống Bệnh nhân không, hay được quyền hủy bất kỳ lúc nào nếu có sự cố bất khả kháng? ]
- [ CẦN XÁC NHẬN: Nếu bệnh nhân đã thanh toán trực tuyến trước đó, chính sách hoàn tiền khi hủy trước 24h được thực hiện tự động qua cổng thanh toán VNPay hay bệnh nhân phải liên hệ quầy tài chính để nhận lại? ]

