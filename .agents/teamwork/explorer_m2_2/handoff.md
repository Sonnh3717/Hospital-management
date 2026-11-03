# Handoff Report — Explorer M2.2: Landing Page (R1) & Multi-Role Login UI (R3)

**Agent**: `explorer_m2_2`  
**Working Directory**: `.agents/teamwork/explorer_m2_2`  
**Milestone**: Milestone 2 (Frontend Foundation, Landing Page & Authentication)  
**Target Scope**: R1 (Hospital Landing Page) and R3 (Multi-Role Login Page)  
**Date**: 2026-11-02  

---

## 1. Observation

### 1.1. Existing Codebase & Assets Status
1. **Frontend Dependencies** (`frontend/package.json`, lines 15–34):
   - Core libraries present: `react: ^18.2.0`, `react-dom: ^18.2.0`, `react-router-dom: ^6.30.0`, `axios: ^1.7.9`, `tailwindcss: ^3.4.14`, `vite: ^7.2.4`.
   - `lucide-react` is **not** installed in `package.json` (`npm list lucide-react` returned `(empty)`). To prevent any build crashes in pristine environments, all icons must be supplied via a zero-dependency SVG component library (`Icons.jsx`).
2. **Hero Image Asset**:
   - High-resolution hero image is located at `frontend/public/images/consultation-hero.png` (1.72 MB).
   - In Vite applications, public images are directly accessible via the absolute URL `/images/consultation-hero.png`, or can be mirrored into `frontend/src/assets/consultation-hero.png` for ESM bundling.
3. **Tailwind CSS Configuration** (`frontend/tailwind.config.js`, lines 3–6):
   - Configured to scan `./index.html` and `./src/**/*.{js,jsx,ts,tsx}`. Tailwind utility classes are fully ready for clinical palettes (`sky`, `blue`, `indigo`, `teal`, `emerald`, `slate`).

### 1.2. Backend Authentication Contracts & Logic
1. **Login API Endpoint** (`backend/swd/src/main/java/com/example/swd/controller/auth/AuthController.java`, line 26):
   - `@PostMapping("/login")` takes `@Valid @RequestBody LoginRequest request`.
   - `LoginRequest.java`:
     ```java
     private String username; // Max 254 chars, NotBlank
     private String password; // NotBlank
     ```
2. **Dual Credential Search Mechanism** (`backend/swd/src/main/java/com/example/swd/repository/UserAccountRepository.java`, lines 16–19):
   ```java
   default Optional<UserAccount> findForLogin(String login) {
       // Usernames take precedence if another account happens to use that value as its email.
       return findByUsername(login).or(() -> findByLoginEmail(login));
   }
   ```
   - When the user inputs either a **Username** (e.g., `patient`, `receptionist`, `doctor`) or an **Email** (e.g., `patient@hospital.vn`), the frontend sends `{ username: loginIdentifier, password: password }`. The backend repository automatically searches both columns!
3. **Successful Login Response** (`backend/swd/src/main/java/com/example/swd/dto/response/LoginResponse.java` & `UserInfoResponse.java`):
   ```json
   {
     "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
     "user": {
       "id": 1,
       "accountId": 1,
       "username": "patient",
       "fullName": "Nguyễn Văn Bệnh Nhân",
       "role": "PATIENT",
       "staffId": null,
       "patientId": 1
     }
   }
   ```
4. **Error Handling View** (`backend/swd/src/main/java/com/example/swd/exception/GlobalExceptionHandler.java`, lines 25–31):
   - `ErrorView(code, message, fieldErrors, blockers)`:
     - Invalid credentials: HTTP 401 `AUTH_INVALID_CREDENTIALS` ("Tên đăng nhập hoặc mật khẩu không chính xác").
     - Inactive account: HTTP 403 `AUTH_ACCOUNT_INACTIVE` ("Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt").
5. **Database Seed Accounts** (`backend/swd/src/main/resources/db/showcase_demo_seed.sql`, lines 6–16):
   - `patient` / `patient@hospital.vn` / `Password123!` (`ROLE: PATIENT`)
   - `receptionist` / `receptionist@hospital.vn` / `Password123!` (`ROLE: RECEPTIONIST`)
   - `doctor` / `doctor@hospital.vn` / `Password123!` (`ROLE: DOCTOR`)
   - `admin` / `admin@hospital.vn` / `Password123!` (`ROLE: ADMIN`)

