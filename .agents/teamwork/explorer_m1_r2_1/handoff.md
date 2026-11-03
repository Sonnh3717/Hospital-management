# Investigation and Remediation Report: Spring Security Context & Session Authentication Filter

## 1. Observation

1. **Current Context Mutator in `SessionAuthenticationFilter.java` (Lines 82–87)**:
   - File: `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java`
   - Verbatim code:
     ```java
     82: UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
     83:         principal,
     84:         sessionId,
     85:         Collections.singletonList(new SimpleGrantedAuthority(roleName)));
     86: SecurityContextHolder.getContext().setAuthentication(authToken);
     ```

2. **Spring Security 6+ Deferred Context Mechanism Disassembly**:
   - Class: `org.springframework.security.core.context.ThreadLocalSecurityContextHolderStrategy`
   - Disassembled structure:
     ```java
     private static final ThreadLocal<Supplier<SecurityContext>> contextHolder;

     public SecurityContext getContext() {
         return getDeferredContext().get();
     }

     public void setContext(SecurityContext context) {
         Assert.notNull(context, "Only non-null SecurityContext instances are permitted");
         contextHolder.set(() -> context);
     }

     public void setDeferredContext(Supplier<SecurityContext> deferredContext) {
         Assert.notNull(deferredContext, "Only non-null Supplier instances are permitted");
         contextHolder.set(deferredContext);
     }
     ```
   - Class: `org.springframework.security.web.authentication.AnonymousAuthenticationFilter`
     ```java
     public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
         Supplier<SecurityContext> deferredContext = this.securityContextHolderStrategy.getDeferredContext();
         this.securityContextHolderStrategy.setDeferredContext(
             defaultWithAnonymous(request, deferredContext)
         );
         chain.doFilter(request, response);
     }
     ```
   - Calling `SecurityContextHolder.getContext().setAuthentication(authToken)` resolves the deferred context supplier on the current thread and mutates that specific object, but does NOT replace the `ThreadLocal` supplier or synchronize the request attribute stored by `RequestAttributeSecurityContextRepository` (`RequestAttributeSecurityContextRepository.DEFAULT_REQUEST_ATTR_NAME`).

3. **Absence of `FilterRegistrationBean` in Production Code (`src/main`)**:
   - Search across `backend/swd/src/main` for `FilterRegistrationBean`: 0 occurrences.
   - `SessionAuthenticationFilter` is decorated with `@Component` (`SessionAuthenticationFilter.java:26`).
   - In `SecurityConfig.java:58`, `SessionAuthenticationFilter` is also registered in the Spring Security filter chain:
     ```java
     .addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
     ```
   - In Spring Boot, any filter annotated with `@Component` is automatically registered by `ServletContextInitializerBeans` into the outer Servlet container (Tomcat) for `/*`.
   - Because `SessionAuthenticationFilter` extends `OncePerRequestFilter`, it executes once in the outer servlet chain, marks the request attribute `alreadyFilteredAttributeName = true`, and is subsequently skipped when `FilterChainProxy` invokes it inside the Spring Security filter chain.
   - Inside `FilterChainProxy`, `SecurityContextHolderFilter` resets the security context holder with a clean `SupplierDeferredSecurityContext`. Because `SessionAuthenticationFilter` is bypassed inside `FilterChainProxy`, `AnonymousAuthenticationFilter` evaluates an unauthenticated context and injects `AnonymousAuthenticationToken`.

4. **Absence of Account Status Verification (`SessionAuthenticationFilter.java:52`)**:
   - Verbatim code:
     ```java
     52: if (session.getRevokedAt() == null && session.getExpiresAt().isAfter(LocalDateTime.now())) {
     53:     UserAccount account = session.getUserAccount();
     ```
   - Unlike `AuthServiceImpl.java:49` (`if (account.getStatus() != ActiveStatus.ACTIVE)`), `SessionAuthenticationFilter` does not inspect `account.getStatus() == ActiveStatus.ACTIVE`.
   - If an account is deactivated via `PUT /api/reception/patients/{id}/status` or `PUT /api/admin/users/{id}/status`, active bearer tokens remain valid until session expiration.

