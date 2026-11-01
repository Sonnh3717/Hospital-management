# Đặc Tả Tính Năng: Trang Chủ Công Khai (Landing Page)

## 1. Thông Tin Chung
- **Mã Use Case**: Cổng thông tin công khai (Public Portal / Landing Page)
- **Tác Nhân (Actors)**:
  - Khách vãng lai (Guest)
  - Bệnh nhân (Patient)
- **Mô Tả**:
  Trang chủ cung cấp thông tin tổng quan về Bệnh viện Da liễu, giới thiệu các dịch vụ khám chữa bệnh da liễu nổi bật, danh sách bác sĩ chuyên khoa có lịch làm việc công khai, quy trình tiếp đón và các nút kêu gọi hành động (Call To Action - CTA) như "Đặt lịch khám ngay" hoặc "Đăng nhập / Đăng ký".

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Không yêu cầu đăng nhập. Bất kỳ ai có trình duyệt web đều có thể truy cập URL gốc `/`.
- **Hậu điều kiện (Postconditions)**:
  - Người dùng nắm bắt được thông tin bệnh viện, chuyên khoa da liễu, giá dịch vụ công khai và có thể điều hướng sang luồng Đặt lịch khám (`/booking`) hoặc Đăng nhập (`/login`).

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **BR-36**: Thông tin y tế công khai chỉ chứa các dữ liệu được chỉ định cho phép truy cập công cộng và tuyệt đối không làm lộ thông tin cá nhân của bệnh nhân hoặc hồ sơ bệnh án nội bộ.
- **BR-40**: Mỗi dịch vụ y tế trong danh mục công khai phải có mã định danh duy nhất, tên dịch vụ, đơn giá niêm yết rõ ràng.
- **BR-48**: Danh sách bác sĩ hiển thị công khai chỉ bao gồm các bác sĩ có hồ sơ được đánh dấu cho phép hiển thị (`is_active = true` và hồ sơ công khai). Không để lộ thông tin liên lạc cá nhân hay dữ liệu nhân sự nội bộ.

---

## 4. Luồng Thực Hiện & Các Khối Chức Năng (Blocks)

### 4.1. Khối Header / Navigation
- Logo bệnh viện, tên bệnh viện Da liễu.
- Menu điều hướng: Trang chủ, Giới thiệu, Chuyên khoa & Dịch vụ, Đội ngũ Bác sĩ, Hướng dẫn khám bệnh, Liên hệ.
- Nút CTA: "Đặt Lịch Khám" (nổi bật) và "Đăng Nhập / Đăng Ký".

### 4.2. Khối Hero Banner
- Slogan & thông điệp chính của bệnh viện: Chăm sóc & điều trị da liễu chuyên sâu, công nghệ hiện đại.
- Nút bấm trực tiếp: *"Đặt Lịch Khám Ngay"* -> Dẫn tới trang tạo lịch hẹn (`/booking`).

### 4.3. Khối Danh Sách Dịch Vụ Khám Da Liễu Nổi Bật
- Gọi API `GET /api/v1/public/services` để lấy danh mục dịch vụ đang áp dụng: Khám da liễu tổng quát, Trị mụn chuyên sâu, Laser thẩm mỹ, Soi da kỹ thuật số,...
- Hiển thị: Tên dịch vụ, mô tả ngắn, giá niêm yết tham khảo (VND), nút *"Chọn dịch vụ để đặt lịch"*.

### 4.4. Khối Đội Ngũ Bác Sĩ Chuyên Khoa
- Gọi API `GET /api/v1/public/doctors` để hiển thị thẻ bác sĩ (Doctor Cards).
- Hiển thị: Ảnh đại diện, Học hàm/Học vị (BSCKI, ThS, TS), Họ tên, Chuyên khoa, Số năm kinh nghiệm.
- Bấm vào bác sĩ -> Có thể mở modal xem tiểu sử tóm tắt hoặc bấm *"Đặt lịch với bác sĩ này"*.

### 4.5. Khối Quy Trình Đặt Khám & Tiếp Đón (How It Works)
- 4 bước trực quan:
  1. *Chọn dịch vụ & Bác sĩ*
  2. *Chọn ngày & khung giờ trống*
  3. *Điền thông tin & Nhận mã hẹn (QR Code)*
  4. *Đến bệnh viện tiếp đón & Khám bệnh*

### 4.6. Khối Footer
- Địa chỉ cơ sở bệnh viện, Hotline khẩn cấp, Email liên hệ, Thời gian làm việc (Ví dụ: 07:30 - 17:00 từ Thứ 2 đến Thứ 7).
- Bản đồ Google Maps chỉ đường (nếu có).

---

## 5. Đặc Tả API & Backend (Spring Boot)

### 5.1. API Lấy Danh Mục Dịch Vụ Công Khai
- **Endpoint**: `GET /api/v1/public/medical-services`
- **Auth**: Public (`permitAll()`)
- **Response sample (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "serviceId": 1,
      "serviceCode": "SRV_EXAM_GEN",
      "serviceName": "Khám Da Liễu Tổng Quát",
      "price": 200000.00,
      "description": "Thăm khám lâm sàng, tư vấn bệnh lý về da liễu."
    }
  ]
}
```

### 5.2. API Lấy Danh Sách Bác Sĩ Công Khai
- **Endpoint**: `GET /api/v1/public/doctors`
- **Auth**: Public (`permitAll()`)
- **Response sample (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "doctorId": 3,
      "staffCode": "DOC003",
      "fullName": "BSCKII. Trần Văn Bình",
      "specialization": "Da liễu thẩm mỹ & Trị sẹo",
      "qualification": "Bác sĩ Chuyên khoa II",
      "yearsOfExperience": 12,
      "avatarUrl": "/images/doctors/doc3.jpg"
    }
  ]
}
```

---

## 6. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Trên Landing page có cần hiển thị chức năng "Tra cứu nhanh lịch hẹn" bằng Mã cuộc hẹn / Số điện thoại mà không cần đăng nhập không? Không ]
- [ CẦN XÁC NHẬN: Bệnh viện có hỗ trợ hotline tư vấn trực tuyến hay tiện ích chatbox tư vấn trên Landing Page không? Không]