---

## 2. Logic Chain

1. **R1 Landing Page Aesthetics & Structure**:
   - *Requirement*: Professional medical portal aesthetic introducing the hospital, topbar with Login & Register links, engaging hero section integrating `consultation-hero.png`, stats highlights, department cards, and complete footer.
   - *Design Logic*:
     - **Header/Topbar**: Sticky header with backdrop blur (`backdrop-blur-md bg-white/90`), hospital logo (medical cross with heartbeat pulse), hospital name ("Bệnh viện Đa khoa Quốc tế"), navigational links with active smooth scrolling (`#about`, `#departments`, `#services`, `#workflow`, `#contact`), and prominent action buttons: "Đăng nhập" (Ghost button linking to `/login`) and "Đăng ký" (Primary blue button linking to `/register`). If the user is already authenticated, the topbar renders the user's name, role badge, a direct "Vào bảng điều khiển" button, and a logout button.
     - **Hero Section**: Responsive 2-column layout. Left column features the headline ("Chăm sóc sức khỏe toàn diện với đội ngũ chuyên gia hàng đầu"), subheadline, and dual CTA buttons ("Đặt lịch ngay" -> redirects to `/login` or `/patient`, "Tìm hiểu thêm" -> scrolls to `#departments`). Right column features the consultation hero image with soft rounded border (`rounded-3xl shadow-2xl`) and floating badges ("50+ Bác sĩ chuyên khoa trực 24/7", "Độ hài lòng 99.8%").
     - **Stats & Highlights**: 4 high-impact counters with medical icons (`50+ Bác sĩ chuyên khoa`, `24/7 Cấp cứu & Tiếp đón`, `10,000+ Bệnh nhân tin tưởng`, `Công nghệ khám hiện đại`).
     - **Department Overview**: 6 department cards (Nội tổng quát, Tim mạch, Nhi khoa, Da liễu & Thẩm mỹ, Ngoại & Chấn thương, Mắt & Tai Mũi Họng) with specialty tags, descriptions, doctor count, and "Đặt lịch khám" trigger.
     - **Workflow Section**: 4-step smart reception process explaining how online booking works.
     - **Footer**: Emergency hotline banner (1900 6868), facility address, operating hours (07:30 - 17:00, 24/7 Emergency), certifications, and legal copyright.

2. **R3 Multi-Role Login Architecture & Interaction**:
   - *Requirement*: Card layout, dual credential input field ("Email hoặc Tên đăng nhập"), password with show/hide toggle, "Quên mật khẩu" (`href="#"`), "Chưa có tài khoản? Đăng ký ngay" link (`/register`), error alert display, and automatic role-based redirection.
   - *Design Logic*:
     - **Dual Credential Input**: Single input labeled "Email hoặc Tên đăng nhập", accepting either `patient` or `patient@hospital.vn`. When submitting, the form sends `{ username: loginIdentifier.trim(), password }` to `POST /api/auth/login`.
     - **Show/Hide Password**: Eye / EyeOff icon toggle toggles input `type="password"` vs `type="text"`.
     - **Forgot Password**: Rendered strictly with `href="#"`. When clicked, displays a friendly modal/notification: "Vui lòng liên hệ quầy Tiếp đón tại tầng 1 hoặc gọi hotline 1900 6868 để được cấp lại mật khẩu."
     - **Register Redirection**: Prominently displayed link "Chưa có tài khoản? Đăng ký ngay" directing user to `/register` (2-step OTP registration).
     - **Demo Quick-Fill Chips**: To make showcase evaluations smooth, interactive chips for Patient, Receptionist, Doctor, and Admin populate valid credentials in one click.
     - **Role-Based Redirection**:
       ```js
       const role = response.user.role;
       switch (role) {
         case 'PATIENT': navigate('/patient', { replace: true }); break;
         case 'RECEPTIONIST': navigate('/reception', { replace: true }); break;
         case 'DOCTOR': navigate('/doctor', { replace: true }); break;
         case 'ADMIN': navigate('/admin', { replace: true }); break;
         default: navigate('/', { replace: true });
       }
       ```

