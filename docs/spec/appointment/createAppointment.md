# Đặc Tả Tính Năng: Đặt Lịch Khám Người Bệnh Tích Hợp Thanh Toán payOS (Patient Booking & payOS Payment Integration)

## 1. Thông Tin Chung
- **Mã Use Case**: UC40 - Booking Appointment with payOS Online Payment
- **Tác Nhân (Actors)**:
  - Bệnh nhân (Patient) / Khách hàng đăng ký khám
  - Nhân viên Tiếp tân (Receptionist) - quét mã QR tiếp đón khi bệnh nhân đến viện
  - Cổng thanh toán payOS (Payment Gateway Webhook)
- **Mô Tả**:
  Quy trình đặt lịch trực tuyến dành cho bệnh nhân theo mô hình wizard chuẩn 4 bước:
  1. **Bước 1: Thông tin đặt lịch hẹn**: Chọn dịch vụ khám, chọn khám chức danh (học vị/bác sĩ), chọn Bác sĩ cụ thể (tùy chọn), chọn ngày khám & ca khám (Sáng sớm, Ca sáng, Ca chiều), nhập lý do khám, tải ảnh triệu chứng da (nếu có), lựa chọn nhận chỉ dẫn chăm sóc da.
  2. **Bước 2: Thông tin khách hàng**: Phân loại *Khách hàng đã từng khám* (tra cứu qua SĐT/CCCD/Mã BN) hoặc *Khách hàng mới* (Họ tên, Giới tính, Ngày sinh, Dân tộc, SĐT, CCCD, Email, Địa chỉ, Cam kết bảo vệ dữ liệu).
  3. **Bước 3: Thanh toán trực tuyến (payOS)**: Hệ thống tính giá khám (ví dụ: trong giờ 200.000đ, ngoài giờ 280.000đ), tạo liên kết thanh toán payOS, hiển thị mã QR VietQR chuẩn NAPAS để bệnh nhân quét thanh toán qua ứng dụng ngân hàng/ví điện tử.
  4. **Bước 4: Hoàn thành & Xuất phiếu khám**: Ngay sau khi payOS xác nhận thanh toán thành công (qua Webhook hoặc polling kiểm tra), hệ thống xác nhận lịch hẹn chính thức (`status = 'BOOKED'`), hiển thị phiếu khám bệnh, mã cuộc hẹn (`appointment_code`) và **Mã QR Code** để tiếp tân tại quầy quét check-in tiếp đón khi bệnh nhân đến bệnh viện.

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Bệnh nhân truy cập chức năng Đặt lịch khám trên Website.
  - Bệnh viện có lịch làm việc và khung giờ trống (`AppointmentSlot`) của Bác sĩ / Ca khám tương ứng.
  - Hệ thống đã cấu hình tích hợp payOS (`PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`).
- **Hậu điều kiện (Postconditions)**:
  - Giao dịch thanh toán được ghi nhận trong bảng `payments` (`provider = 'PAYOS'`, `amount = <Giá khám>`, `status = 'SUCCEEDED'`).
  - Lịch hẹn được xác nhận trong bảng `appointments` (`status = 'BOOKED'`, `booking_source = 'ONLINE'`).
  - Hệ thống sinh mã `appointment_code` và ảnh mã QR Code chứa thông tin đặt hẹn.
  - Gửi email xác nhận kèm vé khám điện tử và QR Code đến hòm thư của bệnh nhân.

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **BR-PAYOS-01 (Thanh toán trước khi xác nhận lịch online)**:
  - Khi bệnh nhân đặt lịch online, hệ thống tạo bản ghi giữ chỗ tạm thời (Reserved Slot).
  - Khách hàng có tối đa 15 phút để hoàn tất quét mã VietQR qua payOS.
  - Nếu thanh toán thành công trong 15 phút: Cuộc hẹn chính thức chuyển sang `BOOKED`.
  - Nếu quá 15 phút không thanh toán: Giao dịch bị hủy (`CANCELLED`) và khung giờ khám được giải phóng cho bệnh nhân khác.
