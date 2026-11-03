# BRIEFING — 2026-11-02T17:18:00Z

## Mission
Explore existing codebase, identify tech stack, frameworks, build & test commands, directory layout, authentication, SMTP configuration, and dependencies.

## 🔒 My Identity
- Archetype: explorer
- Roles: Codebase, Tech Stack & Architecture Explorer
- Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_survey_1\
- Original parent: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7
- Milestone: codebase-survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Produce structured findings in handoff.md following 5-Component Handoff Report
- Report via send_message to parent upon completion

## Current Parent
- Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7
- Updated: 2026-11-02T17:06:00Z

## Investigation State
- **Explored paths**:
  - `pom.xml`, `backend/swd/pom.xml`, `frontend/package.json`
  - `backend/swd/src/main/resources/application.properties`, `smtp.properties`
  - `backend/swd/src/main/java/com/example/swd/config/` (SmtpConfig, WebConfig)
  - `backend/swd/src/main/java/com/example/swd/security/` (SecurityConfig, SessionAuthenticationFilter, StaffPrincipal)
  - `backend/swd/src/main/java/com/example/swd/controller/` (AppointmentController, AuthController, PatientController, HealthController)
  - `backend/swd/src/main/java/com/example/swd/service/` (AuthService, PatientRegistrationService, AppointmentService, RegistrationEmailService)
  - `backend/swd/src/test/` (PatientRegistrationServiceTest, RegistrationEmailServiceTest)
  - `frontend/` (`vite.config.js`, `tailwind.config.js`, `src/App.jsx`, `src/main.jsx`, `index.html`)
  - Git log history (commits 41bd23c and 195c9e7)
- **Key findings**:
  - Backend: Spring Boot 4.0.1 on Java 17/21, Maven 3.9.12. Compiles cleanly.
  - Test command discovery: On JDK 21 on Windows, Mockito self-attaching hangs without `-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar`. With javaagent, unit tests run in 5s and 20/20 pass.
  - Frontend: React 18.2.0, Vite 7.3.1, Tailwind CSS 3.4.14, React Router DOM 6.30.0, Axios 1.7.9.
  - Frontend build discovery: On Windows OneDrive with Node 24, Vite build fails with `EPERM realpath` on `main.jsx`. Adding `resolve: { preserveSymlinks: true }` in `vite.config.js` completely fixes this.
  - Frontend code state: Commit 41bd23c deliberately refreshed frontend, leaving `App.jsx` and `main.jsx`. Missing css imports in `main.jsx` need to be provided.
  - Auth: Stateful session token UUID via `Authorization: Bearer <token>`, backed by `auth_sessions`. Dual login via username OR email already supported in `UserAccountRepository.findForLogin()`.
  - SMTP: Pre-configured in `smtp.properties` (Gmail SMTP, TLS port 587, auth true) and `SmtpConfig.java`. `RegistrationEmailService` handles OTP delivery.
- **Unexplored areas**: None for codebase/architecture survey scope.

## Key Decisions Made
- Fully analyzed and documented build, test, architecture, security, and SMTP setups.
- Formulated precise 5-Component Handoff Report in `handoff.md`.

## Artifact Index
- handoff.md — Comprehensive tech stack, architecture, build & test survey report
- progress.md — Liveness heartbeat and activity log
- DISPATCH.md — Task assignment and dispatch log
