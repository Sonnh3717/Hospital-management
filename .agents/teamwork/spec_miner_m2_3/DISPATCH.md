## 2026-11-02T18:51:23Z
You are spec_miner_m2_3 (Patient Registration Specification Miner for Milestone 2).
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m2_3
Parent Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7

Context & Reference Documents:
1. ORIGINAL_REQUEST.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
2. Master PROJECT.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
3. Backend DTOs & Controllers:
   - `backend/swd/src/main/java/com/example/swd/controller/auth/AuthController.java`
   - `backend/swd/src/main/java/com/example/swd/controller/patient/PatientController.java`
   - `backend/swd/src/main/java/com/example/swd/dto/request/PatientRegistrationRequests.java`
   - `backend/swd/src/main/java/com/example/swd/dto/request/RegistrationCommands.java`

Your Mission:
Design the complete 2-Step Patient Registration Workflow (R2) in `src/pages/auth/RegisterPage.jsx`:
1. Analyze Step 1: Account Setup & Real SMTP OTP Verification Gate
   - Inputs: `username`, `email`, `password`, `confirmPassword`.
   - Action: User enters credentials and clicks "Gửi mã OTP".
   - API Call: `POST /api/auth/register` with `{ username, email, password }`.
   - UI State Transition: Switches to OTP Input mode with countdown timer (e.g. 60 seconds) and "Gửi lại mã OTP" button (calls `POST /api/patients/resend-otp` with `{ email }`).
   - OTP Input: 6-digit input with auto-focus or individual boxes.
   - Verification Action: User clicks "Xác thực OTP". Calls `POST /api/patients/verify-otp` with `{ email, otp }`.
   - On Successful Verification: Account status becomes `ACTIVE` on backend. UI automatically unlocks and transitions to Step 2 (Hoàn tất hồ sơ bệnh nhân).
2. Analyze Step 2: Patient Demographics Form (Matching table `patients`)
   - Personal Demographic Fields (REQUIRED per R2):
     - Họ và tên (`fullName`): text input, required, trimmed.
     - Ngày sinh (`dateOfBirth`): date picker, required, past date only.
     - Giới tính (`gender`): select/radio (`MALE`, `FEMALE`, `OTHER`), required.
     - Số điện thoại (`phone`): text input, required, 10-11 digits (regex `^0\d{9,10}$`).
     - Địa chỉ (`address`): text input, required, min 5 chars.
     - Email: read-only display populated from Step 1 (`contactEmail`).
   - Guardian / Emergency Contact Fields (OPTIONAL per R2):
     - Người liên hệ khẩn cấp (`emergencyContactName`): text input, optional.
     - SĐT người liên hệ khẩn cấp (`emergencyContactPhone`): text input, optional, phone regex if provided.
   - Submit Action: User clicks "Hoàn tất đăng ký". Calls `POST /api/patients/complete-profile` with `{ email, fullName, dateOfBirth, gender, phone, address, emergencyContactName, emergencyContactPhone }`.
   - On Completion: Shows success notification with Patient Code, and redirects to `/login` with pre-filled email or success message.
3. Handle All Edge Cases & Error Scenarios:
   - Duplicate username or email (HTTP 409).
   - Invalid OTP or expired OTP (HTTP 400).
   - Resend OTP throttling / cooldown.
   - Profile already completed guard (HTTP 409 `PROFILE_ALREADY_COMPLETED`).
4. Write your complete blueprint, API payload specifications, component state diagrams, and validation schemas to:
   c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m2_3\handoff.md
5. Send completion message to Parent (2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7).