- **BR-PAYOS-02 (Cơ chế giá khám theo chức danh & khung giờ)**:
  - Giá khám được xác định theo chức danh chuyên môn của bác sĩ và thời điểm khám:
    - *Khám Thạc sĩ / BSCKI / BSNT*: Trong giờ `200.000 VND`, Ngoài giờ (Sáng sớm/Cuối tuần) `280.000 VND`.
    - *Khám Tiến sĩ / BSCKII*: Trong giờ `300.000 VND`, Ngoài giờ `400.000 VND`.
    - *Khám Giáo sư / Phó Giáo sư*: Trong giờ `450.000 VND`, Ngoài giờ `600.000 VND`.
- **BR-PAYOS-03 (Webhook xác thực chữ ký payOS)**:
  - Webhook từ payOS gọi về Backend phải được xác thực chữ ký HMAC_SHA256 (`signature`) sử dụng `CHECKSUM_KEY` của payOS trước khi cập nhật trạng thái thanh toán và kích hoạt lịch hẹn.
- **BR-PAYOS-04 (Mã QR tiếp đón tại quầy)**:
  - Mã QR hiển thị trên phiếu khám bệnh sau thanh toán chứa chuỗi dữ liệu định danh an toàn:
    `{"code": "APPT-20261102-X9F4", "patient": "Nguyễn Hoàng Yến", "dob": "1998-05-12", "sig": "..."}`.
  - Thiết bị máy quét Barcode/QR của Tiếp tân quét mã này sẽ tự động tải màn hình Check-in (UC20) trong thời gian dưới 500ms.

---

## 4. Đặc Tả Chi Tiết 4 Bước Giao Diện Người Dùng (UI/UX Flow - ReactJS)

### 4.1. Thanh tiến trình (Stepper Bar)
Hiển thị 4 nấc nối nhau trên cùng:
1. `Thông tin đặt lịch hẹn` (Active ở bước 1)
2. `Thông tin khách hàng` (Active ở bước 2)
3. `Thanh toán` (Active ở bước 3)
4. `Hoàn thành` (Active ở bước 4)

---

### 4.2. Khối Tóm Tắt Chi Phí & Thông Tin (Top Summary Box)
Xuất hiện xuyên suốt từ Bước 1 đến Bước 3 để bệnh nhân luôn nắm rõ thông tin:
- **Header nền xanh dương**:
  - `Thông tin đặt lịch` | `Thông tin khách hàng`
- **Giá khám nổi bật**: `Giá khám: 280.000 VND` (Màu đỏ in đậm lớn)
- **Thông tin chi tiết**:
  - Dịch vụ: *Khám yêu cầu (Khoa khám bệnh)*
  - Khám chức danh: *Thạc sĩ/BS CKI/BSNT - Trong giờ: 200.000đ - Ngoài giờ: 280.000đ*
  - Bác sĩ: *Ths. BS LÊ THỊ MAI*
  - Ngày: *02/11/2026*, Lúc: *Sáng Sớm (06:00 - 07:30)*
  - Lý do khám: *...*

---

### 4.3. BƯỚC 1: THÔNG TIN ĐẶT LỊCH HẸN
*(Khớp chính xác với ảnh mẫu thiết kế 1)*
- **Dịch vụ (`*`)**: Dropdown chọn dịch vụ khám (ví dụ: *Khám yêu cầu (Khoa khám bệnh)*, *Khám Da liễu thường*, *Khám thẩm mỹ công nghệ cao*).
- **Khám chức danh (`*`)**: Dropdown chọn cấp bậc chuyên môn:
  - *Thạc sĩ/BS CK I/BSNT - Trong giờ: 200.000đ - Ngoài giờ: 280.000đ*
  - *Tiến sĩ/BS CK II - Trong giờ: 300.000đ - Ngoài giờ: 400.000đ*
- **Bác sĩ (không bắt buộc chọn)**: Dropdown lọc theo chức danh đã chọn (hoặc chọn *"Bệnh viện tự động sắp xếp bác sĩ"*).
- **Thời gian khám (`*`)**:
  - **Dãy nút chọn ngày khám**: Các thẻ ngày ngang (Ví dụ: `02/11 Thứ 2` [Active - xanh dương], `03/11 Thứ 3`, `04/11 Thứ 4`, `05/11 Thứ 5`,...).
  - **Dãy nút chọn ca khám**:
    - `Sáng Sớm (06:00 - 07:30)` (Ngoài giờ)
    - `Ca Sáng (07:30 - 12:30)` (Trong giờ)
    - `Ca Chiều (13:30 - 16:30)` (Trong giờ)