5. **Adversarial WebMvc Test Evidence**:
   - In `ChallengerWebValidationAndSecurityTest.java` (lines 51–59), the challenger had to manually register an ad-hoc test configuration:
     ```java
     @org.springframework.boot.test.context.TestConfiguration
     static class FilterDisableConfig {
         @org.springframework.context.annotation.Bean
         public org.springframework.boot.web.servlet.FilterRegistrationBean<SessionAuthenticationFilter> disableSessionFilterForServlet(SessionAuthenticationFilter filter) {
             org.springframework.boot.web.servlet.FilterRegistrationBean<SessionAuthenticationFilter> reg = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(filter);
             reg.setEnabled(false);
             return reg;
         }
     }
     ```
   - This proves that duplicate servlet filter registration occurs in standard Spring Boot environments unless `FilterRegistrationBean` disables it.

---

## 2. Logic Chain

1. **Failure of `SecurityContextHolder.getContext().setAuthentication(authToken)` in Spring Security 6**:
   - In Spring Security 6+, the security context is lazily supplied via `SupplierDeferredSecurityContext` and persisted through `SecurityContextRepository` (Observation 2).
   - Merely calling `getContext().setAuthentication(...)` mutates an ephemeral object without updating the `SecurityContextRepository` or replacing the deferred supplier in `ThreadLocalSecurityContextHolderStrategy`.
   - When downstream `AnonymousAuthenticationFilter` executes, it wraps `getDeferredContext()` into `defaultWithAnonymous(...)`. If the repository supplier is evaluated and finds no saved context in request attributes, or if the thread context was re-initialized, it falls back to creating an `AnonymousAuthenticationToken`.
   - Downstream `AuthorizationFilter` sees `AnonymousAuthenticationToken` accessing protected URLs (e.g. `/api/reception/**`), denies access, and triggers `SecurityResponses.unauthorized(response)`, producing HTTP 401 `UNAUTHENTICATED`.
   - **Resolution**: An explicit, clean context must be created via `SecurityContextHolder.createEmptyContext()`, assigned the authentication token, set into the holder via `SecurityContextHolder.setContext(context)` (which sets `contextHolder.set(() -> context)` in the strategy), and explicitly saved into request attributes via `securityContextRepository.saveContext(context, request, response)`.

2. **Root Cause of Duplicate Execution & Filter Bypass**:
   - `SessionAuthenticationFilter` is a Spring `@Component` extending `OncePerRequestFilter` (Observation 3).
   - In Spring Boot, every `Filter` bean is automatically registered into the Servlet container chain unless explicitly disabled via `FilterRegistrationBean.setEnabled(false)`.
   - Simultaneously, `SecurityConfig` places `sessionAuthenticationFilter` into `FilterChainProxy`.
   - During a request, the Servlet container executes `SessionAuthenticationFilter` *before* `FilterChainProxy`. At that time, `SecurityContextHolderFilter` has not yet run, so any context initialized is wiped or ignored when `SecurityContextHolderFilter` installs its deferred supplier.
   - When `FilterChainProxy` subsequently encounters `SessionAuthenticationFilter`, `OncePerRequestFilter` checks `request.getAttribute(...)`, determines the filter has already run, and short-circuits.
   - **Resolution**: Register a `FilterRegistrationBean<SessionAuthenticationFilter>` bean in `SecurityConfig.java` with `registration.setEnabled(false)`. This guarantees that the filter is *only* invoked within `FilterChainProxy` at position `addFilterBefore(..., UsernamePasswordAuthenticationFilter.class)`.

3. **Root Cause of Inactive Account Authorization Leak**:
   - `SessionAuthenticationFilter` only checked `session.getRevokedAt() == null` and `session.getExpiresAt().isAfter(now)` (Observation 4).
   - An account toggled from `ACTIVE` to `INACTIVE` retains valid active sessions in `auth_sessions`.
   - **Resolution**: Enforce `session.getUserAccount() != null && session.getUserAccount().getStatus() == ActiveStatus.ACTIVE` in `SessionAuthenticationFilter`. When an account is inactive, the filter skips authentication, causing Spring Security to reject protected endpoints with HTTP 401 `UNAUTHENTICATED`.

