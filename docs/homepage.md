# Trang Home — SWD Care

Home nằm tại route `/`, dùng React/Vite và tên tạm **SWD Care**. Bố cục dựa trên
ảnh tham khảo: header, banner y tế, ba mục truy cập nhanh, form thông tin lịch
khám/người khám và footer. Nội dung bằng tiếng Việt, thích ứng với desktop và
mobile. Menu và các liên kết đưa tới vị trí tương ứng trong cùng trang.

## Phạm vi hiện tại

- Không thêm route nghiệp vụ, flow nhiều màn, endpoint, migration hay thay đổi entity.
- Dữ liệu chuyên khoa, bác sĩ và khung giờ trong `appointmentPreview.js` là dữ liệu
  minh họa, ID có tiền tố `preview-`/`preview-slot:` và không đại diện cho record DB.
- Chọn chuyên khoa lọc bác sĩ. Đổi chuyên khoa, bác sĩ hoặc ngày khám xóa khung giờ
  đang chọn; thay đổi thông tin xóa bản xem trước cũ.
- Nút **Xem trước lịch hẹn** kiểm tra dữ liệu và hiển thị tóm tắt trong trang.
  Không gọi API, không ghi DB, không lưu thông tin vào localStorage/sessionStorage.
- Đăng nhập chỉ có tên nút, đang disabled. Liên hệ để “đang cập nhật” vì dự án chưa
  có thông tin chính thức. Chưa triển khai giao diện nội bộ theo vai trò ở sơ đồ.

## Quyết định các trường theo DB

Đối chiếu script `Hospital_Database_28_Tables_MySQL (1).sql` và các entity JPA hiện có.

| Trường UI | Mapping dự kiến | Quyết định |
| --- | --- | --- |
| Chuyên khoa | `doctor_profiles.specialization` | Bắt buộc để lọc bác sĩ; là chuỗi, chưa có bảng chuyên khoa riêng. |
| Bác sĩ | `hospital_staff` + `doctor_profiles` | Bắt buộc; tên lấy từ hồ sơ nhân viên. |
| Ngày và khung giờ | `appointment_slots` → `work_schedules` | Bắt buộc; khi tích hợp, gửi `appointment_slot_id`, suy ra bác sĩ/ngày/giờ qua lịch làm việc. |
| Họ và tên | `patients.full_name` | Bắt buộc; tối đa 150 ký tự, không chấp nhận toàn khoảng trắng. |
| Số điện thoại | `patients.phone` | UI bắt buộc để có thông tin liên hệ; DB cho phép null. Tối đa 25 ký tự, 8–15 chữ số, cho phép dấu + và ký tự phân cách thông dụng. |
| Ngày sinh | `patients.date_of_birth` | Không bắt buộc; không chọn ngày trong tương lai. |
| Giới tính | `patients.gender` | Không bắt buộc; `MALE`, `FEMALE`, `OTHER`, `UNSPECIFIED`; mặc định không cung cấp. |
| Email | `patients.contact_email` | Không bắt buộc; kiểm tra định dạng, tối đa 254 ký tự. |
| Lý do khám | `appointments.reason` | Không bắt buộc theo DB; tối đa 500 ký tự. |

Không có bảng/cột cơ sở khám hoặc quốc tịch, nên chưa đưa trường bệnh viện hay
checkbox người nước ngoài vào form. Schema cũng chưa lưu consent; không thêm
checkbox chấp thuận một chính sách chưa có. Ngày và giờ hiển thị theo
`Asia/Ho_Chi_Minh`, ba ngày gợi ý bắt đầu từ ngày mai. Mốc ngày mai là lựa chọn
cho bản demo, chưa đại diện cho quy tắc đặt lịch thực tế.

Khi triển khai đặt lịch thật, cần tài khoản bệnh nhân vì
`appointments.created_by_account_id` là bắt buộc. Backend phải kiểm tra lịch
`SCHEDULED`, slot `OPEN`, số lịch `BOOKED`/`CHECKED_IN` so với capacity, quy tắc
thời gian đặt và việc chuyển thời gian UTC. Giờ còn chỗ/hết chỗ hiện chỉ minh họa.

## Các file chính

- `frontend/src/pages/HomePage.jsx`: banner và form một trang.
- `frontend/src/data/appointmentPreview.js`: dữ liệu minh họa và ngày giờ Việt Nam.
- `frontend/src/layouts/MainLayout.jsx`: header, menu mobile, footer.
- `frontend/src/components/Icon.jsx`: icon SVG dùng chung.
- `frontend/src/styles/global.css`, `layout.css`: giao diện và responsive.
- `frontend/public/images/consultation-hero.png`: ảnh banner local; prompt và nguồn
  tạo ảnh trong [home-hero.md](home-hero.md).

Chạy tại `frontend`: `npm ci`, sau đó `npm run dev` và mở `http://localhost:5173`.
Frontend hiện không cần backend hay MySQL để hiển thị Home. Node nên đáp ứng
`engines` trong `package.json` (20.19+ nhánh 20 hoặc 22.12+).
