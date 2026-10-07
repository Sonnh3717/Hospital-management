# Kết quả kiểm tra khung dự án

## Nhóm entity và sửa nhận diện Java trong IntelliJ (07/10/2026)

- Đã chia 34 class thành 8 package nghiệp vụ và `common`/`common.enums`; cập nhật package và import, giữ đủ 28 entity.
- Đối chiếu project TramDoc trên cùng máy: SDK `17` đã cài và đăng ký đúng. SWD thiếu liên kết Maven và source roots trong cấu hình IntelliJ cũ.
- Thêm POM gốc gom module `backend/swd`; cấu hình IntelliJ cục bộ liên kết Maven, Java 17, nguồn Java/test/resource và annotation processing.
- Đã xóa output biên dịch cũ trong target rồi build từ POM gốc: biên dịch lại 40 file Java, cả 4 test HTTP/CORS đạt; cả module backend và POM gốc đều BUILD SUCCESS.
- Kiểm tra Hibernate sau khi chuyển package: khởi tạo SessionFactory và xác nhận đủ 28 entity, 28 bảng, 279 cột; không kết nối DB hoặc chạy DDL. Kiểm tra này chỉ dùng file tạm dưới target, không thêm lại các file kiểm thử đã dọn.
- XML của POM/module/SDK/compiler hợp lệ; không còn import từ package entity cũ.

Chưa kiểm tra trực quan cây project trong phiên IntelliJ đang mở. Cần reload Maven hoặc mở lại `SWD/pom.xml` dưới dạng Maven project để IDE nạp cấu hình và dependency mới; xem [hướng dẫn cấu trúc](architecture.md).

## Mapping JPA theo script bệnh viện (07/10/2026)

Kết quả dưới đây ghi nhận lần kiểm tra trước khi dọn file. Theo yêu cầu, đã xóa hai file kiểm thử bổ sung `EntityMappingTest.java` và `MySqlEntityIntegrationTest.java`; dự án hiện giữ 4 kiểm thử HTTP/CORS. Các entity và cấu hình DB vẫn được giữ đầy đủ.

- Biên dịch lại từ đầu: 40 file Java chính, 3 file kiểm thử; thành công với Java 17 và Spring Boot 4.0.1.
- 6 test thành công, 0 failure, 0 error, 0 skipped: 4 HTTP/CORS, 1 đối chiếu Hibernate metadata với script và 1 tích hợp MySQL.
- Metadata đối chiếu đủ 28 bảng, 279 cột và toàn bộ khóa ngoại, bao gồm FK ghép.
- MySQL 8.0.45 chạy tạm trong `target/jpa-mysql-check` trên cổng 13307, import nguyên script gốc thành công. Không dùng database đang chạy của người dùng.
- Hibernate `validate` xác nhận schema khớp; kiểm thử đọc role và ghi dữ liệu thử ở 27 bảng còn lại, rollback sau khi chạy.
- Đã kiểm tra PK dùng chung, embedded ID, cả hai FK ghép, cột generated khi đổi trạng thái, timestamp DB sinh, optimistic version, UUID, BINARY(32), DECIMAL và view số dư hóa đơn.
- Kiểm tra cả giá trị thời gian lưu bằng SQL và đọc lại bằng JPA, xác nhận DATETIME UTC và TIME của mẫu ca giữ nguyên khi JVM dùng giờ Việt Nam.
- Cấu hình ứng dụng đặt `ddl-auto=none`, JPA schema generation `none` và SQL initialization `never`; SQL gốc được giữ nguyên.

Trong sandbox Windows, biên dịch cần cache JAR ở workspace để tránh lỗi JDK ZipFS canonicalize đường dẫn cache ngoài workspace. Dùng Maven 3.9.12 với `maven.repo.local` trỏ tới `target/jpa-repository-cache` và `maven.repo.local.tail` trỏ tới cache có sẵn; không sửa `pom.xml` hoặc dependency gốc. MySQL tạm đã được dừng sau kiểm thử.

Xem [hướng dẫn cấu hình DB và mapping JPA](database-jpa.md) để chạy với thông tin kết nối của bạn.

Ngày kiểm tra: 06/10/2026.

Khung được kiểm tra trong thư mục chuẩn bị trước khi chép sang thư mục đích.

| Kiểm tra | Kết quả |
| --- | --- |
| Cài frontend bằng lockfile: `npm ci --offline --no-audit --no-fund` | Thành công |
| `npm run lint` | Thành công |
| `npm run build` | Thành công |
| `mvnw.cmd package` | Thành công, tạo Spring Boot JAR |
| API health trả JSON `status=UP` | Đạt |
| Endpoint khác bị chặn mặc định | Đạt |
| CORS cho phép origin frontend đã cấu hình | Đạt |
| CORS từ chối origin chưa cấu hình | Đạt |

Backend: 4 test, 0 failure, 0 error, 0 skipped. Test dùng MVC slice,
không kết nối MySQL. Chưa chạy kiểm thử tích hợp với database thực tế hoặc
kiểm tra tương tác giao diện bằng trình duyệt.

Máy kiểm tra dùng Node 22.11.0; build thành công nhưng Vite và plugin React
cảnh báo yêu cầu Node 20.19+ (nhánh 20) hoặc 22.12+. Cần dùng Node phù hợp
khi phát triển; không thay đổi Node cài sẵn trên máy trong tác vụ này.

Build cũng báo dữ liệu Browserslist cũ và chưa có Tailwind utility class
trong trang mẫu (trang đang dùng CSS riêng). Đây không phải lỗi build.

Maven Wrapper sao chép từ dự án nguồn đã được sửa phần kiểm tra `.Target`
trên PowerShell: tránh truy cập phần tử của mảng null khi `.m2` là thư mục
thông thường. Phiên bản Maven vẫn giữ 3.9.12.

Chỉ mã nguồn, cấu hình và tài liệu được bàn giao. `node_modules`, `dist`,
`target`, dữ liệu và thông tin đăng nhập của dự án cũ không được chép.

## Sau khi tinh gọn thư mục (06/10/2026)

Đã bỏ các thư mục dự phòng chỉ có `.gitkeep` và gộp hướng dẫn SQL vào README.
Kiểm tra SHA-256 trước/sau xác nhận toàn bộ mã nguồn, test, cấu hình build,
lockfile và cấu hình môi trường được giữ nguyên. Vì chỉ thay đổi thư mục rỗng
và tài liệu, không chạy lại build/test; kết quả phía trên là lần kiểm tra trước.