---

## 3. Caveats

1. **Integration Tests Requiring External MySQL**:
   - `AppointmentWorkflowIntegrationTest` and `PayOSAndSchedulerIntegrationTest` connect to MySQL on `localhost:3306`. They must be run in environments where MySQL is up; unit and WebMvc tests run purely in-memory.
2. **Stateless Request Attribute Repository**:
   - Using `RequestAttributeSecurityContextRepository` ensures zero HTTP session creation overhead, fully complying with `.sessionCreationPolicy(SessionCreationPolicy.STATELESS)`.
3. **No Caveats Regarding Spring Security 6 Compatibility**:
   - Both `SecurityContextHolder.setContext(context)` and `securityContextRepository.saveContext(context, request, response)` are fully supported in Spring Boot 3.4+ / 4.0.1 and Spring Security 6.x / 7.x.

---

## 4. Conclusion & Concrete Remediation Proposal

### A. Proposed Code Change for `SessionAuthenticationFilter.java`
**Target File**: `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java`

```diff
--- a/backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java
+++ b/backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java
@@ -2,6 +2,7 @@ package com.example.swd.security;
 
+import com.example.swd.entity.common.enums.ActiveStatus;
 import com.example.swd.entity.identity.AuthSession;
 import com.example.swd.entity.identity.UserAccount;
 import com.example.swd.entity.patient.Patient;
@@ -16,6 +17,9 @@ import lombok.RequiredArgsConstructor;
 import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
 import org.springframework.security.core.authority.SimpleGrantedAuthority;
+import org.springframework.security.core.context.SecurityContext;
 import org.springframework.security.core.context.SecurityContextHolder;
+import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
+import org.springframework.security.web.context.SecurityContextRepository;
 import org.springframework.stereotype.Component;
 import org.springframework.web.filter.OncePerRequestFilter;
 
@@ -32,6 +36,7 @@ public class SessionAuthenticationFilter extends OncePerRequestFilter {
     private final HospitalStaffRepository hospitalStaffRepository;
     private final PatientRepository patientRepository;
+    private final SecurityContextRepository securityContextRepository = new RequestAttributeSecurityContextRepository();
 
     @Override
     protected boolean shouldNotFilter(HttpServletRequest request) {
@@ -51,7 +56,10 @@ public class SessionAuthenticationFilter extends OncePerRequestFilter {
             Optional<AuthSession> sessionOpt = authSessionRepository.findForAuthentication(sessionId);
             if (sessionOpt.isPresent()) {
                 AuthSession session = sessionOpt.get();
-                if (session.getRevokedAt() == null && session.getExpiresAt().isAfter(LocalDateTime.now())) {
+                if (session.getRevokedAt() == null
+                        && session.getExpiresAt().isAfter(LocalDateTime.now())
+                        && session.getUserAccount() != null
+                        && session.getUserAccount().getStatus() == ActiveStatus.ACTIVE) {
                     UserAccount account = session.getUserAccount();
                     String roleName = "ROLE_" + account.getRole().getRoleCode().name();
                     Long staffId = null;
@@ -83,7 +91,10 @@ public class SessionAuthenticationFilter extends OncePerRequestFilter {
                             principal,
                             sessionId,
                             Collections.singletonList(new SimpleGrantedAuthority(roleName)));
-                    SecurityContextHolder.getContext().setAuthentication(authToken);
+                    SecurityContext context = SecurityContextHolder.createEmptyContext();
+                    context.setAuthentication(authToken);
+                    SecurityContextHolder.setContext(context);
+                    securityContextRepository.saveContext(context, request, response);
                 }
             }
         }
```

### B. Proposed Code Change for `SecurityConfig.java`
**Target File**: `backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java`

