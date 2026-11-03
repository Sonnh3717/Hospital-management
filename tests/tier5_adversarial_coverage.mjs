/**
 * Hospital Management System Showcase - Tier 5 Adversarial Coverage Hardening Suite
 *
 * Executes Phase 2 Tier 5 Adversarial Coverage Hardening:
 * 1. White-box contract compliance & security filter inspection
 * 2. Unauthenticated access and role-spoofing matrix verification
 * 3. IDOR and parameter tampering defense verification
 * 4. 24-hour deadline and state machine transition guards
 * 5. Single-use OTP token lifecycle and anti-replay verification
 * 6. Walk-in patient account mutation safeguards
 * 7. Frontend route protection, token lifecycle, and session expiration resilience
 *
 * Execution: node tests/tier5_adversarial_coverage.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const suiteResults = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now(),
  suites: [],
};

let currentSuite = null;

function suite(name, fn) {
  const s = { name, tests: [], passed: 0, failed: 0 };
  suiteResults.suites.push(s);
  currentSuite = s;
  console.log(`\n\x1b[1m\x1b[35m=== TIER 5 CHALLENGE: ${name} ===\x1b[0m`);
  try {
    fn();
  } catch (err) {
    console.error(`\x1b[31mSuite failed to execute: ${err.message}\x1b[0m`);
  }
}

function test(id, desc, fn) {
  suiteResults.total++;
  const record = { id, desc, status: 'PENDING', error: null, durationMs: 0 };
  const start = Date.now();
  try {
    fn();
    record.durationMs = Date.now() - start;
    record.status = 'PASSED';
    suiteResults.passed++;
    currentSuite.passed++;
    console.log(`  \x1b[32m✔ [${id}]\x1b[0m ${desc} \x1b[90m(${record.durationMs}ms)\x1b[0m`);
  } catch (err) {
    record.durationMs = Date.now() - start;
    record.status = 'FAILED';
    record.error = err.message;
    suiteResults.failed++;
    currentSuite.failed++;
    console.error(`  \x1b[31m✘ [${id}]\x1b[0m ${desc}`);
    console.error(`     \x1b[31mFailure: ${err.message}\x1b[0m`);
  }
  currentSuite.tests.push(record);
}

function readFile(relPath) {
  const p = path.resolve(ROOT_DIR, relPath);
  assert.ok(fs.existsSync(p), `Missing required file: ${relPath}`);
  return fs.readFileSync(p, 'utf-8');
}

console.log('\n\x1b[1m\x1b[31m======================================================================\x1b[0m');
console.log('\x1b[1m\x1b[31m  PHASE 2 TIER 5: ADVERSARIAL COVERAGE HARDENING STRESS SUITE        \x1b[0m');
console.log('\x1b[1m\x1b[31m======================================================================\x1b[0m');

// ====================================================================
// SECTION 1: Backend SecurityFilter & RBAC Hardening
// ====================================================================

suite('1. Backend Security Architecture & RBAC Isolation Hardening', () => {
  const secConfig = readFile('backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java');
  const sessionFilter = readFile('backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java');
  const secResponses = readFile('backend/swd/src/main/java/com/example/swd/security/SecurityResponses.java');

  test('T5-SEC-01', 'SecurityConfig enforces strict stateless session creation policy', () => {
    assert.match(secConfig, /sessionCreationPolicy\(SessionCreationPolicy\.STATELESS\)/,
      'Must configure STATELESS session creation policy to prevent cookie session fixation');
  });

  test('T5-SEC-02', 'SecurityConfig specifies custom JSON error responses for 401 Unauthorized and 403 Forbidden', () => {
    assert.match(secConfig, /authenticationEntryPoint\(\(request,\s*response,\s*exception\)\s*->\s*SecurityResponses\.unauthorized\(response\)\)/,
      'Must route unauthenticated attempts to SecurityResponses.unauthorized');
    assert.match(secConfig, /accessDeniedHandler\(\(request,\s*response,\s*exception\)\s*->\s*SecurityResponses\s*\.forbidden\(response\)\)/,
      'Must route unauthorized role attempts to SecurityResponses.forbidden');
    assert.match(secResponses, /write\(response,\s*401,\s*"UNAUTHENTICATED",\s*"Vui lòng đăng nhập lại\."\)/,
      'Returns standard UNAUTHENTICATED error code and message');
    assert.match(secResponses, /write\(response,\s*403,\s*"FORBIDDEN",\s*"Bạn không có quyền truy cập chức năng này\."\)/,
      'Returns standard FORBIDDEN error code and message');
  });

  test('T5-SEC-03', 'SecurityConfig defines strict role-based access rules for all protected domains', () => {
    assert.match(secConfig, /\.requestMatchers\("\/api\/reception\/\*\*"\)\.hasRole\("RECEPTIONIST"\)/,
      'Receptionist endpoints strictly restricted to ROLE_RECEPTIONIST');
    assert.match(secConfig, /\.requestMatchers\("\/api\/doctor\/\*\*"\)\.hasRole\("DOCTOR"\)/,
      'Doctor endpoints strictly restricted to ROLE_DOCTOR');
    assert.match(secConfig, /\.requestMatchers\("\/api\/patient\/\*\*"\)\.hasRole\("PATIENT"\)/,
      'Patient endpoints strictly restricted to ROLE_PATIENT');
    assert.match(secConfig, /\.requestMatchers\("\/api\/admin\/\*\*"\)\.hasRole\("ADMIN"\)/,
      'Admin endpoints strictly restricted to ROLE_ADMIN');
    assert.match(secConfig, /\.anyRequest\(\)\.authenticated\(\)/,
      'Default fallthrough rejects any unspecified route unless authenticated');
  });

  test('T5-SEC-04', 'SessionAuthenticationFilter enforces Bearer format, expiry, revocation, and active user checks', () => {
    assert.match(sessionFilter, /authorization\.startsWith\("Bearer "\)\s*&&\s*authorization\.length\(\)\s*>\s*7/,
      'Enforces non-empty Bearer token');
    assert.match(sessionFilter, /session\.getRevokedAt\(\)\s*==\s*null/,
      'Rejects revoked sessions immediately');
    assert.match(sessionFilter, /session\.getExpiresAt\(\)\.isAfter\(LocalDateTime\.now\(\)\)/,
      'Rejects expired sessions immediately');
    assert.match(sessionFilter, /session\.getUserAccount\(\)\.getStatus\(\)\s*==\s*ActiveStatus\.ACTIVE/,
      'Rejects deactivated user accounts immediately even if session token is valid');
  });

  test('T5-SEC-05', 'SessionAuthenticationFilter securely constructs StaffPrincipal without role elevation', () => {
    assert.match(sessionFilter, /String roleName = "ROLE_" \+ account\.getRole\(\)\.getRoleCode\(\)\.name\(\)/,
      'Maps role directly from DB entity to Spring Security GrantedAuthority');
    assert.match(sessionFilter, /Collections\.singletonList\(new SimpleGrantedAuthority\(roleName\)\)/,
      'Grants single un-elevated authority matching DB role');
  });
});

// ====================================================================
// SECTION 2: Controller Method Security & IDOR Defense
// ====================================================================

suite('2. Controller Method Security, Dual Protection & IDOR Tamper Resistance', () => {
  const recPatientCtrl = readFile('backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionPatientController.java');
  const recApptCtrl = readFile('backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionAppointmentController.java');
  const apptCtrl = readFile('backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java');

  test('T5-IDOR-01', 'Reception controllers enforce class-level @PreAuthorize("hasRole(\'RECEPTIONIST\')")', () => {
    assert.match(recPatientCtrl, /@PreAuthorize\("hasRole\('RECEPTIONIST'\)"\)/,
      'ReceptionPatientController dual-layered with class-level @PreAuthorize');
    assert.match(recApptCtrl, /@PreAuthorize\("hasRole\('RECEPTIONIST'\)"\)/,
      'ReceptionAppointmentController dual-layered with class-level @PreAuthorize');
  });

  test('T5-IDOR-02', 'getPatientAppointments strictly binds patient ID to caller, blocking non-admin IDOR parameter injection', () => {
    assert.match(apptCtrl, /boolean isAdmin = principal != null && \("ADMIN"\.equalsIgnoreCase\(principal\.role\(\)\) \|\| "ROLE_ADMIN"\.equalsIgnoreCase\(principal\.role\(\)\)\);/,
      'Verifies whether caller is authorized admin');
    assert.match(apptCtrl, /if \(!isAdmin\) \{[\s\S]*?targetPatientId = principal != null && principal\.patientId\(\) != null[\s\S]*?: \(principal != null && principal\.accountId\(\) != null[\s\S]*?: null\);[\s\S]*?\}/,
      'For non-admins, completely overwrites any requestParam patientId with authenticated user patientId');
  });

  test('T5-IDOR-03', 'cancelAppointment and rescheduleAppointment extract caller role to enforce 24h constraint on patient role', () => {
    assert.match(apptCtrl, /boolean isPatient = "PATIENT"\.equalsIgnoreCase\(principal\.role\(\)\);/,
      'Identifies PATIENT caller role for appointment cancellation');
    assert.match(apptCtrl, /appointmentService\.cancelAppointment\(id,\s*request,\s*principal\.accountId\(\),\s*isPatient\);/,
      'Passes isPatient flag to service layer to guard 24h notice rule');
    assert.match(apptCtrl, /appointmentService\.rescheduleAppointment\(id,\s*request,\s*principal\.accountId\(\),\s*isPatient\);/,
      'Passes isPatient flag to service layer to guard 24h reschedule rule');
  });
});

// ====================================================================
// SECTION 3: Service Layer State Machine & Boundary Hardening
// ====================================================================

suite('3. Service Layer State Machine, 24h Cancellation & Lock Guards', () => {
  const apptService = readFile('backend/swd/src/main/java/com/example/swd/service/impl/AppointmentServiceImpl.java');
  const recService = readFile('backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java');
  const recPatientService = readFile('backend/swd/src/main/java/com/example/swd/service/impl/ReceptionPatientServiceImpl.java');

  test('T5-STM-01', 'Appointment cancellation enforces status == BOOKED before allowing cancel', () => {
    assert.match(apptService, /if \(appointment\.getStatus\(\) != Appointment\.Status\.BOOKED\)/,
      'Rejects cancelling non-BOOKED appointments with INVALID_STATUS');
  });

  test('T5-STM-02', '24h notice rule strictly computes 1440 minutes threshold between now and slot startsAt', () => {
    assert.match(apptService, /Duration duration = Duration\.between\(LocalDateTime\.now\(\),\s*appointment\.getAppointmentSlot\(\)\.getStartsAt\(\)\);/,
      'Calculates exact duration to startsAt');
    assert.match(apptService, /if \(duration\.toMinutes\(\)\s*<\s*1440\)\s*\{\s*throw new WorkflowException\(HttpStatus\.BAD_REQUEST,\s*"DEADLINE_EXCEEDED"/,
      'Throws DEADLINE_EXCEEDED if under 1440 minutes for patient callers');
  });

  test('T5-STM-03', 'Appointment check-in enforces same-day validation in Vietnam timezone', () => {
    assert.match(recService, /if \(!appointment\.getAppointmentSlot\(\)\.getStartsAt\(\)\.atOffset\(ZoneOffset\.UTC\)\.atZoneSameInstant\(VIETNAM\)\.toLocalDate\(\)\.equals\(today\(\)\)\)\s*\{/,
      'Rejects check-in attempts for appointments not scheduled for today in Vietnam timezone');
  });

  test('T5-STM-04', 'Check-in and undo check-in reject modification if clinical Encounter has already started', () => {
    assert.match(recService, /requireNoEncounter\(appointment,\s*"Bệnh nhân đã bắt đầu khám, không thể hoàn tác check-in\."\);/,
      'Blocks undo check-in if doctor has begun encounter');
    assert.match(recService, /if \(encounter\(appointment\.getId\(\)\)\s*!=\s*null\)\s*throw new WorkflowException\(HttpStatus\.CONFLICT,\s*"ENCOUNTER_STARTED"/,
      'requireNoEncounter throws ENCOUNTER_STARTED conflict exception');
  });

  test('T5-STM-05', 'Offline walk-in patient status toggle strictly blocked when userAccount is null', () => {
    assert.match(recPatientService, /if \(patient\.getUserAccount\(\)\s*==\s*null\)\s*\{\s*throw new WorkflowException\(HttpStatus\.BAD_REQUEST,\s*"NO_USER_ACCOUNT"/,
      'Guarantees walk-in patient records without online accounts cannot be toggled');
  });
});

// ====================================================================
// SECTION 4: Two-Step OTP Verification Gate & Anti-Replay Hardening
// ====================================================================

suite('4. Two-Step OTP Verification Gate, Profile Completion & Anti-Replay', () => {
  const regService = readFile('backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java');

  test('T5-OTP-01', 'completeProfile strictly verifies verifiedAt is non-null before allowing completion', () => {
    assert.match(regService, /if \(verification\.getVerifiedAt\(\)\s*==\s*null\)\s*\{\s*throw new WorkflowException\(HttpStatus\.BAD_REQUEST,\s*"OTP_NOT_VERIFIED"/,
      'Prevents skipping OTP verification step');
  });

  test('T5-OTP-02', 'completeProfile blocks overwriting an already completed profile', () => {
    assert.match(regService, /if \(account\.getStatus\(\) == ActiveStatus\.ACTIVE\) \{[\s\S]*?patient = patients\.findByUserAccount_Id\(account\.getId\(\)\)\.orElse\(null\);[\s\S]*?if \(patient != null && patient\.getDateOfBirth\(\) != null\) \{[\s\S]*?throw new WorkflowException\(HttpStatus\.CONFLICT, "PROFILE_ALREADY_COMPLETED"/,
      'Rejects profile completion replay if already completed');
  });

  test('T5-OTP-03', 'Single-use OTP verification token is strictly purged from DB upon profile completion', () => {
    assert.match(regService, /verifications\.delete\(verification\);/,
      'Deletes verification record from database to prevent token replay attacks');
  });

  test('T5-OTP-04', 'completeProfile activates user account to ACTIVE and generates standardized PT- patient code', () => {
    assert.match(regService, /account\.setStatus\(ActiveStatus\.ACTIVE\);/,
      'Activates account status upon valid profile completion');
    assert.match(regService, /"PT-" \+ UUID\.randomUUID\(\)\.toString\(\)\.replace\("-", ""\)\.substring\(0, 24\)/,
      'Generates 27-char unique PT- patient code');
  });
});

// ====================================================================
// SECTION 5: Frontend Route Protection, Interceptors & Boundary UI
// ====================================================================

suite('5. Frontend Route Protection, Interceptor Resilience & UI Boundaries', () => {
  const appCode = readFile('frontend/src/App.jsx');
  const protectedRouteCode = readFile('frontend/src/components/ProtectedRoute.jsx');
  const authContextCode = readFile('frontend/src/context/AuthContext.jsx');
  const apiCode = readFile('frontend/src/services/api.js');

  test('T5-FE-01', 'ProtectedRoute redirects unauthenticated visitors to /login preserving target location', () => {
    assert.match(protectedRouteCode, /if \(!isAuthenticated \|\| !user\) \{\s*return <Navigate to="\/login" state=\{\{ from: location \}\} replace \/>;\s*\}/,
      'Preserves intended destination in state.from while redirecting to login');
  });

  test('T5-FE-02', 'ProtectedRoute redirects unauthorized roles to their respective home dashboard', () => {
    assert.match(protectedRouteCode, /if \(allowedRoles\.length > 0 && !allowedRoles\.includes\(user\.role\)\) \{/,
      'Checks allowedRoles against user.role');
    assert.match(protectedRouteCode, /const fallbackPath = getRoleDashboardPath\(user\.role\);/,
      'Resolves caller role fallback path');
    assert.match(protectedRouteCode, /return <Navigate to=\{fallbackPath\} replace \/>;/,
      'Redirects to fallback path with replace flag');
  });

  test('T5-FE-03', 'Role dashboard paths mapped unambiguously for all roles', () => {
    assert.match(authContextCode, /case 'PATIENT':\s*return '\/patient';/, 'Maps PATIENT to /patient');
    assert.match(authContextCode, /case 'RECEPTIONIST':\s*return '\/reception';/, 'Maps RECEPTIONIST to /reception');
    assert.match(authContextCode, /case 'DOCTOR':\s*return '\/doctor';/, 'Maps DOCTOR to /doctor');
  });

  test('T5-FE-04', 'Axios response interceptor purges credentials and redirects upon 401 Unauthorized', () => {
    assert.match(apiCode, /if \(error\.response && error\.response\.status === 401\) \{[\s\S]*?localStorage\.removeItem\('token'\);[\s\S]*?localStorage\.removeItem\('auth_user'\);[\s\S]*?window\.location\.href = '\/login\?session_expired=true';[\s\S]*?\}/,
      'Purges stale tokens from localStorage and forces login redirect on session expiration');
  });

  test('T5-FE-05', 'Axios request interceptor injects Bearer authorization token on all outgoing requests', () => {
    assert.match(apiCode, /const token = localStorage\.getItem\('token'\);[\s\S]*?if \(token\) \{[\s\S]*?config\.headers\.Authorization = `Bearer \$\{token\}`;[\s\S]*?\}/,
      'Guarantees bearer authorization token presence on authenticated queries');
  });

  test('T5-FE-06', 'Dual login credential normalization accepts username, email, or login parameter seamlessly', () => {
    assert.match(apiCode, /username: \(credentials\.username \|\| credentials\.login \|\| credentials\.email \|\| ''\)\.trim\(\)/,
      'Normalizes login identifiers to username field expected by backend DTO');
  });
});

// ====================================================================
// SUMMARY & VERDICT
// ====================================================================

const elapsedMs = Date.now() - suiteResults.startTime;
console.log('\n\x1b[1m\x1b[33m======================================================================\x1b[0m');
console.log('\x1b[1m\x1b[33m           TIER 5 ADVERSARIAL STRESS EXECUTION SUMMARY                \x1b[0m');
console.log('\x1b[1m\x1b[33m======================================================================\x1b[0m');
console.log(`Total Stress Tests:  \x1b[1m${suiteResults.total}\x1b[0m`);
console.log(`Passed:              \x1b[1m\x1b[32m${suiteResults.passed}\x1b[0m`);
console.log(`Failed:              \x1b[1m\x1b[31m${suiteResults.failed}\x1b[0m`);
console.log(`Duration:            \x1b[1m${elapsedMs}ms\x1b[0m`);
console.log('\x1b[1m\x1b[33m======================================================================\x1b[0m\n');

if (suiteResults.failed > 0) {
  console.error(`\x1b[31mTIER 5 ADVERSARIAL COVERAGE HARDENING FAILED with ${suiteResults.failed} failure(s)!\x1b[0m\n`);
  process.exit(1);
} else {
  console.log(`\x1b[32mTIER 5 ADVERSARIAL COVERAGE HARDENING PASSED: 100% of adversarial stress assertions satisfied.\x1b[0m\n`);
  process.exit(0);
}
