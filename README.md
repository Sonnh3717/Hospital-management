# SWD — khung dự án mới

Khung React/Vite + Spring Boot được tách từ cách tổ chức của dự án SWP.
Chưa có nghiệp vụ cụ thể. Không cần tạo thêm dự án trên Spring Initializr.

## Công nghệ và cấu trúc

- Frontend: React 18, React Router 6, Axios, Vite 7, Tailwind CSS 3, ESLint 9.
- Backend: Java 17, Spring Boot 4.0.1, Maven Wrapper 3.9.12, MVC, JPA,
  Validation, Spring Security, Lombok và MySQL.
- `frontend/`: ứng dụng giao diện.
- `backend/swd/`: dự án Maven; giữ kiểu phân cấp `backend/<tên-dự-án>/` của SWP.
- `docs/architecture.md`: cấu trúc, những phần giữ lại và loại bỏ.
- `docs/verification.md`: kết quả kiểm tra khung dự án.

## Yêu cầu

- JDK 17 và biến `JAVA_HOME` trỏ đến JDK.
- Node.js 20.19+ trong nhánh 20, hoặc 22.12+; npm đi kèm.
- MySQL đang chạy và một database riêng cho dự án.
- Internet cho lần tải dependency đầu tiên.

## Chạy frontend

Từ root dự án:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Mở http://localhost:5173. URL API mặc định là http://localhost:8081/api.
Có thể đổi `VITE_API_URL` trong `frontend/.env`.
Vite đưa biến `VITE_*` vào trình duyệt; không đặt bí mật vào đây.

## Chạy backend

Tạo database riêng trước (ví dụ thực hiện trong MySQL):

```sql
CREATE DATABASE swd CHARACTER SET utf8mb4;
```

Ở terminal khác, từ root dự án:

```powershell
cd backend/swd
$env:DB_URL = 'jdbc:mysql://localhost:3306/swd?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh'
$env:DB_USERNAME = '<tai-khoan-mysql-cua-ban>'
$env:DB_PASSWORD = '<mat-khau-mysql-cua-ban>'
.\mvnw.cmd spring-boot:run
```

Thay giá trị tài khoản bằng cấu hình của bạn, không sử dụng nguyên placeholder.
Nếu cơ sở dữ liệu đã tồn tại thì bỏ qua bước tạo.
`backend/swd/.env.example` chỉ là danh sách biến tham khảo:
Spring Boot không tự nạp file này. Có thể đặt biến trong IDE thay cho terminal.

Sau khi backend khởi động, nút **Kiểm tra kết nối** trên trang chủ gọi
`GET /api/health` và nhận `{"status":"UP"}`. Đây là kiểm tra API hoạt động,
không phải kiểm tra sức khỏe riêng của database hoặc dịch vụ bên ngoài.

Backend giữ cổng 8081; frontend giữ cổng 5173 như dự án nguồn.
Nếu chạy đồng thời với SWP, đổi `SERVER_PORT`, `VITE_API_URL`, cổng Vite
(ví dụ `npm run dev -- --port 5174`) và `CORS_ALLOWED_ORIGINS` cho khớp.

## Kiểm tra và build

Trong `frontend/`:

```powershell
npm run lint
npm run build
```

Trong `backend/swd/`:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```

Test hiện tại kiểm tra HTTP, JSON, giới hạn API và CORS qua MVC test slice;
không cần MySQL. Chạy backend thật vẫn cần database và biến môi trường.
JAR nằm tại `backend/swd/target/swd-0.0.1-SNAPSHOT.jar`.

## Bắt đầu phát triển

1. Đổi tên SWD, Maven artifact và package `com.example.swd` nếu cần.
2. Thêm entity, repository, DTO, service và controller cho nghiệp vụ mới.
3. Thêm trang, component và hàm gọi API trong frontend.
4. Cấu hình quyền API trong `SecurityConfig` theo mô hình đăng nhập mới.
5. Thêm schema/seed hoặc cài và cấu hình công cụ migration.
6. Thêm kiểm thử và cập nhật tài liệu.

Chỉ `GET /api/health` được mở công khai; các API khác bị từ chối mặc định.
Chưa triển khai đăng nhập, người dùng, JWT hoặc vai trò. Spring Security có
thể in mật khẩu phát triển tự sinh; khung này không cấu hình form login hay
HTTP Basic để dùng mật khẩu đó. CSRF giữ mặc định; khi bổ sung cơ chế xác thực,
cần quyết định chính sách CSRF phù hợp.

Không sao chép khóa dịch vụ, dữ liệu, tài khoản, lịch sử Git hoặc nghiệp vụ cũ.
Chỉ giữ các thư mục đang có mã nguồn hoặc cấu hình cần thiết. Tạo thêm thư mục theo nhu cầu khi phát triển tính năng.


## Database và mở rộng cấu trúc

Khung chưa có bảng nghiệp vụ hay dữ liệu mẫu. Hibernate dùng `ddl-auto=none`,
vì vậy không tự tạo schema. Khi thêm dữ liệu nghiệp vụ, tạo entity/repository
và schema tương ứng, hoặc cài và cấu hình Flyway/Liquibase.
Chỉ tạo thư mục SQL/migration khi thực sự có script và cách thực thi rõ ràng.

Tương tự, chỉ thêm components, hooks, context, utils, assets hoặc public khi
có mã/tài nguyên tương ứng. Không cần tạo sẵn các thư mục rỗng để ứng dụng chạy.
