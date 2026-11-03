# Handoff Report — Frontend Architecture, Build Setup & Auth State Management (Milestone 2)

**Agent**: `explorer_m2_1`  
**Working Directory**: `.agents/teamwork/explorer_m2_1`  
**Parent Agent**: `2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7`  
**Timestamp**: 2026-11-02T18:57:00Z  

---

## 1. Observation

### 1.1 Existing Tooling & Configuration Inspection
1. **Vite Build Failure on Windows OneDrive Reparse Point**:
   - Running `npm --prefix frontend run build` directly triggers a fatal build failure:
     ```
     > swd-frontend@0.0.1 build
     > vite build

     vite v7.3.1 building client environment for production...
     ✓ 0 modules transformed.
     ✗ Build failed in 28ms
     error during build:
     [vite:build-html] EPERM: operation not permitted, realpath 'C:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\frontend\src\main.jsx'
     file: C:/Users/AD/OneDrive/Desktop/FPT/Fall_2026/SWD392/CourseProject/Hospital-management/frontend/index.html
     ```
   - Current `frontend/vite.config.js` (lines 1–10):
     ```javascript
     import { defineConfig } from 'vite';
     import react from '@vitejs/plugin-react';

     export default defineConfig({
       plugins: [react()],
       server: {
         port: 5174,
       },
     });
     ```
   - Observed that `resolve: { preserveSymlinks: true }` is absent.
   - Tested programmatically running Vite build with `resolve: { preserveSymlinks: true }`: The `EPERM: operation not permitted, realpath` completely vanished and 3 modules were successfully transformed before hitting the missing CSS files.

2. **Missing Dependencies in `package.json`**:
   - Inspection of `frontend/package.json` lines 15–20:
     ```json
     "dependencies": {
       "axios": "^1.7.9",
       "react": "^18.2.0",
       "react-dom": "^18.2.0",
       "react-router-dom": "^6.30.0"
     }
     ```
   - `lucide-react` is not present in `package.json` or `node_modules` (`npm --prefix frontend list lucide-react` returned empty).
   - `tailwindcss` (3.4.19), `postcss` (8.5.6), `autoprefixer` (10.4.24), `axios` (1.13.5), `react-router-dom` (6.30.3) are installed in `node_modules`.

3. **Broken Imports and Missing Styles in `frontend/src/`**:
   - Directory `frontend/src/` contains only `App.jsx` and `main.jsx`.
   - Inspection of `frontend/src/main.jsx` lines 1–14:
     ```javascript
     import React from 'react';
     import ReactDOM from 'react-dom/client';
     import App from './App.jsx';
     import './index.css';
     import './styles/global.css';
     import './styles/clinical.css';

     ReactDOM.createRoot(document.getElementById('root')).render(
       <StrictMode>
         <App />
       </StrictMode>,
     );
     ```
   - In `main.jsx` line 11: `<StrictMode>` is referenced, but not imported from `'react'`.
   - Lines 4–6: `./index.css`, `./styles/global.css`, and `./styles/clinical.css` do NOT exist on disk.
   - `frontend/tailwind.config.js` defines `content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}']`, but without `@tailwind` directives in an imported CSS file, Tailwind utility classes are inactive.

4. **Port & Proxy Configuration Discrepancy**:
   - `backend/swd/src/main/resources/application.properties` line 2: `server.port=${SERVER_PORT:8081}`.
   - `frontend/.env.example` line 1: `VITE_API_URL=http://localhost:8081/api`.
   - `backend/swd/.env.example` lines 6–7: `SERVER_PORT=8081`, `CORS_ALLOWED_ORIGINS=http://localhost:5173`.
   - `frontend/vite.config.js` sets dev server port to `5174` and has no proxy defined for `/api`.