- **Lý do khám (`*`)**: Ô nhập văn bản (textarea, tối đa 500 ký tự): *"Triệu chứng của bạn (giới hạn 100 ký tự hiển thị gợi ý)"*.
- **Hình ảnh triệu chứng (nếu có)**:
  - Nút bấm *"Tải lên"* (Cho phép chọn ảnh chụp tổn thương da từ máy tính hoặc camera điện thoại).
- **Khảo sát hỗ trợ**:
  - Câu hỏi: *"Bạn có muốn nhận chỉ dẫn hỗ trợ điều trị bằng các sản phẩm chăm sóc da? (*)"*
  - Radio options: `Có nhận` / `Không nhận`.
- **Nút hành động**:
  - Nút to màu xanh đậm: *"Tiếp theo"* -> Chuyển sang Bước 2.

---

### 4.4. BƯỚC 2: THÔNG TIN KHÁCH HÀNG
*(Khớp chính xác với ảnh mẫu thiết kế 2)*
- **Nút quay lại góc trên phải**: `<< Quay lại`
- **Loại khách hàng**:
  - Radio button: `Khách hàng đã từng khám` / `Khách hàng mới` (Mặc định chọn Khách hàng mới).
  - *Nếu chọn "Đã từng khám"*: Hiện ô nhập SĐT hoặc Mã bệnh nhân để bấm tra cứu tự động điền.
- **Dòng lưu ý màu đỏ**:
  > *\* Lưu ý: Bạn phải nhập đúng, đủ thông tin cá nhân như: Họ và tên, ngày tháng năm sinh theo căn cước công dân thì phiếu khám mới được chấp nhận.*
- **Các trường thông tin bắt buộc**:
  - **Họ và tên (`*`)**: Input text, placeholder *"HỌ VÀ TÊN ĐẦY ĐỦ CÓ DẤU"*.
  - **Giới tính (`*`)**: Dropdown chọn `Nam` / `Nữ` / `Khác`.
  - **Ngày tháng năm sinh (`*`)**: Input date (hoặc text format `DD/MM/YYYY`).
  - **Dân tộc (`*`)**: Dropdown (Kinh, Tày, Thái, Mường, Khác,...).
  - **Số điện thoại (`*`)**: Input phone 10 chữ số.
  - **Số định danh (CCCD)**: Input text 12 chữ số. Dòng chú thích đỏ: *"Trẻ em chưa có CCCD: Vui lòng nhập Số định danh (xem trên Giấy khai sinh hoặc VNeID)."*
  - **Email**: Input email. Dòng chú thích đỏ: *"Lưu ý: Bạn hãy nhập đúng email bạn đang sử dụng để nhận kết quả khám Online."*
  - **Địa chỉ**:
    - **Tỉnh/Thành phố (`*`)**: Dropdown chọn Tỉnh/Thành.
    - **Phường/xã (`*`)**: Dropdown chọn Quận/Huyện, Phường/Xã.
    - **Số nhà**: Input text địa chỉ cụ thể (thôn/xóm/số nhà, tên đường).
- **Điều khoản & Bảo mật**:
  - Checkbox bắt buộc: `[x] Tôi đã đọc và đồng ý với Chính sách bảo vệ dữ liệu cá nhân của Dalieu.vn và chấp thuận để Dalieu.vn xử lý dữ liệu cá nhân của tôi theo quy định của pháp luật về bảo vệ dữ liệu cá nhân. (*)`
- **Xác thực bảo mật**:
  - Hộp kiểm reCAPTCHA: *"Tôi không phải là người máy"*.
- **Nút hành động**:
  - Nút bên trái: *"Quay lại"*
  - Nút bên phải (Xanh đậm): *"Đăng ký khám"* -> Chuyển sang Bước 3 (Thanh toán).

