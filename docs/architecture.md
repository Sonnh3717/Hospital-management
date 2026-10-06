# Cấu trúc khung SWD tối giản

## Frontend

```text
frontend/
  src/
    pages/              HomePage, NotFoundPage
    layouts/            MainLayout
    services/           api.js, systemService.js
    styles/             global.css
    App.jsx
    main.jsx
    index.css
  .env.example
  index.html
  package.json
  package-lock.json
  vite.config.js
  eslint.config.js
  tailwind.config.js
  postcss.config.js
```

Trang, bố cục và lời gọi API được tách riêng. Chỉ thêm components, hooks,
context, utils hoặc tài nguyên khi có nhu cầu thực tế. Chưa có đăng nhập,
vai trò hay giao diện nghiệp vụ cụ thể.

## Backend

```text
backend/swd/
  .mvn/wrapper/
  mvnw
  mvnw.cmd
  pom.xml
  .env.example
  src/main/java/com/example/swd/
    SwdApplication.java
    config/             CORS
    security/           Quyền truy cập API
    controller/         HealthController
    dto/response/       HealthResponse
    service/            SystemStatusService
  src/main/resources/
    application.properties
  src/test/java/com/example/swd/
    controller/         HealthControllerTest
```

Luồng mẫu: HomePage -> systemService.js -> Axios -> HealthController ->
SystemStatusService -> HealthResponse. API mẫu không truy vấn database.

Khi bắt đầu nghiệp vụ, bổ sung entity, repository và DTO request tương ứng.
Chỉ tạo impl, converter, khóa ghép, exception, monitoring hay migration khi
có triển khai sử dụng chúng. Không giữ thư mục dự phòng chứa `.gitkeep`.

## Cấu hình được giữ

- React/Vite, React Router, Axios, Tailwind/PostCSS và ESLint.
- Java 17, Spring Boot 4.0.1, Maven Wrapper 3.9.12.
- MVC, JPA/MySQL, validation, Spring Security và Lombok làm nền phát triển.
- Cổng frontend 5173, backend 8081; URL API cấu hình qua môi trường.
- MySQL dùng tài khoản riêng qua biến môi trường; `ddl-auto=none`.
- API kiểm tra kết nối và 4 kiểm thử HTTP/CORS.
- README, cấu hình Git/editor và tài liệu trong docs/.

## Phần đã bỏ

- Các thư mục rỗng dự phòng ở frontend và backend, cùng `.gitkeep`.
- Thư mục sql/ chỉ chứa hướng dẫn; nội dung cần thiết chuyển vào README.
- Thư mục db/migration/ chưa có script hoặc công cụ migration.
- Nghiệp vụ, dữ liệu, tài khoản và tích hợp riêng của dự án cũ.

Tên `swd` và package `com.example.swd` có thể đổi theo dự án mới.
Xem README để cài dependency, cấu hình MySQL và chạy ứng dụng.