### 1.2 Backend Authentication & API Contract Observations
1. **Multi-Role Dual Login (`POST /api/auth/login`)**:
   - File: `backend/swd/src/main/java/com/example/swd/controller/auth/AuthController.java` line 26: accepts `LoginRequest`.
   - File: `backend/swd/src/main/java/com/example/swd/dto/request/LoginRequest.java`:
     ```java
     public class LoginRequest {
         @NotBlank(message = "Tên đăng nhập không được để trống")
         @Size(max = 254)
         private String username;

         @NotBlank(message = "Mật khẩu không được để trống")
         private String password;
     }
     ```
   - File: `backend/swd/src/main/java/com/example/swd/repository/UserAccountRepository.java` lines 16–19:
     ```java
     default Optional<UserAccount> findForLogin(String login) {
         return findByUsername(login).or(() -> findByLoginEmail(login));
     }
     ```
   - **Crucial finding**: The backend accepts BOTH username AND email within the `username` JSON payload field. Frontend must populate `username` with whatever identifier the user types (email or username).
   - Response DTO `backend/swd/src/main/java/com/example/swd/dto/response/LoginResponse.java`:
     ```java
     public class LoginResponse {
         private String token; // UUID session ID
         private UserInfoResponse user; // id, accountId, username, fullName, role, staffId, patientId
     }
     ```
   - `user.role` strings correspond to `RoleCode`: `"PATIENT"`, `"RECEPTIONIST"`, `"DOCTOR"`, `"ADMIN"`, `"MANAGER"`, `"MEDICAL_SERVICE_STAFF"`.

2. **Session Verification & Logout**:
   - `GET /api/auth/me`: requires header `Authorization: Bearer <token>`, returns `UserInfoResponse`.
   - `POST /api/auth/logout`: requires header `Authorization: Bearer <token>`, sets `revoked_at = NOW()` and reason `LOGOUT`. Returns `{"success": true, "message": "Đăng xuất thành công"}`.

3. **Security Filter & Error Format**:
   - File: `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java`: checks `Authorization: Bearer <sessionId>` in `auth_sessions` table.
   - File: `backend/swd/src/main/java/com/example/swd/security/SecurityResponses.java`:
     - 401 Unauthorized payload: `{"code":"UNAUTHENTICATED","message":"Vui lòng đăng nhập lại.","fieldErrors":{},"blockers":[]}`.
     - 403 Forbidden payload: `{"code":"FORBIDDEN","message":"Bạn không có quyền truy cập chức năng này.","fieldErrors":{},"blockers":[]}`.

4. **Patient Registration Endpoints (R2)**:
   - File: `backend/swd/src/main/java/com/example/swd/controller/patient/PatientController.java`:
     - `POST /api/patients/register`: `{ username, fullName, email, password, confirmPassword, agreeTerms: true }` -> sends OTP via SMTP.
     - `POST /api/patients/send-otp`: `{ email }` -> resends OTP.
     - `POST /api/patients/verify-otp`: `{ email, otp }` -> validates OTP.
     - `POST /api/patients/complete-profile`:
       - Required fields: `email`, `fullName`, `dateOfBirth` (YYYY-MM-DD), `gender` (`MALE`/`FEMALE`/`OTHER`), `phone`, `address`.
       - Optional fields: `emergencyContactName`, `emergencyContactPhone`.
     - `GET /api/patients/check-username?username=...`: returns boolean availability.

5. **Appointment & Receptionist Endpoints (R4, R5, R6)**:
   - `GET /api/patient/appointments`: logged-in patient appointment history.
   - `GET /api/appointments/available-slots`: public query for booking slots (`date`, `doctorId`).
   - `POST /api/appointments/{id}/cancel` & `PUT /api/appointments/{id}/reschedule`.
   - `GET /api/reception/appointments`: hospital-wide appointment list with filters (`date`, `doctorId`, `status`, `search`, `page`, `size`).
   - `POST /api/reception/appointments/{id}/check-in` & `/undo-check-in`.
   - `GET /api/reception/patients`, `POST /api/reception/patients`, `PUT /api/reception/patients/{id}`, `PUT /api/reception/patients/{id}/status`.
   - `GET /api/doctor/appointments`: doctor appointments for selected date.

---

## 2. Logic Chain

