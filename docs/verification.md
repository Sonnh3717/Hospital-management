# Kết quả kiểm tra khung dự án

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