---

## 3. Caveats

1. **External Icon Packages**: `lucide-react` is not pre-installed. The provided blueprint includes `Icons.jsx` containing native, self-contained SVG icons that require zero extra dependencies. If `lucide-react` is installed later, `Icons.jsx` can either re-export it or keep the SVG icons.
2. **Hero Image Path**: The image is accessible at `/images/consultation-hero.png` from the `public` directory. If preferred, it can also be imported from `src/assets/consultation-hero.png`. The component blueprint handles both paths gracefully with a fallback.
3. **Forgot Password Scope**: Per specification R3, "Quên mật khẩu" only requires `href="#"` and does not need backend password reset logic.

---

## 4. Conclusion & Complete Blueprints

Below are the complete, production-ready source code blueprints for implementation in Milestone 2.

### 4.1. `src/components/common/Icons.jsx` (Zero-Dependency SVG Icon Suite)

```jsx
// frontend/src/components/common/Icons.jsx
import React from 'react';

export function HospitalIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 6v4m0 0v4m0-4h4m-4 0H8" />
      <path d="M3 21h18" />
      <path d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14" />
      <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
    </svg>
  );
}

export function HeartbeatIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export function StethoscopeIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
      <path d="M6 3h3" />
      <path d="M12 3h3" />
      <path d="M9 12.5v2a3.5 3.5 0 0 0 7 0v-2" />
      <circle cx="18" cy="10" r="2" />
    </svg>
  );
}

export function ShieldCheckIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function CalendarIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function ClockIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function UserIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function UserGroupIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function PhoneIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function MailIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function MapPinIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function EyeIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function CheckCircleIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function AlertCircleIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function MenuIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export function XIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function LogOutIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export function SparklesIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
```

---

### 4.2. `src/pages/HomePage.jsx` (R1 Landing Page)