1. **Build Resolution Logic**:
   - Observation 1.1(1) demonstrated that Node's `fs.realpath` fails with `EPERM` when resolving files located inside OneDrive folders on Windows NTFS reparse points.
   - By configuring `resolve: { preserveSymlinks: true }` in `vite.config.js`, Rollup and Vite bypass `fs.realpath` and evaluate file paths directly, eliminating the EPERM crash.
   - Observation 1.1(4) revealed port mismatch between backend defaults (8081) and frontend dev server (5174 vs 5173). Adding a reverse proxy in `vite.config.js` for `/api` targeting `http://localhost:8081` guarantees seamless dev routing without browser CORS restrictions.

2. **Styling & Asset Initialization Logic**:
   - Observation 1.1(3) identified missing CSS files causing import resolution failure.
   - Creating `src/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;` and cleaning up `main.jsx` imports ensures immediate Tailwind build success.
   - For icons: Since `lucide-react` is not pre-installed, implementers can either run `npm --prefix frontend install lucide-react` or use a lightweight SVG icon helper module. We provide blueprints supporting both approaches.

3. **Auth State & Storage Synchronization Logic**:
   - Observation 1.2(1) showed that the backend session token is a UUID stored in database table `auth_sessions`, returned in `LoginResponse.token`, while user metadata is returned in `LoginResponse.user`.
   - Storing `token` under `'token'` and user data under `'auth_user'` in `localStorage` persists sessions across page refreshes.
   - On app startup, `AuthContext` hydrates `user` and `token` from `localStorage` and asynchronously calls `GET /api/auth/me` to confirm backend validity. If expired (401), storage is cleared and state is reset cleanly.
   - Observation 1.2(1) showed that `LoginRequest` expects `username` for both username and email. The `login()` method accepts `{ username, email, login, password }` and maps whichever identifier is provided to the `username` field.
   - Role helpers (`isPatient`, `isReceptionist`, `isDoctor`, `isAdmin`) provide instant boolean flags for role-based conditional rendering and guards.

4. **Axios Interceptor Logic**:
   - Request interceptor retrieves `localStorage.getItem('token')` and appends `Authorization: Bearer <token>`.
   - Response interceptor inspects HTTP status: on 401 Unauthorized, if the user is not already on public auth pages (`/login`, `/register`, `/`), it clears local storage and executes redirection to `/login?session_expired=true`.

5. **Routing & Role Guard Architecture Logic**:
   - `ProtectedRoute` evaluates `loading`: if auth state is loading, render an accessible loading spinner to prevent flash-of-unauthenticated redirect.
   - If not authenticated, redirect to `/login` preserving target location in `location.state.from`.
   - If user role does not match `allowedRoles`, redirect user to their role's authorized landing path via `getRoleDashboardPath(user.role)`.
   - Public pages (`/`, `/login`, `/register`) use `MainLayout`.
   - Authenticated portals (`/patient/**`, `/reception/**`, `/doctor/**`) use `WorkspaceLayout` with role-specific sidebars.

---

## 3. Caveats

1. **No Application Source Code Modified**: In adherence to the explorer role constraints, all blueprints in this report are proposed specifications. No source code in `frontend/src` or configuration in `frontend/vite.config.js` was altered.
2. **Backend User Email Field**: `UserInfoResponse` does not currently include the user's email address. If email display is required in the profile banner, it is cached from the login input or registration form into local `auth_user` state.
3. **PayOS & SMTP Network Dependencies**: Step 1 OTP email dispatch uses real SMTP configured in backend `application.properties`. If SMTP credentials are dummy, OTP records can still be viewed in database table `registration_verifications` for development testing.
4. **Symlink Flags in Docker/Production**: `resolve: { preserveSymlinks: true }` is optimal for Windows NTFS OneDrive environments and is harmless in Linux Docker builds.

---

## 4. Conclusion & Complete Blueprints

Here is the exact, complete architectural blueprint for Milestone 2 implementers.

