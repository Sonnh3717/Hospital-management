## 2026-11-02T18:51:10Z
Sender: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7
Content:
You are explorer_m2_2 (Landing Page & Multi-Role Login UI Explorer for Milestone 2).
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m2_2
Parent Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7

Context & Reference Documents:
1. ORIGINAL_REQUEST.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
2. Master PROJECT.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
3. Assets in frontend/src/assets/ (e.g., consultation-hero.png)

Your Mission:
Design the UI/UX components and user interactions for R1 (Landing Page) and R3 (Multi-Role Login):
1. Design R1 Landing Page (`src/pages/HomePage.jsx` or `src/pages/landing/LandingPage.jsx`):
   - Modern, professional medical portal aesthetic with Tailwind CSS.
   - Topbar Navigation: Hospital brand logo/icon, hospital name ("Bệnh viện Đa khoa Quốc tế"), navigation links ("Giới thiệu", "Chuyên khoa", "Dịch vụ", "Liên hệ"), and prominent buttons: "Đăng nhập" (links to `/login`) and "Đăng ký" (links to `/register`).
   - Hero Section: Engaging headline ("Chăm sóc sức khỏe toàn diện với đội ngũ chuyên gia hàng đầu"), descriptive subhead, Call to Action buttons ("Đặt lịch ngay" -> redirects to login/register, "Tìm hiểu thêm"), and hero image integrating `src/assets/consultation-hero.png`.
   - Feature Highlights / Stats Cards: (e.g., "50+ Bác sĩ chuyên khoa", "24/7 Cấp cứu & Tiếp đón", "10,000+ Bệnh nhân tin tưởng", "Công nghệ khám hiện đại").
   - Department Overview section (Nội tổng quát, Tim mạch, Nhi khoa, v.v.).
   - Professional Footer with contact information, hotline, address, working hours.
2. Design R3 Multi-Role Login Page (`src/pages/auth/LoginPage.jsx`):
   - Beautiful card layout with hospital branding.
   - Dual credential input: Single input field labeled "Email hoặc Tên đăng nhập" (supports both username and email, mapping to backend `loginIdentifier`).
   - Password input field with show/hide toggle.
   - "Quên mật khẩu" link (`href="#"` as requested in R3).
   - "Chưa có tài khoản? Đăng ký ngay" link pointing to `/register`.
   - Clear error alert display (e.g. invalid credentials, inactive account).
   - Role-based automatic redirect on success:
     - `PATIENT` -> `/patient`
     - `RECEPTIONIST` -> `/reception`
     - `DOCTOR` -> `/doctor`
     - `ADMIN` -> `/admin`
3. Write your complete design blueprints, component specifications, and mock code to:
   c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m2_2\handoff.md
4. Send completion message to Parent (2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7).