```diff
--- a/backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java
+++ b/backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java
@@ -1,6 +1,7 @@
 package com.example.swd.security;
 
 import lombok.RequiredArgsConstructor;
+import org.springframework.boot.web.servlet.FilterRegistrationBean;
 import org.springframework.context.annotation.Bean;
 import org.springframework.context.annotation.Configuration;
 import org.springframework.http.HttpMethod;
@@ -29,6 +30,14 @@ public class SecurityConfig {
         PasswordEncoder passwordEncoder() {
                 return new BCryptPasswordEncoder();
         }
 
+        @Bean
+        public FilterRegistrationBean<SessionAuthenticationFilter> sessionAuthenticationFilterRegistration(
+                        SessionAuthenticationFilter filter) {
+                FilterRegistrationBean<SessionAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
+                registration.setEnabled(false);
+                return registration;
+        }
+
         @Bean
         SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
```

### C. Proposed Dedicated Unit Test: `SessionAuthenticationFilterTest.java`
**Target File**: `backend/swd/src/test/java/com/example/swd/security/SessionAuthenticationFilterTest.java`

```java
package com.example.swd.security;

import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.identity.AuthSession;
import com.example.swd.entity.identity.Role;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.repository.AuthSessionRepository;
import com.example.swd.repository.HospitalStaffRepository;
import com.example.swd.repository.PatientRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test: SessionAuthenticationFilter")
class SessionAuthenticationFilterTest {

    @Mock private AuthSessionRepository authSessionRepository;
    @Mock private HospitalStaffRepository hospitalStaffRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private FilterChain filterChain;

    @InjectMocks
    private SessionAuthenticationFilter filter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("doFilter: Valid active receptionist session sets SecurityContext and persists request attribute")
    void doFilter_validActiveStaffSession_setsSecurityContextAndRequestAttribute() throws ServletException, IOException {
        String token = "valid-token-123";
        request.addHeader("Authorization", "Bearer " + token);
        request.setRequestURI("/api/reception/patients");

        UserAccount account = new UserAccount();
        account.setId(10L);
        account.setUsername("receptionist1");
        account.setStatus(ActiveStatus.ACTIVE);
        Role role = new Role();
        role.setRoleCode(Role.RoleCode.RECEPTIONIST);
        account.setRole(role);

        AuthSession session = new AuthSession();
        session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now().plusHours(2));

        HospitalStaff staff = new HospitalStaff();
        staff.setId(5L);
        staff.setFullName("Nguyen Van Le Tan");

        when(authSessionRepository.findForAuthentication(token)).thenReturn(Optional.of(session));
        when(hospitalStaffRepository.findByUserAccount_Id(10L)).thenReturn(Optional.of(staff));

        filter.doFilter(request, response, filterChain);

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isInstanceOf(StaffPrincipal.class);
        StaffPrincipal principal = (StaffPrincipal) authentication.getPrincipal();
        assertThat(principal.accountId()).isEqualTo(10L);
        assertThat(principal.staffId()).isEqualTo(5L);
        assertThat(principal.fullName()).isEqualTo("Nguyen Van Le Tan");
        assertThat(principal.role()).isEqualTo("RECEPTIONIST");
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_RECEPTIONIST");

        assertThat(request.getAttribute(RequestAttributeSecurityContextRepository.DEFAULT_REQUEST_ATTR_NAME))
                .isNotNull()
                .isEqualTo(SecurityContextHolder.getContext());

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilter: Deactivated user account (INACTIVE) does not authenticate")
    void doFilter_inactiveUserAccount_doesNotAuthenticate() throws ServletException, IOException {
        String token = "inactive-token-123";
        request.addHeader("Authorization", "Bearer " + token);
        request.setRequestURI("/api/reception/patients");

        UserAccount account = new UserAccount();
        account.setId(20L);
        account.setUsername("inactive.user");
        account.setStatus(ActiveStatus.INACTIVE);
        Role role = new Role();
        role.setRoleCode(Role.RoleCode.PATIENT);
        account.setRole(role);

        AuthSession session = new AuthSession();
        session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now().plusHours(2));

        when(authSessionRepository.findForAuthentication(token)).thenReturn(Optional.of(session));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(request.getAttribute(RequestAttributeSecurityContextRepository.DEFAULT_REQUEST_ATTR_NAME)).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilter: Expired session does not authenticate")
    void doFilter_expiredSession_doesNotAuthenticate() throws ServletException, IOException {
        String token = "expired-token";
        request.addHeader("Authorization", "Bearer " + token);

        UserAccount account = new UserAccount();
        account.setId(30L);
        account.setStatus(ActiveStatus.ACTIVE);
        AuthSession session = new AuthSession();
        session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(authSessionRepository.findForAuthentication(token)).thenReturn(Optional.of(session));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilter: Revoked session does not authenticate")
    void doFilter_revokedSession_doesNotAuthenticate() throws ServletException, IOException {
        String token = "revoked-token";
        request.addHeader("Authorization", "Bearer " + token);

        UserAccount account = new UserAccount();
        account.setId(40L);
        account.setStatus(ActiveStatus.ACTIVE);
        AuthSession session = new AuthSession();
        session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now().plusHours(1));
        session.setRevokedAt(LocalDateTime.now());

        when(authSessionRepository.findForAuthentication(token)).thenReturn(Optional.of(session));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilter: Missing or invalid Authorization header bypasses authentication")
    void doFilter_invalidAuthHeader_bypassesAuthentication() throws ServletException, IOException {
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(authSessionRepository);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("shouldNotFilter: Public routes and OPTIONS requests return true")
    void shouldNotFilter_publicRoutesAndOptions_returnsTrue() {
        MockHttpServletRequest loginReq = new MockHttpServletRequest("POST", "/api/auth/login");
        MockHttpServletRequest healthReq = new MockHttpServletRequest("GET", "/api/health");
        MockHttpServletRequest publicReq = new MockHttpServletRequest("GET", "/api/public/data");
        MockHttpServletRequest optionsReq = new MockHttpServletRequest("OPTIONS", "/api/reception/patients");
        MockHttpServletRequest protectedReq = new MockHttpServletRequest("GET", "/api/reception/patients");

        assertThat(filter.shouldNotFilter(loginReq)).isTrue();
        assertThat(filter.shouldNotFilter(healthReq)).isTrue();
        assertThat(filter.shouldNotFilter(publicReq)).isTrue();
        assertThat(filter.shouldNotFilter(optionsReq)).isTrue();
        assertThat(filter.shouldNotFilter(protectedReq)).isFalse();
    }
}
```

