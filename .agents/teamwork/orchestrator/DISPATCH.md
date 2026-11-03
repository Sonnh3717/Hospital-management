# Dispatch Log

## 2026-11-02T17:04:03Z

Sender: 496aee45-8bfc-4074-9858-9b4cfa164699
Priority: MESSAGE_PRIORITY_HIGH

Triển khai các tính năng cho hệ thống quản lý bệnh viện phục vụ showcase đồ án môn học, bao gồm landing page giới thiệu, đăng ký bệnh nhân xác thực OTP qua email thực tế, đăng nhập đa vai trò, và các màn hình quản trị theo vai trò cho bệnh nhân, lễ tân và bác sĩ.

Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management
Integrity mode: development

## Requirements

### R1. Landing Page
- Trang giới thiệu bệnh viện với giao diện đẹp mắt, thẩm mỹ, cung cấp thông tin tổng quan giới thiệu bệnh viện.
- Topbar hiển thị rõ ràng mục Đăng nhập và Đăng ký.

### R2. Đăng ký tài khoản và thông tin bệnh nhân
- Form đăng ký gồm 2 phần:
  1. User account: username, email, password. Hệ thống gửi mã OTP xác nhận đến email qua dịch vụ SMTP; người dùng phải xác nhận OTP thành công thì mới được chuyển sang bước tiếp theo.
  2. Patient information: bao gồm các thông tin có trong bảng `patient` (các trường thông tin của chính bệnh nhân là bắt buộc / required, các thông tin của người khác là tùy chọn / optional).

### R3. Đăng nhập đa vai trò
- Hỗ trợ đăng nhập cho 3 vai trò: Patient (Bệnh nhân), Receptionist (Lễ tân), và Doctor (Bác sĩ).
- Người dùng có thể chọn đăng nhập bằng (Email + Password) hoặc (Username + Password).
- Màn hình đăng nhập hiển thị mục "Quên mật khẩu" với đường dẫn `#` (không cần implement logic) và nút chuyển sang Đăng ký.
- Sau khi đăng nhập thành công, mỗi vai trò được chuyển hướng đến một màn hình riêng tương ứng.

### R4. Màn hình Bệnh nhân (Patient)
- Sidebar bao gồm:
  1. Đặt lịch hẹn: Form booking (hiện tại hiển thị trang/form placeholder đơn giản thông báo tính năng đang phát triển).
  2. Quản lý lịch hẹn: Người dùng có thể tìm kiếm và xem danh sách các lịch hẹn của mình, xem chi tiết lịch hẹn, hủy cuộc hẹn và đặt lịch lại cuộc hẹn.

### R5. Màn hình Lễ tân (Receptionist)
- Sidebar bao gồm:
  1. Tạo hẹn khám walk-in: Form booking (hiện tại hiển thị trang/form placeholder đơn giản thông báo tính năng đang phát triển).
  2. Quản lý lịch hẹn: Tìm kiếm và xem danh sách lịch hẹn toàn viện, xem chi tiết lịch hẹn, đặt lại lịch hẹn, hủy lịch hẹn, và thực hiện Check-in lịch hẹn (Check-in Appointment).
  3. Quản lý bệnh nhân: Đầy đủ thao tác tìm kiếm và xem danh sách bệnh nhân của bệnh viện, xem thông tin chi tiết, chỉnh sửa thông tin, thêm mới bệnh nhân, và kích hoạt / vô hiệu hóa (active/deactivate) bệnh nhân.

### R6. Màn hình Bác sĩ (Doctor)
- Hiển thị layout cơ bản riêng cho vai trò Doctor với thông báo chào mừng / dashboard placeholder sau khi đăng nhập.

## Acceptance Criteria

### Landing Page & Navigation
- [ ] Truy cập trang chủ hiển thị Landing Page giới thiệu bệnh viện với topbar chứa liên kết Đăng nhập và Đăng ký.
- [ ] Nút Đăng nhập và Đăng ký trên topbar điều hướng chính xác đến trang Đăng nhập và Đăng ký tương ứng.

### Authentication & Registration
- [ ] Form đăng ký yêu cầu nhập username, email, password và gửi mã OTP qua SMTP đến email đăng ký.
- [ ] Nhập sai hoặc chưa xác thực OTP sẽ ngăn không cho chuyển sang bước điền thông tin bệnh nhân.
- [ ] Xác thực OTP thành công cho phép chuyển sang bước điền thông tin bệnh nhân, phân định rõ các trường bắt buộc của chính bệnh nhân và các trường tùy chọn của người khác theo bảng `patient`.
- [ ] Hoàn tất đăng ký lưu trữ chính xác thông tin tài khoản và thông tin bệnh nhân vào cơ sở dữ liệu.
- [ ] Người dùng thuộc các vai trò Patient, Receptionist, Doctor đăng nhập thành công với cả hai hình thức: username + password hoặc email + password.
- [ ] Màn hình đăng nhập hiển thị liên kết "Quên mật khẩu" (`href="#"`) và liên kết chuyển sang trang Đăng ký.

### Role-Based Views & Patient Features
- [ ] Đăng nhập với tài khoản Patient điều hướng đến giao diện bệnh nhân có sidebar gồm: Đặt lịch hẹn và Quản lý lịch hẹn.
- [ ] Chức năng Đặt lịch hẹn của Patient hiển thị form/giao diện placeholder thông báo tính năng đang phát triển.
- [ ] Chức năng Quản lý lịch hẹn của Patient hỗ trợ tìm kiếm, xem danh sách lịch hẹn của chính bệnh nhân, xem chi tiết lịch hẹn, hủy lịch hẹn và đặt lịch lại cuộc hẹn.

### Receptionist Features
- [ ] Đăng nhập với tài khoản Receptionist điều hướng đến giao diện lễ tân có sidebar gồm: Tạo hẹn khám walk-in, Quản lý lịch hẹn, và Quản lý bệnh nhân.
- [ ] Chức năng Tạo hẹn khám walk-in hiển thị form/giao diện placeholder thông báo tính năng đang phát triển.
- [ ] Chức năng Quản lý lịch hẹn của Receptionist hỗ trợ tìm kiếm, xem danh sách lịch hẹn toàn viện, xem chi tiết, đặt lịch lại, hủy lịch hẹn, và check-in lịch hẹn.
- [ ] Chức năng Quản lý bệnh nhân của Receptionist hỗ trợ tìm kiếm, xem danh sách bệnh nhân, xem chi tiết, thêm mới bệnh nhân, sửa thông tin bệnh nhân, và active/deactivate bệnh nhân.

### Doctor View
- [ ] Đăng nhập với tài khoản Doctor điều hướng đến giao diện riêng của Doctor hiển thị layout chào mừng / placeholder.
