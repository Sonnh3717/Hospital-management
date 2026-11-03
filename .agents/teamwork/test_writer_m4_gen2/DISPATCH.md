## 2026-11-02T22:20:00Z
You are `test_writer_m4_gen2`, the test writer agent in the teamwork framework.
Your Role: "E2E Test Suite Architect"
Your Working Directory: `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\test_writer_m4_gen2`
Your Parent: Orchestrator Gen2 (Conversation ID: `57be1812-6fc7-41d3-9fd8-655dc3f13abb`)

MANDATORY DOCUMENTS TO READ FIRST:
1. `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user request - R1, R2, R3, R4, R5, R6)
2. `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md` (Master architecture and Feature Inventory)

TASK:
Design and build the comprehensive, requirement-driven, opaque-box E2E test suite for the Hospital Management System showcase, verifying:
- R1: Landing Page & Topbar Navigation (Login & Register links).
- R2: 2-Step Patient Registration (Username, email, password, SMTP OTP verification gate, patient demographic information with required vs optional fields).
- R3: Multi-Role Login (Patient, Receptionist, Doctor; dual login via Email+Password OR Username+Password; "Quên mật khẩu" href="#"; redirection to role dashboard).
- R4: Patient Portal (Booking placeholder, appointment list & search, appointment detail, cancellation with 24h notice rule, rescheduling with available slots).
- R5: Receptionist Portal (Walk-in placeholder, hospital-wide appointment list, check-in, undo check-in, counter cancellation, counter rescheduling, patient search, patient detail, create patient, edit patient, status activate/deactivate toggle).
- R6: Doctor Dashboard (Personalized welcome greeting with doctor name, specialty badge, shift stats, clinical dashboard placeholder).

METHODOLOGY & TIERS:
- **Tier 1 - Feature Coverage**: Direct verification of every inventoried feature.
- **Tier 2 - Boundary & Corner Cases**: Edge cases, 24h deadline boundaries, invalid OTP, duplicate username/email, unverified OTP access block, missing required fields.
- **Tier 3 - Cross-Feature Combinations**: Pairwise end-to-end user journeys (e.g., Register patient -> verify OTP -> login -> view appointments -> cancel / reschedule; or Receptionist check-in -> undo check-in -> counter cancel).
- **Tier 4 - Real-World Application Scenarios**: Complete hospital showcase scenarios covering Patient, Receptionist, and Doctor workflows.

DELIVERABLES:
1. Create executable test suite / runner script (e.g. `tests/e2e_showcase_test.mjs` or integration test harness) that tests the live endpoints/pages or uses headless/API verification.
2. Publish `TEST_INFRA.md` at project root with test architecture, methodology, and coverage summary.
3. Publish `TEST_READY.md` at project root signaling the test suite is complete and ready for execution.
4. Run the test suite to verify execution commands.
5. Write your handoff report to:
   `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\test_writer_m4_gen2\handoff.md`
6. Notify parent via `send_message(Recipient="57be1812-6fc7-41d3-9fd8-655dc3f13abb", Message="...")`.