### 4.1 `frontend/vite.config.js` Blueprint
```javascript
// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Required to prevent EPERM realpath crashes on Windows / OneDrive NTFS reparse points
    preserveSymlinks: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### 4.2 `frontend/src/index.css` Blueprint
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  body {
    @apply bg-slate-50 text-slate-800 antialiased min-h-screen font-sans;
  }
}

/* Custom utility styles for healthcare UI */
.bg-hospital-gradient {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
}
```

### 4.3 `frontend/src/main.jsx` Blueprint
```jsx
// frontend/src/main.jsx
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### 4.4 Axios HTTP Client & API Services (`frontend/src/services/api.js` & `frontend/src/api/client.js`)

#### `frontend/src/services/api.js`
```javascript
// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach session token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ==================== AUTH API ====================
export const authApi = {
  login: async (credentials) => {
    // Normalizes username/email into `username` field expected by backend LoginRequest
    const payload = {
      username: (credentials.username || credentials.login || credentials.email || '').trim(),
      password: credentials.password,
    };
    const response = await api.post('/auth/login', payload);
    return response.data; // { token, user: { id, accountId, username, fullName, role, staffId, patientId } }
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data; // UserInfoResponse
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// ==================== PATIENT API ====================
export const patientApi = {
  checkUsername: async (username) => {
    const response = await api.get('/patients/check-username', { params: { username } });
    return response.data; // boolean
  },
  register: async (data) => {
    // data: { username, fullName, email, password, confirmPassword, agreeTerms: true }
    const response = await api.post('/patients/register', data);
    return response.data; // OtpView: { message, username, email, otpExpiresAt, resendAvailableAt }
  },
  sendOtp: async (email) => {
    const response = await api.post('/patients/send-otp', { email });
    return response.data;
  },
  verifyOtp: async (email, otp) => {
    const response = await api.post('/patients/verify-otp', { email, otp });
    return response.data; // VerifiedView: { message, username, email }
  },
  completeProfile: async (profileData) => {
    // profileData: { email, fullName, dateOfBirth, gender, phone, address, emergencyContactName, emergencyContactPhone }
    const response = await api.post('/patients/complete-profile', profileData);
    return response.data; // ApiResponse<{ patientId, patientCode, fullName }>
  },
  getMyAppointments: async () => {
    const response = await api.get('/patient/appointments');
    return response.data; // ApiResponse<List<AppointmentResponse>>
  },
};

// ==================== APPOINTMENT API ====================
export const appointmentApi = {
  getAvailableSlots: async (date, doctorId) => {
    const response = await api.get('/appointments/available-slots', {
      params: { date, doctorId },
    });
    return response.data;
  },
  getDetail: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  cancel: async (id, reason) => {
    const response = await api.post(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },
  reschedule: async (id, newSlotId, reason) => {
    const response = await api.put(`/appointments/${id}/reschedule`, { newSlotId, reason });
    return response.data;
  },
  checkout: async (data, amount = 280000) => {
    const response = await api.post('/public/appointments/checkout', data, { params: { amount } });
    return response.data;
  },
  getTicket: async (id) => {
    const response = await api.get(`/public/appointments/${id}/ticket`);
    return response.data;
  },
};

// ==================== RECEPTIONIST API ====================
export const receptionApi = {
  listAppointments: async (params = {}) => {
    // params: { date, doctorId, status, search, page, size }
    const response = await api.get('/reception/appointments', { params });
    return response.data; // PageView<AppointmentView>
  },
  getAppointmentDetail: async (id) => {
    const response = await api.get(`/reception/appointments/${id}`);
    return response.data;
  },
  getOptions: async (date) => {
    const response = await api.get('/reception/options', { params: { date } });
    return response.data;
  },
  createAppointment: async (data) => {
    const response = await api.post('/reception/appointments', data);
    return response.data;
  },
  checkIn: async (id) => {
    const response = await api.post(`/reception/appointments/${id}/check-in`);
    return response.data;
  },
  undoCheckIn: async (id) => {
    const response = await api.post(`/reception/appointments/${id}/undo-check-in`);
    return response.data;
  },
  cancelAppointment: async (id, reason) => {
    const response = await api.post(`/reception/appointments/${id}/cancel`, { reason });
    return response.data;
  },
  rescheduleAppointment: async (id, slotId) => {
    const response = await api.post(`/reception/appointments/${id}/reschedule`, { slotId });
    return response.data;
  },
  // Patient CRUD
  listPatients: async (params = {}) => {
    // params: { search, page, size }
    const response = await api.get('/reception/patients', { params });
    return response.data; // ApiResponse<PageView<PatientListItemView>>
  },
  getPatientDetail: async (id) => {
    const response = await api.get(`/reception/patients/${id}`);
    return response.data; // ApiResponse<PatientDetailView>
  },
  createPatient: async (patientData) => {
    const response = await api.post('/reception/patients', patientData);
    return response.data;
  },
  updatePatient: async (id, patientData) => {
    const response = await api.put(`/reception/patients/${id}`, patientData);
    return response.data;
  },
  updatePatientStatus: async (id, status) => {
    // status: 'ACTIVE' | 'INACTIVE'
    const response = await api.put(`/reception/patients/${id}/status`, { status });
    return response.data;
  },
};

// ==================== DOCTOR API ====================
export const doctorApi = {
  getAppointments: async (params = {}) => {
    // params: { doctorId, date }
    const response = await api.get('/doctor/appointments', { params });
    return response.data;
  },
};
```

#### `frontend/src/api/client.js`
```javascript
// frontend/src/api/client.js - Re-export alias for convenience
export { default } from '../services/api';
export * from '../services/api';
```

---

### 4.5 Auth Context Blueprint (`frontend/src/context/AuthContext.jsx`)
```jsx
// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const freshUser = await authApi.getMe();
          if (isMounted) {
            setUser(freshUser);
            localStorage.setItem('auth_user', JSON.stringify(freshUser));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err?.message || err);
          if (isMounted) {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    const sessionToken = data.token;
    const userData = data.user;

    localStorage.setItem('token', sessionToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));

    setToken(sessionToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // Role helper utilities
  const role = user?.role || null;
  const isPatient = role === 'PATIENT';
  const isReceptionist = role === 'RECEPTIONIST';
  const isDoctor = role === 'DOCTOR';
  const isAdmin = role === 'ADMIN';

  const hasRole = useCallback((requiredRole) => role === requiredRole, [role]);
  const hasAnyRole = useCallback((roles) => roles.includes(role), [role]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    role,
    isPatient,
    isReceptionist,
    isDoctor,
    isAdmin,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getRoleDashboardPath(role) {
  switch (role) {
    case 'PATIENT':
      return '/patient';
    case 'RECEPTIONIST':
      return '/reception';
    case 'DOCTOR':
      return '/doctor';
    case 'ADMIN':
      return '/reception';
    default:
      return '/';
  }
}
```

---

### 4.6 Protected Route Guard (`frontend/src/components/ProtectedRoute.jsx`)
```jsx
// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, getRoleDashboardPath } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Role not authorized for this specific section, redirect to their role home
    const fallbackPath = getRoleDashboardPath(user.role);
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
```

---

### 4.7 App Routing Tree (`frontend/src/App.jsx`)
```jsx
// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Role Views (Milestone 2/3)
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientBookingPage from './pages/patient/PatientBookingPage';
import ReceptionAppointmentsPage from './pages/reception/ReceptionAppointmentsPage';
import ReceptionPatientsPage from './pages/reception/ReceptionPatientsPage';
import ReceptionWalkInPage from './pages/reception/ReceptionWalkInPage';
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes with Landing Header & Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Patient Portal */}
          <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
            <Route element={<WorkspaceLayout role="PATIENT" />}>
              <Route path="/patient" element={<Navigate to="/patient/appointments" replace />} />
              <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
              <Route path="/patient/book" element={<PatientBookingPage />} />
            </Route>
          </Route>

          {/* Protected Receptionist Portal */}
          <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']} />}>
            <Route element={<WorkspaceLayout role="RECEPTIONIST" />}>
              <Route path="/reception" element={<Navigate to="/reception/appointments" replace />} />
              <Route path="/reception/appointments" element={<ReceptionAppointmentsPage />} />
              <Route path="/reception/patients" element={<ReceptionPatientsPage />} />
              <Route path="/reception/walk-in" element={<ReceptionWalkInPage />} />
            </Route>
          </Route>

          {/* Protected Doctor Portal */}
          <Route element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} />}>
            <Route element={<WorkspaceLayout role="DOCTOR" />}>
              <Route path="/doctor" element={<DoctorDashboardPage />} />
            </Route>
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

### 4.8 Layout Specifications

#### 1. `frontend/src/layouts/MainLayout.jsx`
- **Purpose**: Topbar and footer for public visitor flows (`/`, `/login`, `/register`).
- **Topbar**:
  - Left: Logo icon + "SWD Care" / "Bệnh viện Đa khoa".
  - Center: Navigation anchors ("Trang chủ", "Giới thiệu", "Chuyên khoa", "Đội ngũ bác sĩ").
  - Right:
    - If unauthenticated: "Đăng nhập" (secondary button) + "Đăng ký khám" (primary blue button).
    - If authenticated: Greeting ("Xin chào, [Full Name]"), role badge, button to go to Dashboard, "Đăng xuất" button.
- **Outlet**: Renders active child page.
- **Footer**:
  - Hospital credentials, hotline, address, emergency contact, operating hours.

#### 2. `frontend/src/layouts/WorkspaceLayout.jsx`
- **Purpose**: Portal layout for authenticated staff and patients (`/patient`, `/reception`, `/doctor`).
- **Header**:
  - Hospital logo, current active module breadcrumb / title.
  - Right: User avatar, Full Name, Role badge (`Bệnh nhân`, `Lễ tân`, `Bác sĩ`), and Logout button with confirm dialog or immediate action.
- **Left Sidebar**:
  - Dynamically switches items according to `role`:
    - **PATIENT**:
      1. `Đặt lịch hẹn` (`/patient/book`) — Calendar icon.
      2. `Quản lý lịch hẹn` (`/patient/appointments`) — Clock/List icon.
    - **RECEPTIONIST**:
      1. `Tạo hẹn khám walk-in` (`/reception/walk-in`) — UserPlus icon.
      2. `Quản lý lịch hẹn` (`/reception/appointments`) — CalendarCheck icon.
      3. `Quản lý bệnh nhân` (`/reception/patients`) — Users icon.
    - **DOCTOR**:
      1. `Bàn làm việc Bác sĩ` (`/doctor`) — Stethoscope/Dashboard icon.
- **Main Area**: Clean container (`p-6 bg-slate-50 min-h-[calc(100vh-64px)]`) with `<Outlet />`.

---

## 5. Verification Method

### 5.1 Verification Commands
The receiving agent and implementer can independently verify these findings using the following commands in powershell:

1. **Verify Vite Symlink Fix**:
   - Update `frontend/vite.config.js` to include `resolve: { preserveSymlinks: true }`.
   - Run `npm --prefix frontend run build`.
   - Result: Build proceeds past the Rollup HTML resolver without throwing `[vite:build-html] EPERM: operation not permitted, realpath`.

2. **Verify CSS & Linting**:
   - Create `frontend/src/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;`.
   - Run `npm --prefix frontend run lint`.
   - Result: ESLint reports 0 errors.

3. **Verify Dev Server & Proxy**:
   - Run `npm --prefix frontend run dev`.
   - Open browser or execute `curl -I http://localhost:5173`.
   - Test proxy endpoint: `curl -I http://localhost:5173/api/health` -> forwards to backend on port 8081.

### 5.2 Files to Inspect
- `frontend/package.json`: verify dependencies.
- `frontend/vite.config.js`: verify `preserveSymlinks: true` and proxy.
- `backend/swd/src/main/resources/application.properties`: verify `server.port=8081`.
- `backend/swd/src/main/java/com/example/swd/repository/UserAccountRepository.java`: lines 16–19 verifying dual login logic.
- `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java`: lines 51–100 verifying Bearer token authorization.
