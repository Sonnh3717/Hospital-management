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
    entity/
      identity/         Vai trò, tài khoản, phiên đăng nhập, đặt lại mật khẩu
      staff/            Nhân viên bệnh viện, hồ sơ bác sĩ
      patient/          Bệnh nhân, phản hồi
      scheduling/       Mẫu ca, lịch làm việc, chính sách và thay đổi lịch
      appointment/      Quy tắc, khung giờ và lịch hẹn
      encounter/        Lượt khám, chẩn đoán, quyết định điều trị, tái khám
      medicalservice/   Dịch vụ, phân công nhân viên, yêu cầu và kết quả
      billing/          Hóa đơn, chi tiết hóa đơn, thanh toán
      common/           CreatedEntity, AuditedEntity
        enums/          ActiveStatus, Gender, Priority
  src/main/resources/
    application.properties
  src/test/java/com/example/swd/
    controller/         HealthControllerTest
```

Luồng mẫu: HomePage -> systemService.js -> Axios -> HealthController ->
SystemStatusService -> HealthResponse. API mẫu không truy vấn database.

Entity đã mapping đủ 28 bảng trong script hospital_management; xem
[hướng dẫn kết nối DB và JPA](database-jpa.md). Khi bắt đầu nghiệp vụ, bổ sung
repository và DTO request tương ứng.
Entity được chia thành package theo chức năng có liên hệ với nhau. Tên package
dùng chữ thường, ví dụ `com.example.swd.entity.appointment`; các lớp audit và enum
dùng chung nằm trong `common`. Khóa ghép `StaffMedicalServiceId` nằm cùng
`StaffMedicalService` trong `medicalservice`. Quan hệ JPA giữa các nhóm vẫn giữ
nguyên; Spring Boot tự quét toàn bộ package con dưới `com.example.swd`.
Chỉ tạo impl, converter, khóa ghép, exception, monitoring hay migration khi
có triển khai sử dụng chúng. Không giữ thư mục dự phòng chứa `.gitkeep`.

## IntelliJ và nhận diện mã Java

Trên máy hiện tại, SDK Java 17 đã được cài và cấu hình hợp lệ. Khác với project
Tramdoc, SWD trước đó chưa liên kết backend thành Maven project khi mở thư mục
gốc. IntelliJ vì thế chưa nhận `backend/swd/src/main/java` là nguồn Java của
module, dẫn đến hiển thị tên file `.java` thay vì các class trong cây package.

[`pom.xml` ở gốc](../pom.xml) có `packaging=pom` và khai báo module `backend/swd`,
giúp IntelliJ phát hiện Maven khi mở cả workspace SWD. POM này chỉ gom module;
dependency và cấu hình chạy backend vẫn nằm trong `backend/swd/pom.xml`.
Cấu hình này không bị Git bỏ qua nên có thể dùng chung khi clone dự án.
IntelliJ hỗ trợ nhập dự án theo Maven để tự cấu hình module và dependency.
[Hướng dẫn nhập project của JetBrains](https://www.jetbrains.com/help/idea/import-project-or-module-wizard.html).

Cấu hình IntelliJ cục bộ trong `.idea/` đã liên kết POM gốc, dùng Java 17,
đánh dấu thư mục Java/test/resource, loại `target` khỏi nguồn và bật annotation
processing cho Lombok. Các file `.idea` được Git bỏ qua; máy khác tạo lại cấu
hình khi import Maven. Annotation processing có thể kiểm tra tại Settings →
Build, Execution, Deployment → Compiler → Annotation Processors.
[Hướng dẫn annotation processing của JetBrains](https://www.jetbrains.com/help/idea/annotation-processors-support.html).

Nếu IntelliJ đang mở SWD, chọn Maven → Reload All Maven Projects rồi đợi IDE
index xong. Nếu cửa sổ hiện tại chưa nạp cấu hình `.idea` mới, đóng project,
chọn File → Open → `SWD/pom.xml` và mở dưới dạng project Maven.

## Cấu hình được giữ

- React/Vite, React Router, Axios, Tailwind/PostCSS và ESLint.
- Java 17, Spring Boot 4.0.1, Maven Wrapper 3.9.12.
- MVC, JPA/MySQL, validation, Spring Security và Lombok làm nền phát triển.
- Cổng frontend 5173, backend 8081; URL API cấu hình qua môi trường.
- MySQL hospital_management dùng tài khoản qua biến môi trường; `ddl-auto=none`, tắt sinh schema và tự chạy SQL.
- API health và 4 kiểm thử HTTP/CORS.
- README, cấu hình Git/editor và tài liệu trong docs/.

## Phần đã bỏ

- Các thư mục rỗng dự phòng ở frontend và backend, cùng `.gitkeep`.
- Thư mục sql/ chỉ chứa hướng dẫn; nội dung cần thiết chuyển vào README.
- Thư mục db/migration/ chưa có script hoặc công cụ migration.
- Nghiệp vụ, dữ liệu, tài khoản và tích hợp riêng của dự án cũ.

Tên `swd` và package `com.example.swd` có thể đổi theo dự án mới.
Xem README để cài dependency, cấu hình MySQL và chạy ứng dụng.
