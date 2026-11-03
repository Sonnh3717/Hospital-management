# Task Assignment: Reviewer M1-2 (API Interface & Security Conformance Review)

## Context
Project: Hospital Management System Showcase - Milestone 1 Review
Authoritative Request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Project Plan: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
Worker Handoff: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\worker_m1\handoff.md

## Identity & Working Directory
- Role: API & Security Reviewer
- Type: teamwork_reviewer
- Working Directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\reviewer_m1_2\
- Parent: Orchestrator (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7)

## Mission & Scope
Perform an independent, adversarial code review focusing on API contracts, security permissions, and data integrity:
1. Validate that `POST /api/patients/complete-profile` strictly enforces the OTP verified status (`verifiedAt != null`), returns 400 when unverified, and maps required patient fields vs optional guardian fields.
2. Validate that receptionist endpoints (`/api/reception/**`) are protected with `@PreAuthorize("hasRole('RECEPTIONIST')")`.
3. Validate that `SessionAuthenticationFilter` correctly populates `StaffPrincipal` and doesn't fail on missing accounts.
4. Validate that SQL migration and seed scripts (`migration_registration_verifications.sql`, `showcase_demo_seed.sql`) match table definitions and password hashing requirements.
5. Execute the build and test suite:
   `cd backend/swd; ./mvnw test-compile`
   `cd backend/swd; ./mvnw test '-Dtest=PatientRegistrationServiceTest,ReceptionPatientServiceTest,PatientControllerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'`
6. Render an explicit gate verdict: `APPROVE` or `REQUEST_CHANGES`.

## Output
Write your review report to:
`c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\reviewer_m1_2\handoff.md`.
End with a clear verdict line: `Verdict: APPROVE` or `Verdict: REQUEST_CHANGES`.
Then send a completion message to the parent orchestrator.


## 2026-11-02T17:54:55Z
Received dispatch from 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7:
You are Reviewer M1-2: API Interface & Security Conformance Reviewer.
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\reviewer_m1_2\
Read your task dispatch: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\reviewer_m1_2\DISPATCH.md
Read the authoritative request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project architecture: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
Read the worker handoff: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\worker_m1\handoff.md
Review API contracts, security annotations, OTP verification gate, SessionAuthenticationFilter, execute build/tests, and render your verdict (APPROVE or REQUEST_CHANGES).
Write your findings to: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\reviewer_m1_2\handoff.md
Send a completion message to the parent (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7).