---

## 5. Verification Method

1. **Verify Unit Test Suite for SessionAuthenticationFilter**:
   ```powershell
   cd backend/swd
   ./mvnw test "-Dtest=SessionAuthenticationFilterTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
   ```
   *Expected Result*: All 6 unit tests in `SessionAuthenticationFilterTest` pass with 0 failures and 0 errors.

2. **Verify Adversarial WebMvc Security Probing Suite**:
   ```powershell
   cd backend/swd
   ./mvnw test "-Dtest=ChallengerWebValidationAndSecurityTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
   ```
   *Expected Result*: All 15 tests in `ChallengerWebValidationAndSecurityTest` pass with 0 failures and 0 errors.

3. **Verify Full Milestone 1 Regression Suite**:
   ```powershell
   cd backend/swd
   ./mvnw test "-Dtest=SessionAuthenticationFilterTest,PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest,ChallengerPatientRegistrationServiceTest,ChallengerReceptionPatientServiceTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
   ```
   *Expected Result*: 100% of tests pass across all test suites with 0 failures and 0 errors.

4. **Invalidation Conditions**:
   - Any test failure in `SessionAuthenticationFilterTest` or `ChallengerWebValidationAndSecurityTest`.
   - Returning HTTP 401 on valid Bearer token for protected receptionist, doctor, or patient endpoints.
   - Allowing authenticated access with a token belonging to an account with `status = INACTIVE`.
