# BRIEFING — 2026-11-02T19:05:00Z

## Mission
Discover and document the complete specification and blueprint for the 2-Step Patient Registration Workflow (R2) in `src/pages/auth/RegisterPage.jsx`.

## 🔒 My Identity
- Archetype: Teamwork specialist / Specification Miner
- Roles: Specification Miner (spec_miner_m2_3)
- Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m2_3
- Original parent: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7
- Milestone: M2 (Frontend Foundation, Landing Page & Authentication)

## 🔒 Key Constraints
- Specification Miner: read-only, do NOT implement code changes in the product.
- Prioritize authoritative sources (backend controllers, DTOs, entities, database schema, existing frontend code).
- Design 2-Step Registration Workflow (R2) in `src/pages/auth/RegisterPage.jsx` covering Step 1 (Account Setup & SMTP OTP Verification Gate), Step 2 (Patient Demographics Form: required vs optional guardian fields), and edge cases (409 conflict, 400 OTP invalid/expired, throttling, profile already completed).
- Write findings and complete blueprint in `handoff.md`.
- Communicate to parent agent via `send_message`.

## Current Parent
- Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7
- Updated: 2026-11-02T18:52:00Z

## Task Summary
- **What to build**: Full blueprint and specification for 2-step patient registration workflow (Step 1 Account + OTP Verification, Step 2 Patient Profile Demographics).
- **Success criteria**: Exhaustive interface discovery, exact API request/response contracts, field validations, component state machine, error handling matrix, and edge case specifications.
- **Interface contracts**: `PROJECT.md`, `AuthController.java`, `PatientController.java`, `RegistrationCommands.java`, `PatientRegistrationServiceImpl.java`.
- **Code layout**: `backend/swd/**`, `frontend/src/pages/auth/RegisterPage.jsx`, `frontend/src/services/**`.

## Key Decisions Made
- Discovered and clarified that backend registration routes live under `/api/patients/**`, specifically `POST /api/patients/register` and `POST /api/patients/send-otp` (not `/api/auth/register` or `/api/patients/resend-otp`).
- Discovered that `RegistrationCommands.Register` in backend requires `fullName` and `agreeTerms: true` in Step 1. Designed Step 1 to gather `fullName` and agreement, pre-filling `fullName` into Step 2 seamlessly.
- Designed 6-digit individual box OTP interface with auto-focus, paste, 60s cooldown timer for resend, and 5-attempt brute-force protection handling.
- Designed Step 2 Demographics Form separating required patient personal info (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`, read-only `email`) from optional guardian contact (`emergencyContactName`, `emergencyContactPhone`).
- Authored complete UI/UX blueprint and reference code using responsive Tailwind CSS and inline SVGs (zero missing dependencies).

## Artifact Index
- `.agents/teamwork/spec_miner_m2_3/DISPATCH.md` — Original task dispatch
- `.agents/teamwork/spec_miner_m2_3/BRIEFING.md` — Agent working memory
- `.agents/teamwork/spec_miner_m2_3/progress.md` — Liveness heartbeat
- `.agents/teamwork/spec_miner_m2_3/handoff.md` — Complete handoff report with 5-section report, feature discovery table, edge case table, and full reference implementation
