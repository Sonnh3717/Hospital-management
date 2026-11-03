# TÀI LIỆU TOÀN DIỆN VỀ CÁC TÍNH NĂNG VÀ MÃ NGUỒN ĐÃ TRIỂN KHAI
## Hệ Thống Quản Lý Bệnh Viện (Hospital Management System - SWD392)

---

## 📌 Giới thiệu tổng quan

Tài liệu này ghi lại chi tiết toàn bộ các mã nguồn, tệp tin, lớp (classes), hàm (functions/methods), biến (variables/fields), hooks, và cấu hình cơ sở dữ liệu đã được triển khai phục vụ cho buổi showcase đồ án môn học.

Toàn bộ hệ thống được xây dựng trên kiến trúc Client-Server hiện đại:
- **Backend**: Java 17 + Spring Boot 4 + Spring Security + Spring Data JPA + MySQL + Jakarta Validation.
- **Frontend**: React 18 + Vite + Tailwind CSS + Axios + React Router DOM v6 + Lucide Icons.
- **Bảo mật & Phân quyền**: Stateless Session Bearer Token, Spring Security Role-Based Access Control (`ROLE_PATIENT`, `ROLE_RECEPTIONIST`, `ROLE_DOCTOR`, `ROLE_ADMIN`), chống tấn công IDOR, phòng chống giả mạo quy trình OTP.

---

## 🗂️ Cấu trúc thư mục tài liệu

Folder `project_documentation/` bao gồm các tập tin chi tiết:

| Tập tin | Nội dung chi tiết |
| :--- | :--- |
| [`01_BACKEND_DETAILS.md`](./01_BACKEND_DETAILS.md) | Toàn bộ các file Backend (Controllers, Services, DTOs, Security, Migrations). Chi tiết từng file, class, method, tham số, biến số, và logic nghiệp vụ. |
| [`02_FRONTEND_DETAILS.md`](./02_FRONTEND_DETAILS.md) | Toàn bộ các file Frontend (Components, Layouts, Context, Pages, API Clients). Chi tiết từng component, state variables, hooks, event handlers, props. |
| [`03_DATABASE_AND_SCHEMAS.md`](./03_DATABASE_AND_SCHEMAS.md) | Chi tiết cấu trúc cơ sở dữ liệu MySQL, migration table OTP `registration_verifications`, phân định các trường required/optional của bảng `patient`, và dữ liệu mẫu seed data. |
| [`04_API_ENDPOINTS_DICTIONARY.md`](./04_API_ENDPOINTS_DICTIONARY.md) | Từ điển đặc tả chi tiết 100% các API RESTful: Endpoint, Method, Role Header, Request Body, Query Params, Response DTO. |
| [`05_TEST_SUITES_AND_VERIFICATION.md`](./05_TEST_SUITES_AND_VERIFICATION.md) | Chi tiết các bộ kiểm thử: 117 bài test backend tự động, 46 bài test E2E tích hợp 4 tầng, và 23 bài test đối kháng Tier 5. |

---

## 🌟 Tóm tắt các tính năng cốt lõi đã hoàn thành

1. **R1. Landing Page Giới Thiệu Bệnh Viện**:
   - Giao diện thẩm mỹ cao, giới thiệu bệnh viện đa khoa quốc tế, các chuyên khoa, số liệu thống kê y tế và quy trình khám bệnh.
   - Topbar hiển thị cố định nút **Đăng nhập** và **Đăng ký** (tự chuyển thành tên người dùng khi đã đăng nhập).

