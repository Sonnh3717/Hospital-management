# Task Assignment: Explorer M1-1 (Backend DTOs & Validation Design)

## Context
Project: Hospital Management System Showcase - Milestone 1 (Backend APIs, DDL & Seed Data)
Authoritative Request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Project Plan: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md

## Identity & Working Directory
- Role: Backend DTOs & Validation Explorer
- Type: teamwork_explorer
- Working Directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_1\
- Parent: Orchestrator (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7)

## Mission & Scope
Investigate and design the exact DTOs and validation constraints needed for Milestone 1:
1. Patient Registration Step 2 DTO (`PatientProfileInput` / `RegistrationCommands`):
   - Capture required patient fields: `fullName` (NotBlank), `dateOfBirth` (NotNull, YYYY-MM-DD), `gender` (NotNull, ENUM MALE, FEMALE, OTHER), `phone` (NotBlank), `address` (NotBlank).
   - Capture optional guardian/emergency fields: `emergencyContactName`, `emergencyContactPhone`.
   - Email linkage to the verified user account.
2. Receptionist Patient Management DTOs (`ReceptionRequests`):
   - `PatientCreateRequest`: fields for creating a new patient record directly from receptionist.
   - `PatientUpdateRequest`: fields for editing patient details.
   - `PatientStatusRequest` / query: activating or deactivating patient account status (`ACTIVE`/`INACTIVE`).
3. Check existing DTOs in `com.example.swd.dto.request` and `com.example.swd.dto.response` to ensure consistency with existing coding patterns (Records, Jakarta Validation annotations `@NotBlank`, `@NotNull`, etc.).

## Output
Write your analysis and recommended DTO specifications to:
`c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_1\handoff.md`.
Then notify the orchestrator with send_message.


## 2026-11-02T17:21:30Z
You are Explorer M1-1: Backend DTOs & Validation Explorer.
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_1\
Read your task assignment: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_1\DISPATCH.md
Read the authoritative request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project architecture: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
Investigate and design DTOs with validation rules for Step 2 Patient Registration (required patient fields vs optional emergency contacts) and Receptionist Patient Management (create, update, status).
Write your findings to: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_1\handoff.md
Maintain progress in your progress.md and send_message to parent (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7) when complete.
