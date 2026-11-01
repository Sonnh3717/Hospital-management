# Đặc Tả Tính Năng: Đăng Xuất (Logout)

## 1. Thông Tin Chung
- **Mã Use Case**: UC73 - Log Out
- **Tác Nhân (Actors)**: Tất cả người dùng đã đăng nhập (Patient, Receptionist, Doctor, Medical Service Staff, Manager, Admin).
- **Mô Tả**:
  Người dùng đang trong trạng thái đăng nhập thực hiện thao tác đăng xuất khỏi hệ thống. Hệ thống tiến hành thu hồi phiên làm việc hiện tại (`auth_sessions`), xóa bỏ cookie/token phía client, đảm bảo ngăn chặn mọi truy cập trái phép sau đó và điều hướng người dùng về trang Đăng nhập hoặc Trang chủ.

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Người dùng hiện đang đăng nhập với một phiên xác thực hợp lệ (Token chưa hết hạn, session còn active).
- **Hậu điều kiện (Postconditions)**:
  - Bản ghi phiên làm việc trong `auth_sessions` được đánh dấu là `is_revoked = true` (hoặc xóa bỏ).
  - Client xóa sạch Token khỏi bộ nhớ (LocalStorage / SessionStorage) hoặc HttpOnly Cookie được set `Max-Age=0`.
  - Mọi request tiếp theo sử dụng token cũ đều bị từ chối với mã lỗi `401 Unauthorized`.
  - Người dùng được chuyển về màn hình đăng nhập hoặc Landing Page.

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **Hủy phiên ngay lập tức**: Khi người dùng nhấn Đăng xuất, phiên làm việc phải chấm dứt ngay lập tức ở cả phía Server lẫn Client.
- **Không tái sử dụng Token**: Nếu hệ thống áp dụng cơ chế JWT Blacklist hoặc Session Database check, token của phiên vừa đăng xuất không thể tiếp tục gọi API.

---

## 4. Luồng Thực Hiện (Flow of Events)

### 4.1. Luồng chính (Normal Flow)
1. Người dùng nhấn vào menu/avatar tài khoản ở thanh điều hướng trên cùng (Header / Navbar).
2. Người dùng chọn mục "Đăng xuất" (Log out).
3. (Tùy chọn) Hệ thống hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn đăng xuất không?"*. Người dùng bấm "Xác nhận".
4. Frontend gửi request `POST /api/v1/auth/logout` kèm Header `Authorization: Bearer <token>` lên Backend Spring Boot.
5. Backend Spring Boot giải mã Token, lấy thông tin phiên làm việc từ bảng `auth_sessions`, cập nhật `is_revoked = true` và `revoked_at = NOW()`.
6. Backend trả về response `200 OK` (hoặc set header xóa Set-Cookie nếu dùng Cookie).
7. Frontend dọn dẹp trạng thái đăng nhập:
   - Xóa Access Token, thông tin User trong `AuthContext` / `Redux store`.
   - Xóa Token khỏi LocalStorage / SessionStorage.
8. Frontend điều hướng người dùng về trang `/login` (kèm query param `?message=logged_out` nếu cần) hoặc trang `/`.

### 4.2. Luồng ngoại lệ & Luồng phụ (Alternative & Exception Flows)
- **Token đã hết hạn khi bấm Đăng xuất**:
  - Khi người dùng bấm Đăng xuất nhưng Access Token trên server đã hết hạn hoặc không hợp lệ.
  - Backend vẫn trả về thành công hoặc mã thích hợp; Frontend tiếp tục dọn dẹp dữ liệu lưu cục bộ và redirect về trang Login.
- **Mất kết nối mạng khi Đăng xuất**:
  - Gặp lỗi Network Error khi gọi API logout.
  - Frontend vẫn chủ động xóa token trong máy người dùng và chuyển về màn hình đăng nhập để đảm bảo an toàn cục bộ.

---

## 5. Đặc Tả Giao Diện Người Dùng (UI/UX - ReactJS)
- **Vị trí**:
  - Nằm trong Dropdown Menu của User Profile trên Header/Navbar ở mọi màn hình đã xác thực.
  - Hoặc một nút riêng biệt ở cuối Sidebar điều hướng.
- **Tương tác**:
  - Modal xác nhận nhanh (Confirm Dialog) để tránh bấm nhầm.
  - Hiển thị Toast thông báo: *"Đăng xuất thành công"* sau khi chuyển trang.

---

## 6. Đặc Tả API & Backend (Spring Boot)

### 6.1. Chi tiết API
- **Endpoint**: `POST /api/v1/auth/logout`
- **Quyền truy cập (Auth)**: Người dùng đã xác thực (`@PreAuthorize("isAuthenticated()")`)
- **Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

#### Request Body
Rỗng (Empty body) hoặc:
```json
{}
```

#### Response Body (Thành công - HTTP 200 OK)
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

### 6.2. Mô hình dữ liệu liên quan
- `auth_sessions`: Tra cứu theo `token_hash` hoặc `session_id`, cập nhật trạng thái thu hồi.

---

## 7. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Khi đăng xuất trên một thiết bị, người dùng có muốn lựa chọn "Đăng xuất khỏi tất cả các thiết bị" (Revoke all active sessions) không? không ]