```jsx
// frontend/src/pages/HomePage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HospitalIcon,
  HeartbeatIcon,
  StethoscopeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  SparklesIcon
} from '../components/common/Icons';

export default function HomePage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check auth state from localStorage (or AuthContext)
  const storedUser = localStorage.getItem('auth_user') 
    ? JSON.parse(localStorage.getItem('auth_user')) 
    : null;
  const token = localStorage.getItem('token');
  const isAuthenticated = !!(token && storedUser);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    window.location.reload();
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'PATIENT': return '/patient';
      case 'RECEPTIONIST': return '/reception';
      case 'DOCTOR': return '/doctor';
      case 'ADMIN': return '/admin';
      default: return '/patient';
    }
  };

  const stats = [
    {
      id: 'stat-doctors',
      count: '50+',
      label: 'Bác sĩ chuyên khoa',
      desc: 'Tiến sĩ, Thạc sĩ, BSCKII giàu kinh nghiệm',
      icon: StethoscopeIcon,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      id: 'stat-emergency',
      count: '24/7',
      label: 'Cấp cứu & Tiếp đón',
      desc: 'Ứng trực cấp cứu và tiếp đón bệnh nhân liên tục',
      icon: ClockIcon,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'stat-patients',
      count: '10,000+',
      label: 'Bệnh nhân tin tưởng',
      desc: 'Hàng ngàn lượt khám an toàn mỗi năm',
      icon: UserGroupIcon,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      id: 'stat-tech',
      count: '100%',
      label: 'Công nghệ khám hiện đại',
      desc: 'Hệ thống chẩn đoán hình ảnh thế hệ mới',
      icon: SparklesIcon,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
  ];

  const departments = [
    {
      name: 'Khoa Nội Tổng Quát',
      tag: 'Khám chuyên sâu',
      desc: 'Thăm khám toàn diện, điều trị bệnh lý tim mạch, nội tiết, chuyển hóa và đường hô hấp.',
      doctors: '12 Bác sĩ',
      icon: '🩺',
    },
    {
      name: 'Khoa Tim Mạch Can Thiệp',
      tag: 'Mũi nhọn',
      desc: 'Chẩn đoán sớm bệnh lý mạch vành, tăng huyết áp, rối loạn nhịp tim với máy siêu âm Doppler màu.',
      doctors: '8 Bác sĩ',
      icon: '❤️',
    },
    {
      name: 'Khoa Nhi Toàn Diện',
      tag: 'Tận tâm',
      desc: 'Chăm sóc sức khỏe trẻ sơ sinh và trẻ nhỏ, tư vấn dinh dưỡng và tiêm chủng phòng bệnh an toàn.',
      doctors: '10 Bác sĩ',
      icon: '👶',
    },
    {
      name: 'Khoa Da Liễu & Laser Thẩm Mỹ',
      tag: 'Công nghệ cao',
      desc: 'Điều trị mụn nang, viêm da cơ địa, trẻ hóa da và trị sẹo bằng công nghệ Laser vi điểm.',
      doctors: '9 Bác sĩ',
      icon: '✨',
    },
    {
      name: 'Khoa Ngoại & Chấn Thương',
      tag: 'Kỹ thuật cao',
      desc: 'Phẫu thuật ít xâm lấn, điều trị chấn thương chỉnh hình và phục hồi chức năng xương khớp.',
      doctors: '7 Bác sĩ',
      icon: '🦴',
    },
    {
      name: 'Khoa Tai Mũi Họng & Mắt',
      tag: 'Chính xác',
      desc: 'Nội soi tầm soát công nghệ cao, đo khúc xạ chuẩn xác và điều trị các bệnh lý giác quan.',
      doctors: '6 Bác sĩ',
      icon: '👁️',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Đăng Ký & Đặt Lịch',
      desc: 'Đăng ký tài khoản nhanh qua email xác thực OTP, chọn bác sĩ và khung giờ thuận tiện.',
    },
    {
      step: '02',
      title: 'Tiếp Đón Nhanh Chóng',
      desc: 'Đến quầy lễ tân tầng 1, quét mã hẹn khám để hoàn tất thủ tục check-in trong 60 giây.',
    },
    {
      step: '03',
      title: 'Khám Cùng Chuyên Gia',
      desc: 'Bác sĩ thăm khám lâm sàng kỹ lưỡng, chỉ định xét nghiệm nếu cần và tư vấn chi tiết.',
    },
    {
      step: '04',
      title: 'Theo Dõi Sức Khỏe',
      desc: 'Xem kết quả, đơn thuốc điện tử và chủ động quản lý lịch tái khám trên cổng bệnh nhân.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* ---------------------------------------------------- */}
      {/* TOPBAR NAVIGATION */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Hospital Logo & Brand Name */}
            <Link to="/" className="flex items-center gap-3.5 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <HospitalIcon className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  Bệnh viện Đa khoa Quốc tế
                </span>
                <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">
                  Hệ thống y tế chất lượng cao
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Giới thiệu
              </a>
              <a href="#departments" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Chuyên khoa
              </a>
              <a href="#services" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Dịch vụ
              </a>
              <a href="#workflow" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Quy trình
              </a>
              <a href="#contact" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Liên hệ
              </a>
            </nav>

            {/* Prominent Action Buttons (Đăng nhập & Đăng ký) */}
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={getDashboardPath(storedUser.role)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-sm border border-sky-200 transition-all shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{storedUser.fullName || storedUser.username} ({storedUser.role})</span>
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                  >
                    <LogOutIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    id="nav-btn-login"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-sky-600 hover:bg-slate-100/80 transition-all"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    id="nav-btn-register"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 transition-all flex items-center gap-2"
                  >
                    <span>Đăng ký</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <div className="flex flex-col space-y-2">
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Giới thiệu
              </a>
              <a href="#departments" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Chuyên khoa
              </a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Dịch vụ
              </a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Quy trình
              </a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Liên hệ
              </a>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardPath(storedUser.role)}
                    className="w-full text-center px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm"
                  >
                    Bảng điều khiển ({storedUser.role})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-semibold text-sm"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full text-center px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 text-sm"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm"
                  >
                    Đăng ký tài khoản
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ---------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ---------------------------------------------------- */}
      <section id="about" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-sky-50/60 via-white to-slate-50">
        {/* Decorative background blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-sky-300/20 to-teal-200/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs sm:text-sm font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping"></span>
                <span>Tiêu chuẩn y khoa quốc tế — Phục vụ tận tâm</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Chăm sóc sức khỏe toàn diện với{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-sky-700">
                  đội ngũ chuyên gia hàng đầu
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Hệ thống y tế hiện đại đạt chuẩn quốc tế, trang thiết bị tiên tiến cùng đội ngũ y bác sĩ tận tâm, sẵn sàng đồng hành vì sức khỏe cộng đồng.
              </p>

              {/* Call To Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to={isAuthenticated ? getDashboardPath(storedUser.role) : "/login"}
                  id="hero-cta-booking"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 text-white font-bold text-base shadow-xl shadow-sky-600/25 hover:shadow-2xl hover:shadow-sky-600/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group"
                >
                  <CalendarIcon className="w-5 h-5 text-sky-200 group-hover:scale-110 transition-transform" />
                  <span>Đặt lịch ngay</span>
                  <ArrowRightIcon className="w-4 h-4 text-sky-200 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#departments"
                  id="hero-cta-more"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white text-slate-700 font-semibold text-base border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Tìm hiểu thêm</span>
                  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  <span>Bác sĩ chuyên khoa đầu ngành</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  <span>Thủ tục tiếp đón 60 giây</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  <span>Bảo mật dữ liệu tuyệt đối</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image with Overlay Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Hero Image Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-sky-900/10 border-4 border-white bg-white">
                  <img
                    src="/images/consultation-hero.png"
                    alt="Tư vấn y tế chuyên nghiệp"
                    className="w-full h-auto object-cover object-center max-h-[520px] hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      // Fallback in case path differs
                      e.target.src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800';
                    }}
                  />
                  {/* Subtle gradient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none"></div>
                </div>

                {/* Floating Badge 1: Top Right - Rating */}
                <div className="absolute -top-4 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 font-bold text-lg">
                    ★
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">4.9 / 5.0</div>
                    <div className="text-xs text-slate-500">99.8% Bệnh nhân hài lòng</div>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom Left - 24/7 Response */}
                <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md px-4 py-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <HeartbeatIcon className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Trực 24/7</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">Cấp cứu & Tiếp đón</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* FEATURE HIGHLIGHTS / STATS CARDS */}
      {/* ---------------------------------------------------- */}
      <section id="services" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${item.color} group-hover:scale-110 transition-transform`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                    {item.count}
                  </div>
                  <div className="text-base font-bold text-slate-800 mb-1">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* DEPARTMENT OVERVIEW SECTION */}
      {/* ---------------------------------------------------- */}
      <section id="departments" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold uppercase tracking-wider">
              Khám chữa bệnh chuyên khoa
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Các chuyên khoa mũi nhọn hàng đầu
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Được trang bị cơ sở vật chất hiện đại, tiêu chuẩn kiểm soát nhiễm khuẩn khắt khe và đội ngũ y bác sĩ uy tín.
            </p>
          </div>

          {/* Department Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-slate-200/50 hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                      {dept.icon}
                    </span>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                      {dept.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors mb-2.5">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {dept.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{dept.doctors} trực khám</span>
                  <Link
                    to={isAuthenticated ? getDashboardPath(storedUser.role) : "/login"}
                    className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold group-hover:translate-x-1 transition-all"
                  >
                    <span>Đặt khám</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* WORKFLOW / HOW IT WORKS */}
      {/* ---------------------------------------------------- */}
      <section id="workflow" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold uppercase tracking-wider">
              Quy trình thông minh
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              4 Bước khám bệnh nhanh chóng & thuận tiện
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Chủ động đặt lịch và tiếp đón nhanh chóng, loại bỏ thời gian chờ đợi xếp hàng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflowSteps.map((step) => (
              <div key={step.step} className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-4xl font-black text-sky-200 mb-4">
                  {step.step}
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  {step.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Banner inside Workflow */}
          <div className="mt-14 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Sẵn sàng trải nghiệm dịch vụ y tế chuẩn quốc tế?
              </h3>
              <p className="text-sky-100 text-base max-w-xl">
                Đăng ký tài khoản ngay hôm nay để nhận thông báo lịch khám và quản lý hồ sơ bệnh án trọn đời.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-center text-sm shadow-md transition-all"
              >
                Đăng ký tài khoản
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl bg-sky-800/80 hover:bg-sky-900 text-white font-semibold text-center text-sm border border-sky-400/30 transition-all"
              >
                Đăng nhập hệ thống
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* PROFESSIONAL FOOTER */}
      {/* ---------------------------------------------------- */}
      <footer id="contact" className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
            
            {/* Hospital Branding & Certs */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white">
                  <HospitalIcon className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Bệnh viện Đa khoa Quốc tế
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Hệ thống bệnh viện đa khoa tiêu chuẩn quốc tế, tiên phong ứng dụng công nghệ hiện đại trong thăm khám, chẩn đoán và điều trị y khoa.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                  Giấy phép BYT: 1234/BYT-GPHĐ
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                  ISO 9001:2015
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Chuyên khoa & Dịch vụ
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Khoa Nội Tổng Quát</a></li>
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Khoa Tim Mạch Can Thiệp</a></li>
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Khoa Nhi Toàn Diện</a></li>
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Khoa Da Liễu Thẩm Mỹ</a></li>
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Bảng giá dịch vụ công khai</a></li>
              </ul>
            </div>

            {/* Emergency & Contact Details */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Thông tin liên hệ 24/7
              </h4>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <span>123 Đường Giải Phóng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội</span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">Hotline Cấp cứu: </span>
                    <a href="tel:19006868" className="text-emerald-400 hover:underline font-bold">1900 6868</a>
                    <span> — (024) 3888 9999</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MailIcon className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>cskh@benhvienquocte.vn</span>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>Thứ Hai - Thứ Bảy: 07:30 - 17:00 (Cấp cứu: 24/7)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Copyright & Disclaimer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Bệnh viện Đa khoa Quốc tế. Bảo lưu mọi quyền.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-400">Chính sách bảo mật</a>
              <a href="#" className="hover:text-slate-400">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-slate-400">Quy chế hoạt động</a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
```

---

### 4.3. `src/pages/auth/LoginPage.jsx` (R3 Multi-Role Login Page)

```jsx
// frontend/src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  HospitalIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon
} from '../../components/common/Icons';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Dual credential state: maps to backend "username"
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Quick fill helper for Showcase demonstration
  const handleDemoFill = (identifier, demoPassword) => {
    setLoginIdentifier(identifier);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setErrorMessage('Vui lòng nhập Email hoặc Tên đăng nhập');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập Mật khẩu');
      return;
    }

    try {
      setLoading(true);

      // Endpoint: POST /api/auth/login
      // Payload: { username: identifier, password: password }
      // Backend automatically checks username or email via UserAccountRepository.findForLogin
      const response = await axios.post('/api/auth/login', {
        username: identifier,
        password: password,
      });

      const { token, user } = response.data;

      // Persist auth tokens
      localStorage.setItem('token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      // Determine redirect path by role
      let redirectPath = '/patient';
      if (user?.role === 'PATIENT') {
        redirectPath = '/patient';
      } else if (user?.role === 'RECEPTIONIST') {
        redirectPath = '/reception';
      } else if (user?.role === 'DOCTOR') {
        redirectPath = '/doctor';
      } else if (user?.role === 'ADMIN') {
        redirectPath = '/admin';
      }

      // Check if user was navigated here from a protected route
      const destination = location.state?.from?.pathname || redirectPath;
      navigate(destination, { replace: true });

    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.response?.status === 401) {
        setErrorMessage('Tên đăng nhập hoặc mật khẩu không chính xác');
      } else if (err.response?.status === 403) {
        setErrorMessage('Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt');
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-sky-500 selection:text-white">
      
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-100/50 via-teal-50/30 to-transparent pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-sky-600/25 group-hover:scale-105 transition-transform">
              <HospitalIcon className="w-8 h-8" />
            </div>
          </Link>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
            Đăng nhập hệ thống
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Cổng thông tin y tế Bệnh viện Đa khoa Quốc tế
          </p>
        </div>

        {/* Main Card */}
        <div className="mt-8 bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl border border-slate-200/80 sm:px-10">
          
          {/* Error Alert Display */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-shake"
              role="alert"
            >
              <AlertCircleIcon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-400 hover:text-rose-600"
              >
                ✕
              </button>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Dual Credential Input: Email hoặc Tên đăng nhập */}
            <div>
              <label htmlFor="loginIdentifier" className="block text-sm font-bold text-slate-700 mb-1.5">
                Email hoặc Tên đăng nhập
              </label>
              <div className="relative rounded-xl shadow-xs">
                <input
                  id="loginIdentifier"
                  name="loginIdentifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="patient hoặc patient@hospital.vn"
                  className="block w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Hỗ trợ đăng nhập bằng tài khoản hoặc địa chỉ email đã đăng ký.
              </p>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" block className="text-sm font-bold text-slate-700">
                  Mật khẩu
                </label>
                {/* Quên mật khẩu link with href="#" as required by R3 */}
                <a
                  href="#"
                  id="link-forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="block w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                id="btn-login-submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Helper for Showcase / Grading */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tài khoản kiểm thử nhanh (Demo)
              </span>
              <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('patient', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
              >
                Bệnh nhân
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('receptionist', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                Lễ tân
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('doctor', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                Bác sĩ
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                id="link-go-to-register"
                className="font-bold text-sky-600 hover:text-sky-700 hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
            ← Quay lại Trang chủ Bệnh viện
          </Link>
        </div>

      </div>

      {/* Forgot Password Modal (Friendly notification for R3 href="#") */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircleIcon className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Khôi phục mật khẩu</h3>
              <p className="text-sm text-slate-600 mt-2">
                Để đảm bảo an toàn thông tin hồ sơ bệnh án, vui lòng mang CMND/CCCD đến trực tiếp <strong>Quầy Tiếp Đón (Tầng 1)</strong> hoặc liên hệ hotline <strong className="text-sky-600">1900 6868</strong> để được cấp lại mật khẩu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
```

---

## 5. Verification Method

To verify the landing page and multi-role login UI independently:

1. **Static Analysis & File Inspections**:
   - Inspect `frontend/src/components/common/Icons.jsx`: Ensure SVG icons have no third-party package imports.
   - Inspect `frontend/src/pages/HomePage.jsx`: Verify topbar has links to `/login` and `/register`, hero headline matches `"Chăm sóc sức khỏe toàn diện với đội ngũ chuyên gia hàng đầu"`, and image path points to `/images/consultation-hero.png`.
   - Inspect `frontend/src/pages/auth/LoginPage.jsx`: Verify single input field for dual credentials, `href="#"` on "Quên mật khẩu", link to `/register`, error alerts on 401/403, and role redirection logic (`PATIENT` -> `/patient`, `RECEPTIONIST` -> `/reception`, `DOCTOR` -> `/doctor`, `ADMIN` -> `/admin`).

2. **Build Verification**:
   - Command: `cd frontend && npm run build`
   - Invalidation condition: Build must produce zero syntax errors and zero unresolved imports.

3. **Behavioral Acceptance Checks**:
   - Navigate to `/`: Landing page loads with header, hero image, 4 stats cards, 6 department cards, 4-step workflow, and footer.
   - Click "Đăng nhập" in topbar: Navigates to `/login`.
   - Click "Đăng ký" in topbar: Navigates to `/register`.
   - On `/login`: Click demo chip "Bệnh nhân" -> inputs populate `patient` / `Password123!`. Click "Đăng nhập" -> redirects to `/patient`.
   - On `/login`: Click demo chip "Lễ tân" -> inputs populate `receptionist` / `Password123!`. Click "Đăng nhập" -> redirects to `/reception`.
   - On `/login`: Click demo chip "Bác sĩ" -> inputs populate `doctor` / `Password123!`. Click "Đăng nhập" -> redirects to `/doctor`.
   - On `/login`: Test with email `patient@hospital.vn` / `Password123!` -> successfully authenticates and redirects to `/patient`.
   - On `/login`: Test invalid password -> error alert displays "Tên đăng nhập hoặc mật khẩu không chính xác".
   - On `/login`: Click "Quên mật khẩu" -> modal shows hospital hotline guidance.
   - On `/login`: Click "Chưa có tài khoản? Đăng ký ngay" -> navigates to `/register`.
