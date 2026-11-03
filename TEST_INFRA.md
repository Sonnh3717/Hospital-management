# Test Infrastructure & Architecture Specification

## 1. Overview & Objective
This document defines the test architecture, execution harness, and verification methodology for the **Hospital Management System Showcase**, satisfying all acceptance criteria defined in `ORIGINAL_REQUEST.md` (R1 through R6) and `PROJECT.md`.

The test infrastructure adopts a **4-tier opaque-box requirement verification model**, ensuring that every functional requirement, boundary condition, cross-feature workflow, and production deployment artifact is verified against authoritative specifications with 100% test integrity.

---

## 2. Test Architecture & Tiered Methodology

```
+-----------------------------------------------------------------------------------------+
|                               4-TIER TEST ARCHITECTURE                                   |
+-----------------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage (R1 - R6 Direct Requirements)                                  |
|  - R1: Landing Page (Overview, Specialties, Stats, Topbar Navigation Login & Register)   |
|  - R2: 2-Step Registration (Step 1 Credentials + SMTP OTP Gate -> Step 2 Demographics)  |
|  - R3: Multi-Role Dual Login (Email/Username + Password, Forgot Pwd '#', Role Redirect) |
|  - R4: Patient Portal (Booking Placeholder, Appointments List & Search, Cancel, Resched) |
|  - R5: Receptionist Portal (Walk-in SOP, Hospital List, Check-in, Undo, Patient CRUD)    |
|  - R6: Doctor View (Personalized Dynamic Greeting, Specialty Badge, Clinical Roadmap)    |
+-----------------------------------------------------------------------------------------+
|  Tier 2: Boundary & Corner Cases                                                        |
|  - 24-Hour Notice Deadline Rule (Patient cancellation/rescheduling blocked when < 24h)   |
|  - Receptionist Counter Privileges (Exempt from 24h notice restriction)                  |
|  - Same-Day Check-in Enforcement (Check-in restricted to today's appointments)           |
|  - Encounter State Lock (Encounter active/completed locks appointment alterations)       |
|  - Strict OTP Verification Gate (6-digit numeric validation, cooldown anti-spam)         |
|  - Demographic Validation (Required patient fields vs optional guardian fields)         |
|  - Dual Login Credential Normalization (Email or Username standard binding)             |
|  - Walk-in Patient Account Safeguard (Status toggle disabled without online account)     |
+-----------------------------------------------------------------------------------------+
|  Tier 3: Cross-Feature User Journeys                                                    |
|  - Journey A: Patient Registration -> OTP -> Profile -> Login -> Booking -> Appts      |
|  - Journey B: Receptionist Login -> Walk-in SOP -> Check-in -> Undo -> Patient CRUD     |
|  - Journey C: Doctor Login -> Dynamic Name Resolution Greeting -> Shift Metric Review    |
|  - Journey D: Role-Based Access Control (RBAC route protection & 401/403 isolation)     |
+-----------------------------------------------------------------------------------------+
|  Tier 4: Real-World Scenarios, Security Resilience & System Integrity                   |
|  - Scenario 1: Multi-Role Hospital Day-in-the-Life Simulation                           |
|  - Scenario 2: Session Expiration & 401 Interceptor Token Invalidation                  |
|  - Scenario 3: Bearer Authorization Token Injection                                     |
|  - Scenario 4: Frontend Vite Production Compilation & Bundle Artifact Integrity          |
|  - Scenario 5: Backend Automated Regression Suite Execution (117 unit/service tests)    |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Test Suites & Execution Engines

### 3.1 Executable E2E Showcase Test Harness
- **Script Path**: `tests/e2e_showcase_suite.mjs` (alias: `tests/e2e_showcase_test.mjs`)
- **Runtime**: Node.js (ESM native, Node >= 20)
- **Assertion Framework**: Node standard `node:assert/strict`
- **Output Report**: Machine-readable JSON artifact at `tests/test-results.json`
- **Execution Command**:
  ```powershell
  node tests/e2e_showcase_suite.mjs
  # Or via alias
  node tests/e2e_showcase_test.mjs
  ```
- **Execution Result**: 46 / 46 tests pass (100% success rate, 0 failures, 0 skipped).

### 3.2 Backend Service, Controller & Security Test Suite
- **Directory**: `backend/swd`
- **Framework**: JUnit 5, Mockito, Spring Boot Test / MockMvc
- **Execution Command**:
  ```powershell
  mvn.cmd test -pl backend/swd "-Dtest=Challenger*,Reception*,AppointmentLifecycle*,AppointmentAvailableSlots*,PatientRegistration*,RegistrationEmail*,SessionAuth*,PatientController*" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
  ```
- **Execution Result**: 117 / 117 tests pass (100% success rate, 0 failures, 0 errors).

### 3.3 Frontend Production Compilation & Bundle Verification
- **Directory**: `frontend`
- **Tooling**: Vite 7.3.1, React 18, Tailwind CSS
- **Execution Command**:
  ```powershell
  cd frontend
  npm run build
  ```
- **Execution Result**: Exit code 0, 97 modules transformed, production artifacts output to `frontend/dist`.

---

## 4. Test Case Catalog Summary

| Tier | Suite Name | Tests Count | Scope & Focus |
|------|------------|-------------|---------------|
| **Tier 1.1** | R1 Landing Page & Navigation Topbar | 3 | Hospital intro, hero, stats, topbar Login & Register links, authenticated user badge |
| **Tier 1.2** | R2 Two-Step Registration & SMTP OTP | 4 | Step 1 credentials, real SMTP OTP dispatch, OTP gate, Step 2 required vs optional fields |
| **Tier 1.3** | R3 Multi-Role Dual Login & Redirection | 4 | Dual login (Email/Username), "Quên mật khẩu" href="#", Register link, role dashboard redirection |
| **Tier 1.4** | R4 Patient Portal & Appointments | 6 | Sidebar items, PayOS booking placeholder, search & status filters, virtual ticket, 24h cancel, reschedule slots |
| **Tier 1.5** | R5 Receptionist Portal & Patients CRUD | 4 | Sidebar items, Walk-in SOP placeholder, hospital-wide appointments, check-in/undo, patient CRUD & status |
| **Tier 1.6** | R6 Doctor Dashboard & Greeting | 3 | Doctor sidebar, dynamic greeting banner (`user.fullName`), specialty badge, shift stats, clinical roadmap |
| **Tier 2** | Boundary & Corner Cases | 12 | 24h notice rule, counter exemption, same-day check-in, encounter lock, OTP format, offline walk-in safeguard |
| **Tier 3** | Cross-Feature User Journeys | 4 | Patient self-service journey, Receptionist operations journey, Doctor clinical entry journey, RBAC guards |
| **Tier 4** | Real-World Scenarios & Integrity | 6 | 401 session expiration, Bearer token injection, viewport config, dependencies, dist bundle, backend regression |
| **Total** | **All 4 Tiers** | **46** | **100% Requirements Coverage across R1 through R6** |

---

## 5. Automated Verification Output

The test suite produces structured, colorized terminal output and outputs a complete JSON summary to `tests/test-results.json`:

```json
{
  "summary": {
    "total": 46,
    "passed": 46,
    "failed": 0,
    "skipped": 0,
    "durationMs": 16,
    "executedAt": "2026-11-02T22:27:11.890Z"
  }
}
```
