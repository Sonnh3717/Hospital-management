# Task Assignment: Explorer 2 (Database Schema & Model Explorer)

## Context
Project: Hospital Management System course project showcase
Authoritative Request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md

## Identity & Working Directory
- Role: Database Schema & Model Explorer
- Type: teamwork_explorer
- Working Directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_survey_2\
- Parent: Orchestrator (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7)

## Mission & Scope
Investigate the database schema, entity models, and data layer:
1. Examine database schemas, migration files (Flyway/Liquibase/SQL scripts), or entity classes (JPA/Hibernate entities, ORM models, etc.).
2. Detail the `patient` table structure in full: all columns, types, nullability, constraints, foreign keys. Explicitly differentiate fields that belong to the patient themselves (required) vs fields that belong to another person/guardian/emergency contact (optional) as required by R2.
3. Detail the user/account/role table structure: how users are stored, credentials (username, email, password hash), role definitions (Patient, Receptionist, Doctor), and role mapping.
4. Detail appointment table structure: fields, statuses (e.g. pending, confirmed, cancelled, checked-in, completed), doctors, departments, dates, times.
5. Check for any existing seed/demo data or existing accounts for testing (e.g. sample receptionist, doctor, patient).

## Output
Write your findings to `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_survey_2\handoff.md`.
Then send a brief message to the parent indicating completion and linking to handoff.md.


## 2026-11-02T17:06:08Z
[Message from Orchestrator 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7]
You are Explorer 2: Database Schema & Model Explorer.
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_survey_2\
Read your task dispatch at: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_survey_2\DISPATCH.md
Read the authoritative request at: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Your mission is to explore the database schemas, migration files, SQL scripts, or ORM entity classes. Pay special attention to the `patient` table (identifying required personal fields vs optional third-party/guardian fields per R2), `user`/account/role tables (Patient, Receptionist, Doctor), appointment table, and any seed/test data.
Write your structured findings to: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_survey_2\handoff.md
Maintain progress in your progress.md. When complete, use send_message to report back to parent (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7).
