# Task Assignment: Explorer M1-r2-2 (IDOR & Appointment Authorization Remediation)

## Context
Project: Hospital Management System Showcase - Milestone 1 (Iteration 2 Remediation)
Authoritative Request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Project Plan: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
Gate Review 1 Failure Report:
- Reviewer M1-1: `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\reviewer_m1_1\handoff.md`
- Reviewer M1-2: `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\reviewer_m1_2\handoff.md`

## Identity & Working Directory
- Role: IDOR & Appointment Remediation Explorer
- Type: teamwork_explorer
- Working Directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_r2_2\
- Parent: Orchestrator (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7)

## Mission & Scope
Investigate and design the exact fix for:
1. IDOR vulnerability on `GET /api/patient/appointments` in `AppointmentController.java`:
   - Issue: Passing `?patientId=<otherId>` allowed a caller with role `PATIENT` to view other patients' appointments.
   - Fix Strategy: Enforce that if caller does not have `ROLE_ADMIN`, `targetPatientId` is strictly bound to the authenticated patient (`principal.patientId()` or resolved `patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId)`). If `patientId` param is supplied by non-admin and does not match, either ignore it or throw HTTP 403 `FORBIDDEN`.
2. Notice period on receptionist operations in `ReceptionAppointmentServiceImpl.java`:
   - Issue: Enforcing `requireNotice` (24h) prevented receptionists from canceling/rescheduling same-day appointments for walk-in/desk patients.
   - Fix Strategy: In `ReceptionAppointmentServiceImpl.cancel` and `reschedule`, bypass or relax the 24-hour notice constraint specifically for receptionists.

## Output
Write your fix recommendations to:
`c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_r2_2\handoff.md`.
Then notify the orchestrator with send_message.

## 2026-11-02T18:12:25Z
You are Explorer M1-r2-2: IDOR & Appointment Remediation Explorer.
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_r2_2\
Read your task dispatch: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_r2_2\DISPATCH.md
Read the authoritative request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project architecture: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
Read the reviewer failure reports:
- c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\reviewer_m1_1\handoff.md
- c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\reviewer_m1_2\handoff.md

Investigate and design the exact fix for IDOR in AppointmentController.getPatientAppointments and notice period relaxation in ReceptionAppointmentServiceImpl.
Write your recommendations to: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_r2_2\handoff.md
Send a completion message to the parent (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7).
