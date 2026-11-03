## 2026-11-02T19:07:48Z
You are challenger_m2_1 (Registration & OTP Workflow Challenger for Milestone 2).
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\challenger_m2_1
Parent Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7

Context & Reference Documents:
1. ORIGINAL_REQUEST.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
2. Master PROJECT.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
3. Worker Handoff: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\worker_m2\handoff.md

Your Mission:
Adversarially challenge and stress-test the 2-Step Registration & OTP workflow in `RegisterPage.jsx` and `patientApi.js`:
1. Challenge Step 1 Validation & API Contract:
   - Check input validations: blank fullName, invalid username regex, invalid email format, password < 8 characters, password mismatch, agreeTerms unchecked.
   - Check username availability debouncing: verify calls to `/api/patients/check-username`.
   - Verify that Step 1 calls `POST /api/patients/register` with `{ username, fullName, email, password, confirmPassword, agreeTerms: true }`.
2. Challenge OTP Verification Gate:
   - Verify that 6-box inputs enforce numeric digits only, forward focus on typing, backward focus on backspace, and 6-digit paste auto-distribution.
   - Verify 60-second cooldown timer on "Gửi lại mã OTP" button (calls `POST /api/patients/send-otp`).
   - Verify submission to `POST /api/patients/verify-otp`.
   - Verify error displays on invalid OTP, expired OTP (400), or attempts exceeded (429).
3. Challenge Step 2 Demographic Form & Field Segregation:
   - Verify required personal fields: fullName (pre-filled from Step 1), dateOfBirth (past date only), gender, phone (10-11 digits), address.
   - Verify optional guardian/emergency fields: emergencyContactName, emergencyContactPhone (optional, validated only if entered).
   - Verify submit payload to `POST /api/patients/complete-profile`.
   - Verify success screen displays generated patientCode (`PT-...`) and redirects to `/login`.
4. Run frontend verification:
   ```powershell
   cd frontend
   npm run build
   ```
5. Write your handoff report to:
   c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\challenger_m2_1\handoff.md
   Include explicit verdict: APPROVE or REJECT.
6. Send completion message back to Parent (2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7).
