## 2026-11-02T18:51:01Z
You are explorer_m2_1 (Frontend Architecture & State Management Explorer for Milestone 2).
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m2_1
Parent Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7

Context & Reference Documents:
1. ORIGINAL_REQUEST.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
2. Master PROJECT.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
3. Frontend directory: frontend/

Your Mission:
Investigate and design the core Frontend Architecture, Build Setup, Axios Client, and Auth State Management:
1. Inspect `frontend/package.json`, `frontend/vite.config.js`, `frontend/src/`:
   - Identify existing dependencies (React, Vite, Tailwind, Lucide React, Axios, React Router).
   - Verify Vite build configuration on Windows/OneDrive NTFS reparse points (`resolve: { preserveSymlinks: true }` in `vite.config.js`).
   - Check Tailwind CSS configuration and imports in `src/index.css` or `src/App.css`.
2. Design the Auth Context (`src/context/AuthContext.jsx`):
   - User state: `user` (id, username, email, fullName, role, staffId, patientId), `token` (Bearer session token), `isAuthenticated`, `loading`.
   - Token persistence in `localStorage` (`token`, `auth_user`).
   - `login(credentials)`: calls `POST /api/auth/login`, stores session, returns user data with role.
   - `logout()`: clears storage and auth state.
   - Role helpers: `isPatient`, `isReceptionist`, `isDoctor`, `isAdmin`.
3. Design the Axios HTTP client (`src/api/client.js` or `src/services/api.js`):
   - Base URL configuration (default `/api` with Vite proxy or `http://localhost:8080/api`).
   - Request interceptor: automatically attaches `Authorization: Bearer <token>` if present.
   - Response interceptor: handles 401 Unauthorized (clears session and redirects to `/login` when appropriate).
   - Common API methods: `authApi`, `patientApi`, `receptionApi`, `appointmentApi`.
4. Design the Router structure (`src/App.jsx` or `src/routes/`):
   - Public routes: `/` (Landing Page), `/login` (Login), `/register` (Register).
   - Protected route wrapper (`ProtectedRoute.jsx`) with role-based authorization check.
   - Destination routes for role dashboards: `/patient`, `/reception`, `/doctor`.
5. Write your complete blueprint and findings to:
   c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m2_1\handoff.md
6. Send completion message to Parent (2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7).