---

### 4.5. BƯỚC 3: THANH TOÁN QUA CỔNG payOS
- **Hiển thị thông tin thanh toán**:
  - Mã đơn thanh toán / Mã lịch hẹn.
  - Số tiền thanh toán: `280.000 VND`.
  - Nội dung chuyển khoản: Tự động điền theo định dạng của payOS (ví dụ: `HOSPITAL 1052`).
- **Giao diện quét mã QR VietQR (payOS Embedded Checkout)**:
  - Nhúng cổng thanh toán payOS hoặc hiển thị trực tiếp ảnh mã QR động sinh bởi payOS API.
  - Logo các ngân hàng liên minh Napas247, VietinBank/MBBank.
  - Đồng hồ đếm ngược thời gian giữ chỗ: `14:59` phút.
  - Hướng dẫn: *"Mở ứng dụng Ngân hàng (Vietcombank, MB, Techcombank, VPBank,...) hoặc Ví điện tử để quét mã thanh toán."*
- **Cơ chế kiểm tra tự động**:
  - Frontend thiết lập cơ chế lắng nghe WebSocket hoặc Polling mỗi 3 giây gọi API `GET /api/v1/payments/{paymentId}/status` để kiểm tra trạng thái thanh toán.
  - Khi người dùng chuyển khoản xong, màn hình tự động chuyển sang Bước 4 mà không cần người dùng bấm gì thêm.

---

### 4.6. BƯỚC 4: HOÀN THÀNH & XUẤT PHIẾU KHÁM KÈM MÃ QR
- **Biểu tượng**: Dấu tích tròn màu xanh lá cây, tiêu đề *"ĐẶT LỊCH VÀ THANH TOÁN THÀNH CÔNG!"*.
- **Phiếu Khám Bệnh Điện Tử (Electronic Medical Examination Slip)**:
  - **Mã cuộc hẹn**: `APPT-20261102-K9F4` (In đậm to).
  - **Mã QR Tiếp Đón**: Ảnh QR Code kích thước lớn và rõ nét, có hướng dẫn:
    > *"Vui lòng lưu lại mã QR này hoặc đưa màn hình điện thoại cho nhân viên Tiếp tân tại quầy khi đến khám để được tiếp đón ưu tiên."*
  - **Tóm tắt phiếu khám**:
    - Người khám: `Nguyễn Hoàng Yến` - Giới tính: `Nữ` - Ngày sinh: `12/05/1998`
    - Bác sĩ phụ trách: `Ths. BS LÊ THỊ MAI` - Phòng khám: `Phòng 204`
    - Thời gian hẹn: `06:30, Thứ Hai ngày 02/11/2026`
    - Dịch vụ: `Khám yêu cầu (Ngoài giờ)`
    - Tình trạng phí: `ĐÃ THANH TOÁN (Qua payOS - 280.000 VNĐ)`
- **Các nút chức năng**:
  - Nút: *"Tải phiếu khám (PDF/Ảnh QR)"*.
  - Nút: *"Xem lịch hẹn của tôi"*.
  - Nút: *"Về trang chủ"*.

---

## 5. Đặc Tả Tích Hợp Kỹ Thuật (Spring Boot & payOS SDK / REST API)

### 5.1. Luồng Tương Tác Giữa Các Hệ Thống
```
[ReactJS Client]                 [Spring Boot Backend]                  [payOS Gateway]
       │                                   │                                  │
       │─── 1. POST /appointments/reserve ─>│                                  │
       │    (Dữ liệu Bước 1 & Bước 2)       │─── 2. Tạo Payment Link ─────────>│
       │                                   │    (orderCode, amount, desc)     │
       │                                   │<── 3. Trả về checkoutUrl & QR ───│
       │<── 4. Trả về QR & paymentLink ────│                                  │
       │                                   │                                  │
       │ [Bệnh nhân quét mã VietQR]        │                                  │
       │                                   │<─── 5. Webhook thanh toán thành công
       │                                   │    (Xác thực chữ ký HMAC-SHA256) │
       │                                   │─── 6. Cập nhật Payment=SUCCEEDED │
       │                                   │       Cập nhật Appt=BOOKED       │
       │                                   │       Sinh QR tiếp đón & gửi Mail│
       │                                   │                                  │
       │─── 7. Poll/WS /payment-status ───>│                                  │
       │<── 8. Báo thành công (Bước 4) ────│                                  │
```

