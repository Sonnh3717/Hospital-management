# Kết nối MySQL và mapping JPA

Schema gốc là [`Hospital_Database_28_Tables_MySQL (1).sql`](../Hospital_Database_28_Tables_MySQL%20%281%29.sql), gồm 28 bảng trong database `hospital_management`. Các entity nằm trong `backend/swd/src/main/java/com/example/swd/entity` và được Spring Boot tự quét vì cùng package gốc `com.example.swd`.

Các lớp được nhóm theo chức năng trong các package chữ thường: `identity`, `staff`, `patient`, `scheduling`, `appointment`, `encounter`, `medicalservice` và `billing`. `CreatedEntity`/`AuditedEntity` nằm trong `common`; enum dùng chung nằm trong `common.enums`. Việc chia package giữ nguyên tên bảng, cột và quan hệ JPA, không yêu cầu thay đổi script DB. Xem [cây thư mục backend](architecture.md#backend).

## 1. Chuẩn bị database

Dùng MySQL 8.0.16 trở lên. Mở script 28 bảng bằng MySQL Workbench, kết nối server rồi Execute trên schema mới/rỗng. Script tự tạo/chọn database, tạo bảng, seed 6 role và tạo 3 view. Nếu schema đã tồn tại, kiểm tra các bảng trước khi chạy; script không phải migration để chạy lại trên database đang có dữ liệu.

**Không chạy toàn bộ `create_DB.sql`: dòng cuối có `drop database hospital_management;`, sẽ xóa database vừa tạo.**

## 2. Dependency trong pom.xml

`backend/swd/pom.xml` đã có các dependency cần thiết, không cần thêm hoặc đổi version:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

Spring Boot parent quản lý version. Dự án dùng Spring Boot 4 nên import annotation JPA từ `jakarta.persistence`.

## 3. Thông tin kết nối

`backend/swd/src/main/resources/application.properties` đã được cấu hình:

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/hospital_management?connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.properties.hibernate.jdbc.time_zone=UTC
spring.jpa.properties.hibernate.type.java_time_use_direct_jdbc=true
```

Nếu server dùng host/port/database khác, thay `DB_URL`. Điền tài khoản MySQL và mật khẩu qua biến môi trường; không commit mật khẩu vào Git. Ví dụ PowerShell, chạy trong `backend/swd`:

```powershell
$env:DB_URL = 'jdbc:mysql://localhost:3306/hospital_management?connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true'
$env:DB_USERNAME = 'hospital_app'
$env:DB_PASSWORD = '<mat-khau-MySQL-cua-ban>'
.\mvnw.cmd spring-boot:run
```

Tài khoản `hospital_app` ở ví dụ cần tồn tại và có quyền đọc/ghi trên `hospital_management`; cũng có thể dùng tài khoản MySQL đã được cấp cho dự án. Trong IntelliJ, mở `pom.xml` ở gốc SWD dưới dạng project Maven hoặc chọn Maven → Reload All Maven Projects để nạp module backend, rồi đợi IDE index xong. Sau đó vào Run → Edit Configurations → cấu hình chạy `SwdApplication` → Environment variables, thêm `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` rồi chạy. Xem [cấu hình IntelliJ của dự án](architecture.md#intellij-và-nhận-diện-mã-java).

`backend/swd/.env.example` chỉ là mẫu. Spring Boot không tự đọc file `.env`; cần đặt biến trong terminal hoặc IDE. API `/api/health` hiện chỉ kiểm tra ứng dụng, không thực hiện truy vấn DB.

Script yêu cầu mọi kết nối DB dùng UTC nên JDBC URL đặt UTC cho cả driver và MySQL session. `DATETIME(6)` được mapping bằng `LocalDateTime` chứa giờ UTC; `DATE` dùng `LocalDate`; `TIME` của mẫu ca dùng `LocalTime` theo giờ Việt Nam. Hibernate được cấu hình đọc/ghi trực tiếp các kiểu `java.time` qua JDBC để giữ đúng giá trị dù JVM chạy giờ Việt Nam. Khi nhận/trả giờ địa phương, service/DTO cần chuyển đổi với `Asia/Ho_Chi_Minh`. [Cấu hình Hibernate 7](https://docs.jboss.org/hibernate/orm/7.2/introduction/pdf/Hibernate_Introduction.pdf), [xử lý thời gian trong MySQL Connector/J](https://dev.mysql.com/doc/connectors/en/connector-j-time-instants.html).

## 4. Tắt tự thay đổi schema và chạy SQL

Các cấu hình này đã được đặt cố định trong `application.properties`:

```properties
spring.jpa.hibernate.ddl-auto=none
spring.jpa.properties.jakarta.persistence.schema-generation.database.action=none
spring.jpa.properties.jakarta.persistence.schema-generation.scripts.action=none
spring.sql.init.mode=never
```

`ddl-auto=none` tắt tạo/sửa/xóa bảng từ Hibernate; hai thuộc tính JPA tắt phát sinh schema vào database hoặc file script; `spring.sql.init.mode=never` tắt tự chạy `schema.sql`/`data.sql` lúc khởi động. [Tài liệu Spring Boot](https://docs.spring.io/spring-boot/how-to/data-initialization.html).

Khi sửa entity, file SQL và schema DB giữ nguyên. Nếu thêm/đổi cột, tự viết và chạy SQL migration phù hợp trước khi sử dụng entity mới. Cấu hình này vẫn cho phép JPA INSERT/UPDATE/DELETE **dữ liệu**. Không đặt `ddl-auto=update`, `create` hoặc `create-drop` trong profile/biến môi trường khác vì có thể ghi đè cấu hình này.

## 5. Các quan hệ và kiểu dữ liệu

- Khóa ngoại thông thường dùng `@ManyToOne(fetch = LAZY)`; một FK có UNIQUE riêng dùng `@OneToOne(fetch = LAZY)`. Quan hệ được khai báo phía giữ FK để đọc/ghi trực tiếp cột liên kết. Không tự cascade xóa dữ liệu liên quan.
- `DoctorProfile.staff` dùng `@MapsId`: `doctor_id` chính là `hospital_staff.staff_id`, không tự tăng thêm một ID bác sĩ khác.
- `StaffMedicalService` có `@EmbeddedId` gồm `staffId` và `medicalServiceId`, cùng hai `@MapsId`; đây là entity của bảng liên kết vì còn trạng thái, người phân công và thời gian.
- Hai FK ghép ở `medical_service_requests` liên kết tới `StaffMedicalService`, bảo đảm nhân viên được phân công đúng dịch vụ. Các liên kết đọc dùng chung cột được đánh dấu `insertable=false, updatable=false`.
- `active_slot_id`, `primary_encounter_id` là cột generated của MySQL; không có setter, không tham gia INSERT/UPDATE. Hibernate đọc lại giá trị sau khi ghi.
- `created_at`, `updated_at`, các timestamp có DEFAULT do DB quản lý và Hibernate đọc lại qua `@Generated`. `CreatedEntity`/`AuditedEntity` là mapped superclass, không tạo thêm bảng.
- `work_schedules.row_version` dùng `@Version` để phát hiện cập nhật đồng thời. Không tự tăng version trong service khi cập nhật qua JPA.
- ENUM dùng `@Enumerated(EnumType.STRING)` đúng giá trị trong script; tiền dùng `BigDecimal` với precision 12, scale 2; `token_hash` dùng `byte[32]`; `session_id` là UUID dạng chuỗi 36 ký tự do backend cấp.
- Ba view hiện chưa mapping thành entity. Khi cần đọc, có thể dùng projection/native query; không đưa chúng vào luồng ghi dữ liệu.

Không trả trực tiếp entity qua controller: dùng DTO để tránh lộ password/token và truy cập quan hệ LAZY ngoài transaction. Các CHECK/FK trong DB vẫn có hiệu lực; điều kiện nghiệp vụ và phân quyền bổ sung được triển khai ở service.

### Bảng và entity tương ứng

Tiền tố package của các nhóm dưới đây là `com.example.swd.entity`, ví dụ `identity.Role` là `com.example.swd.entity.identity.Role`.

| Bảng SQL | Entity Java | Nhóm/package |
| --- | --- | --- |
| `roles` | `Role` | `identity` |
| `user_accounts` | `UserAccount` | `identity` |
| `hospital_staff` | `HospitalStaff` | `staff` |
| `doctor_profiles` | `DoctorProfile` | `staff` |
| `patients` | `Patient` | `patient` |
| `shift_templates` | `ShiftTemplate` | `scheduling` |
| `work_schedules` | `WorkSchedule` | `scheduling` |
| `work_time_policies` | `WorkTimePolicy` | `scheduling` |
| `schedule_change_requests` | `ScheduleChangeRequest` | `scheduling` |
| `schedule_events` | `ScheduleEvent` | `scheduling` |
| `appointment_rules` | `AppointmentRule` | `appointment` |
| `appointment_slots` | `AppointmentSlot` | `appointment` |
| `appointments` | `Appointment` | `appointment` |
| `encounters` | `Encounter` | `encounter` |
| `encounter_diagnoses` | `EncounterDiagnosis` | `encounter` |
| `treatment_decisions` | `TreatmentDecision` | `encounter` |
| `follow_up_requests` | `FollowUpRequest` | `encounter` |
| `medical_services` | `MedicalService` | `medicalservice` |
| `staff_medical_services` | `StaffMedicalService` | `medicalservice` |
| `medical_service_requests` | `MedicalServiceRequest` | `medicalservice` |
| `medical_service_results` | `MedicalServiceResult` | `medicalservice` |
| `service_result_reviews` | `ServiceResultReview` | `medicalservice` |
| `invoices` | `Invoice` | `billing` |
| `invoice_items` | `InvoiceItem` | `billing` |
| `payments` | `Payment` | `billing` |
| `patient_feedback` | `PatientFeedback` | `patient` |
| `auth_sessions` | `AuthSession` | `identity` |
| `password_reset_tokens` | `PasswordResetToken` | `identity` |

`medicalservice.StaffMedicalServiceId` là khóa ghép của `staff_medical_services`; `common.CreatedEntity`, `common.AuditedEntity` và các enum trong `common.enums` là lớp hỗ trợ, không mapping thành bảng riêng.

## 6. Kiểm tra

Trong `backend/swd`, chạy `.\mvnw.cmd test` để chạy 4 kiểm thử HTTP/CORS hiện có.

Mapping đã được đối chiếu đủ 28 bảng, toàn bộ cột và FK, đồng thời kiểm thử đọc/ghi trên MySQL tạm trước khi bàn giao. Hai file kiểm thử JPA bổ sung đã được dọn theo yêu cầu; xem [kết quả kiểm tra](verification.md) để biết phạm vi đã xác minh.
