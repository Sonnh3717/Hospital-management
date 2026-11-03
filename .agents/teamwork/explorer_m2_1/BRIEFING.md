# BRIEFING — 2026-11-02T18:57:30Z

## Mission
Investigate and design Frontend Architecture, Build Setup, Axios Client, Auth State Management, and Routing for Milestone 2.

## 🔒 My Identity
- Archetype: explorer
- Roles: Frontend Architecture & State Management Explorer
- Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m2_1
- Original parent: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7
- Milestone: Milestone 2 (Frontend Architecture & Core Flow)

## 🔒 Key Constraints
- Read-only investigation — do NOT modify application source code (only write reports and metadata in own directory).
- Verify Vite build configuration for Windows/OneDrive NTFS reparse points (`resolve: { preserveSymlinks: true }`).
- Align AuthContext with backend Spring Boot security & auth responses from Milestone 1.

## Current Parent
- Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7
- Updated: 2026-11-02T18:57:30Z

## Investigation State
- **Explored paths**:
  - `frontend/package.json`, `frontend/vite.config.js`, `frontend/tailwind.config.js`, `frontend/src/`
  - `backend/swd/src/main/resources/application.properties`
  - `backend/swd/src/main/java/com/example/swd/controller/auth/AuthController.java`
  - `backend/swd/src/main/java/com/example/swd/dto/request/LoginRequest.java`
  - `backend/swd/src/main/java/com/example/swd/dto/response/LoginResponse.java`
  - `backend/swd/src/main/java/com/example/swd/repository/UserAccountRepository.java`
  - `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java`
  - `backend/swd/src/main/java/com/example/swd/controller/patient/PatientController.java`
  - `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`
  - `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionAppointmentController.java`
  - `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionPatientController.java`
- **Key findings**:
  - Windows OneDrive NTFS reparse point causes `[vite:build-html] EPERM: operation not permitted, realpath` on `npm run build`. Empirically verified that adding `resolve: { preserveSymlinks: true }` solves this issue.
  - Missing `lucide-react` in `package.json`.
  - Missing CSS files (`index.css`, etc.) and syntax error in `main.jsx` (`StrictMode` not imported).
  - Backend `findForLogin` supports both email and username submitted under the `username` field in `LoginRequest`.
  - Backend runs on port 8081; Vite proxy configured for `/api` to `http://localhost:8081`.
- **Unexplored areas**: None for core architecture; ready for implementer handoff.

## Key Decisions Made
- AuthContext designed with persistence in `localStorage` (`token` and `auth_user`), session re-verification via `GET /api/auth/me`, and normalized login credential forwarding.
- Axios client equipped with request interceptor (attaching Bearer token) and response interceptor (handling 401 redirects).
- Router structure architected with `ProtectedRoute` role guard and role-specific sidebar layouts.

## Artifact Index
- DISPATCH.md — Record of dispatch instructions
- BRIEFING.md — Persistent working memory index
- progress.md — Liveness heartbeat and milestone checklist
- handoff.md — Comprehensive blueprint and architectural analysis
