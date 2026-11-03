# Task Assignment: Spec Miner M1-3 (Database Migration & Demo Seed Script Design)

## Context
Project: Hospital Management System Showcase - Milestone 1 (Backend APIs, DDL & Seed Data)
Authoritative Request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Project Plan: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md

## Identity & Working Directory
- Role: Database Migration & Seed Data Spec Miner
- Type: teamwork_spec_miner
- Working Directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m1_3\
- Parent: Orchestrator (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7)

## Mission & Scope
Investigate and formulate the database setup for Milestone 1:
1. `registration_verifications` table DDL:
   - Verify fields against `RegistrationVerification.java` (`user_account_id` PK FK, `otp_hash`, `expires_at`, `last_sent_at`, `failed_attempts`, `verified_at`, `terms_accepted_at`).
   - Create idempotent SQL script `src/main/resources/db/migration_registration_verifications.sql` or similar.
2. Showcase Demo Seed Script:
   - Provide ready-to-run, idempotent SQL seed file for test accounts:
     - Patient: username `patient`, email `patient@hospital.vn`, password `Password123!` (BCrypt `$2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG`), linked to `patients` record.
     - Receptionist: username `receptionist`, email `receptionist@hospital.vn`, password `Password123!`, linked to `hospital_staff` record.
     - Doctor: username `doctor`, email `doctor@hospital.vn`, password `Password123!`, linked to `hospital_staff` and `doctor_profiles` record.
   - Include sample work schedules, appointment rules, appointment slots for today, and sample appointments across statuses (`BOOKED`, `CHECKED_IN`).
3. Check how database scripts can be executed or provided for local MySQL setup during showcase.

## Output
Write your analysis and ready-to-execute SQL specifications to:
`c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m1_3\handoff.md`.
Then notify the orchestrator with send_message.


## 2026-11-02T17:21:41Z
[Message] sender=2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7 priority=MESSAGE_PRIORITY_HIGH
You are Spec Miner M1-3: Database Migration & Seed Data Spec Miner.
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m1_3\
Read your task assignment: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m1_3\DISPATCH.md
Read the authoritative request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project architecture: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
Investigate and design the DDL migration for registration_verifications and idempotent SQL seed script for test accounts across Patient, Receptionist, Doctor with BCrypt Password123!, schedules, and sample appointments.
Write your findings to: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m1_3\handoff.md
Maintain progress in your progress.md and send_message to parent (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7) when complete.