2. **R2. Đăng Ký Bệnh Nhân 2 Bước Với Xác Thực OTP Email**:
   - **Bước 1**: Nhập `username` (kiểm tra trùng lặp debounce thời gian thực), `fullName`, `email`, `password`, `confirmPassword`.
   - Hệ thống gửi mã OTP 6 số qua dịch vụ email SMTP (kèm bộ đếm ngược 60 giây). Bắt buộc xác thực OTP thành công mới mở khóa bước tiếp theo.
   - **Bước 2**: Nhập thông tin hồ sơ bệnh nhân theo bảng `patient`:
     - *Bắt buộc (Required)*: Ngày sinh, giới tính, số điện thoại, địa chỉ (của chính bệnh nhân).
     - *Tùy chọn (Optional)*: Tên người liên hệ khẩn cấp, số điện thoại khẩn cấp.
   - Sau khi hoàn thành, kích hoạt tài khoản `ACTIVE` và lưu trữ đồng bộ bảng `user_account` và `patient`.

3. **R3. Đăng Nhập Đa Vai Trò (Multi-Role Login)**:
   - Đăng nhập linh hoạt cho 3 vai trò: **Patient**, **Receptionist**, **Doctor**.
   - Hỗ trợ cả 2 hình thức: **(Email + Password)** hoặc **(Username + Password)**.
   - Hiển thị liên kết *"Quên mật khẩu"* với `href="#"` (kèm modal hướng dẫn) và liên kết sang trang Đăng ký.
   - Sau khi đăng nhập, tự động chuyển hướng chính xác vào workspace riêng của từng vai trò.

4. **R4. Màn Hình Bệnh Nhân (Patient Portal)**:
   - Sidebar gồm: *Đặt lịch hẹn* và *Quản lý lịch hẹn*.
   - **Đặt lịch hẹn**: Form placeholder thông báo tính năng đang nâng cấp và cung cấp thông tin hotline.
   - **Quản lý lịch hẹn**: Tìm kiếm, xem danh sách lịch hẹn của tôi, xem chi tiết (vé khám điện tử), hủy lịch hẹn (ràng buộc trước tối thiểu 24 giờ), và đặt lại lịch hẹn sang khung giờ khả dụng khác.

5. **R5. Màn Hình Lễ Tân (Receptionist Portal)**:
   - Sidebar gồm: *Tạo hẹn khám walk-in*, *Quản lý lịch hẹn*, và *Quản lý bệnh nhân*.
   - **Tạo hẹn khám walk-in**: Form placeholder tiếp đón tại quầy kèm quy trình chuẩn SOP.
   - **Quản lý lịch hẹn**: Tìm kiếm và xem danh sách toàn viện, xem chi tiết, check-in cuộc hẹn tại quầy, hoàn tác check-in, hủy hẹn và đổi lịch hẹn tại quầy (miễn trừ 24h).
   - **Quản lý bệnh nhân (Đầy đủ CRUD)**: Tìm kiếm bệnh nhân theo mã/tên/SĐT/email, xem chi tiết, thêm mới bệnh nhân walk-in, chỉnh sửa thông tin, và bật/tắt kích hoạt (`ACTIVE`/`INACTIVE`).

6. **R6. Màn Hình Bác Sĩ (Doctor Portal)**:
   - Giao diện riêng cho Bác sĩ với banner chào mừng động (*"Chào mừng Bác sĩ, [Họ và tên]!"*), huy hiệu chuyên khoa, thẻ thống kê ca trực và khu vực overview placeholder.

---

## 🔑 Tài khoản kiểm thử nhanh (Demo Seed Accounts)

| Vai trò (Role) | Username | Email | Password | Quyền truy cập |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | `patient` | `patient.demo@hospital.test` | `Password123!` | `/patient/appointments` |
| **Receptionist** | `receptionist` | `receptionist.demo@hospital.test` | `Password123!` | `/reception/appointments`, `/reception/patients` |
| **Doctor** | `doctor` | `doctor.demo@hospital.test` | `Password123!` | `/doctor` |
| **Admin** | `admin` | `admin.demo@hospital.test` | `Password123!` | Toàn quyền hệ thống |

*(Trên màn hình Đăng nhập `http://localhost:5173/login` có sẵn các nút bấm 1 chạm "Tài khoản kiểm thử nhanh" để đăng nhập nhanh chóng khi trình diễn đồ án).*
