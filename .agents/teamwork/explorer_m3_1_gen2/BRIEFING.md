# BRIEFING — 2026-11-02T21:40:00Z

## Mission
Investigate and design technical blueprint for R4: Patient Portal (booking placeholder, appointment management with search/filter/detail/cancel/reschedule).

## 🔒 My Identity
- Archetype: explorer
- Roles: Patient Portal Explorer
- Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m3_1_gen2
- Original parent: 57be1812-6fc7-41d3-9fd8-655dc3f13abb
- Milestone: Milestone 3 (R4: Patient Portal)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Follow Handoff Protocol (5 sections: Observation, Logic Chain, Caveats, Conclusion, Verification Method)
- Write only to .agents/teamwork/explorer_m3_1_gen2/

## Current Parent
- Conversation ID: 57be1812-6fc7-41d3-9fd8-655dc3f13abb
- Updated: 2026-11-02T21:40:00Z

## Investigation State
- **Explored paths**:
  - `frontend/src/App.jsx`, `frontend/src/layouts/WorkspaceLayout.jsx`
  - `frontend/src/pages/patient/PatientBookingPage.jsx`, `PatientAppointmentsPage.jsx`
  - `frontend/src/services/api.js`, `patientApi.js`, `context/AuthContext.jsx`
  - `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`
  - `backend/swd/src/main/java/com/example/swd/service/impl/AppointmentServiceImpl.java`
  - `backend/swd/src/main/java/com/example/swd/dto/request/CancelAppointmentRequest.java`, `RescheduleRequest.java`
  - `backend/swd/src/main/java/com/example/swd/dto/response/AppointmentResponse.java`, `WorkflowViews.java`
  - `backend/swd/src/main/java/com/example/swd/entity/appointment/Appointment.java`, `AppointmentSlot.java`
  - `backend/swd/src/main/resources/db/showcase_demo_seed.sql`
- **Key findings**:
  - `WorkspaceLayout.jsx` and `App.jsx` already have the 2 patient routes `/patient/book` and `/patient/appointments` wired to sidebar items.
  - Backend endpoints verified: `GET /api/patient/appointments`, `GET /api/appointments/available-slots`, `GET /api/appointments/{id}`, `POST /api/appointments/{id}/cancel`, `PUT /api/appointments/{id}/reschedule`.
  - Crucial payload detail: `RescheduleRequest` Java property is `newAppointmentSlotId` (`@NotNull`). Frontend `api.reschedule` currently sends `{ newSlotId, reason }`, which causes validation failure unless `{ newAppointmentSlotId: newSlotId, newSlotId, reason }` is sent.
  - 24h notice rule: In `AppointmentServiceImpl`, if `isPatient == true`, `Duration.between(now, startsAt).toMinutes() < 1440` throws 400 `DEADLINE_EXCEEDED` ("Chỉ được phép hủy lịch hẹn trước giờ khám tối thiểu 24 giờ" / "Chỉ được phép đổi lịch hẹn trước giờ khám tối thiểu 24 giờ"). Client-side should calculate notice and display clear warnings.
  - Appointment statuses: `BOOKED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW`. Only `BOOKED` appointments can be cancelled or rescheduled.
  - Seed demo data provides: User `patient` (`patient@hospital.vn` / `Password123!`), with `APT-CHKIN-...` (today, CHECKED_IN) and `APT-BOOKED-...` (tomorrow, BOOKED) ready for cancel/reschedule testing.
- **Unexplored areas**: None for R4.

## Key Decisions Made
- Formulate comprehensive design and code snippets for Worker M3 to implement `PatientBookingPage.jsx`, `PatientAppointmentsPage.jsx`, and fix `appointmentApi.reschedule` in `api.js`.

## Artifact Index
- DISPATCH.md — Task assignment from parent
- progress.md — Liveness heartbeat and milestone tracker
- BRIEFING.md — Persistent context index
- handoff.md — Comprehensive analysis deliverable