### 5.2. Các Endpoint API Chi Tiết

#### A. Khởi tạo đặt lịch & tạo giao dịch payOS
- **Endpoint**: `POST /api/v1/appointments/booking-checkout`
- **Auth**: Public hoặc Patient (`permitAll()` hoặc Authenticated)
- **Request Payload**:
```json
{
  "serviceId": 1,
  "appointmentSlotId": 605,
  "doctorId": 204,
  "reason": "Nổi mẩn đỏ ngứa vùng má và cằm 3 ngày nay",
  "skinCareGuideConsent": true,
  "patientInfo": {
    "isExisting": false,
    "fullName": "Nguyễn Hoàng Yến",
    "gender": "FEMALE",
    "dateOfBirth": "1998-05-12",
    "ethnicity": "Kinh",
    "phoneNumber": "0987654321",
    "identityCardNumber": "001198012345",
    "email": "hoangyen.nguyen@example.com",
    "province": "Hà Nội",
    "district": "Cầu Giấy",
    "address": "Số 12 ngõ 45 phố Trần Thái Tông"
  }
}
```

- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "appointmentId": 1052,
    "appointmentCode": "APPT-20261102-K9F4",
    "orderCode": 105201,
    "amount": 280000,
    "paymentStatus": "PENDING",
    "checkoutUrl": "https://pay.payos.vn/web/...",
    "qrCode": "00020101021238540010A000000727012400069704220110105201...",
    "expiresAt": "2026-11-01T22:35:00"
  }
}
```

#### B. Webhook nhận thông báo từ payOS
- **Endpoint**: `POST /api/v1/payments/payos-webhook`
- **Auth**: `permitAll()`
- **Xử lý Backend**:
  1. Đọc dữ liệu payload từ payOS.
  2. Xác thực trường `signature` bằng thuật toán SHA256 HMAC với `PAYOS_CHECKSUM_KEY`.
  3. Tìm kiếm giao dịch trong bảng `payments` theo `orderCode` / `payment_reference`.
  4. Nếu `code == "00"` (Thành công):
     - `payments.status = 'SUCCEEDED'`
     - `payments.completed_at = NOW()`
     - `appointments.status = 'BOOKED'`
     - Kích hoạt gửi email xác nhận đặt hẹn kèm mã QR tiếp đón.
  5. Trả về `{ "success": true }` cho payOS.

#### C. Tra cứu trạng thái thanh toán từ Client
- **Endpoint**: `GET /api/v1/appointments/{appointmentId}/payment-status`
- **Response**:
```json
{
  "success": true,
  "data": {
    "appointmentId": 1052,
    "appointmentCode": "APPT-20261102-K9F4",
    "paymentStatus": "SUCCEEDED",
    "appointmentStatus": "BOOKED",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "patientName": "Nguyễn Hoàng Yến",
    "doctorName": "Ths. BS LÊ THỊ MAI",
    "scheduleTime": "06:30 02/11/2026",
    "roomNumber": "Phòng 204"
  }
}
```

---

## 6. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Bạn đã có thông tin Client ID, API Key và Checksum Key từ trang quản trị payOS (Dashboard) chưa? Chúng ta sẽ cấu hình các biến này trong file `application.properties` hay biến môi trường `.env`? lưu trong .env ]
- [ CẦN XÁC NHẬN: Phần tải hình ảnh triệu chứng (Upload ảnh): Ảnh sẽ được lưu trữ cục bộ trên server (Multipart local file) hay đẩy lên dịch vụ lưu trữ đám mây (Cloudinary / S3 / GCS)? cloundinary ]
- [ CẦN XÁC NHẬN: Khi thanh toán thành công, có cần tích hợp gửi SMS / Zalo ZNS thông báo mã QR cho bệnh nhân không, hay chỉ cần hiển thị trực tiếp trên web và gửi email? gửi email nội dung là page html chứa thông tin và qr là được].
