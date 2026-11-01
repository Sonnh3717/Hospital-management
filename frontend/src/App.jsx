import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProtectedWorkspace from './components/auth/ProtectedWorkspace.jsx';
import ReceptionAppointmentsPage from './pages/reception/ReceptionAppointmentsPage.jsx';
import AssignedPatientsPage from './pages/doctor/AssignedPatientsPage.jsx';
import ClinicalEncounterPage from './pages/doctor/ClinicalEncounterPage.jsx';
import ServiceQueuePage from './pages/medicalservice/ServiceQueuePage.jsx';
import ServiceRequestPage from './pages/medicalservice/ServiceRequestPage.jsx';
import RoleDashboard from './pages/common/RoleDashboard.jsx';
import BookingWizardPage from './pages/patient/BookingWizardPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="booking" element={<BookingWizardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Quản trị viên */}
      <Route element={<ProtectedWorkspace role="ADMIN" />}>
        <Route
          path="admin/dashboard"
          element={
            <RoleDashboard
              title="Bảng Điều Khiển Quản Trị Hệ Thống"
              description="Quản lý tài khoản, dịch vụ khám chữa bệnh, và cấu hình quy định hệ thống"
              roleCode="ADMIN"
              cards={[
                { title: 'Quản Lý Người Dùng & Phân Quyền', description: 'Cấp phát, khóa tài khoản và gán vai trò nhân sự trong viện.', href: '/admin/users', icon: 'user' },
                { title: 'Danh Mục Dịch Vụ Y Tế', description: 'Thiết lập danh mục kỹ thuật, giá dịch vụ khám da liễu niêm yết.', href: '/admin/services', icon: 'cross' },
                { title: 'Quy Định Đặt Lịch & Ca Khám', description: 'Cấu hình thời gian hủy hẹn (24h), đổi lịch, công suất tiếp nhận.', href: '/admin/rules', icon: 'shield' },
              ]}
            />
          }
        />
        <Route path="admin/users" element={<RoleDashboard title="Quản Lý Tài Khoản" description="Danh sách và tạo mới tài khoản nhân viên / bệnh nhân." roleCode="ADMIN" />} />
        <Route path="admin/services" element={<RoleDashboard title="Danh Mục Dịch Vụ Y Tế" description="Quản lý danh sách dịch vụ khám và cận lâm sàng." roleCode="ADMIN" />} />
        <Route path="admin/rules" element={<RoleDashboard title="Quy Định Đặt Lịch" description="Thiết lập các mốc thời gian và chính sách phòng khám." roleCode="ADMIN" />} />
      </Route>

      {/* Quản lý bệnh viện */}
      <Route element={<ProtectedWorkspace role="MANAGER" />}>
        <Route
          path="manager/dashboard"
          element={
            <RoleDashboard
              title="Bảng Điều Khiển Quản Lý Bệnh Viện"
              description="Theo dõi hoạt động tiếp đón, phân công lịch trực và thống kê hiệu suất"
              roleCode="MANAGER"
              cards={[
                { title: 'Phân Ca & Lịch Làm Việc Tuần', description: 'Sắp xếp ca trực cho bác sĩ, điều dưỡng và nhân viên tiếp đón.', href: '/manager/schedules', icon: 'calendar' },
                { title: 'Duyệt Đổi Ca Trực', description: 'Xem xét và phê duyệt các yêu cầu xin nghỉ hoặc đổi ca của nhân viên.', href: '/manager/schedule-requests', icon: 'clock' },
                { title: 'Báo Cáo Tiếp Đón & No-Show', description: 'Thống kê tỷ lệ bệnh nhân vắng mặt, hoàn thành khám và sử dụng phòng.', href: '/manager/reports', icon: 'info' },
              ]}
            />
          }
        />
        <Route path="manager/schedules" element={<RoleDashboard title="Lịch Trực Bệnh Viện" description="Phân ca làm việc cho nhân viên y tế." roleCode="MANAGER" />} />
        <Route path="manager/schedule-requests" element={<RoleDashboard title="Yêu Cầu Đổi Ca" description="Danh sách yêu cầu điều chỉnh lịch làm việc." roleCode="MANAGER" />} />
        <Route path="manager/reports" element={<RoleDashboard title="Báo Cáo & Thống Kê" description="Báo cáo lượt khám, doanh thu và no-show." roleCode="MANAGER" />} />
      </Route>

      {/* Tiếp tân / Lễ tân */}
      <Route element={<ProtectedWorkspace role="RECEPTIONIST" />}>
        <Route path="reception/appointments" element={<ReceptionAppointmentsPage />} />
        <Route path="reception/walk-in" element={<RoleDashboard title="Tiếp Nhận Khám Vãng Lai (Walk-in)" description="Tạo lịch khám và cấp số trực tiếp cho người bệnh đến quầy." roleCode="RECEPTIONIST" />} />
        <Route path="reception/patients" element={<RoleDashboard title="Hồ Sơ Người Bệnh" description="Tra cứu, cập nhật thông tin hành chính của bệnh nhân." roleCode="RECEPTIONIST" />} />
      </Route>

      {/* Bác sĩ khám lâm sàng */}
      <Route element={<ProtectedWorkspace role="DOCTOR" />}>
        <Route path="doctor/patients" element={<AssignedPatientsPage />} />
        <Route path="doctor/encounters/:encounterId" element={<ClinicalEncounterPage />} />
        <Route path="doctor/schedule" element={<RoleDashboard title="Lịch Khám Cá Nhân" description="Xem ca làm việc và danh sách hẹn khám trong tuần." roleCode="DOCTOR" />} />
        <Route path="doctor/history" element={<RoleDashboard title="Lịch Sử Khám Bệnh" description="Xem lại các ca khám và bệnh án đã hoàn thành." roleCode="DOCTOR" />} />
      </Route>

      {/* Nhân viên dịch vụ y tế */}
      <Route element={<ProtectedWorkspace role="MEDICAL_SERVICE_STAFF" />}>
        <Route path="services/queue" element={<ServiceQueuePage />} />
        <Route path="services/requests/:requestId" element={<ServiceRequestPage />} />
        <Route path="services/completed" element={<RoleDashboard title="Dịch Vụ Đã Trả Kết Quả" description="Lịch sử các mẫu xét nghiệm, soi da đã hoàn tất." roleCode="MEDICAL_SERVICE_STAFF" />} />
      </Route>

      {/* Người bệnh */}
      <Route element={<ProtectedWorkspace role="PATIENT" />}>
        <Route
          path="patient/dashboard"
          element={
            <RoleDashboard
              title="Cổng Thông Tin Người Bệnh"
              description="Theo dõi lịch hẹn khám, kết quả chẩn đoán và quản lý hồ sơ sức khỏe"
              roleCode="PATIENT"
              cards={[
                { title: 'Lịch Hẹn Khám Da Liễu', description: 'Xem chi tiết các lịch hẹn đã đặt, đổi lịch hoặc hủy hẹn trước 24h.', href: '/patient/appointments', icon: 'calendar' },
                { title: 'Đăng Ký Khám Mới', description: 'Lựa chọn bác sĩ chuyên khoa da liễu và khung giờ khám thuận tiện.', href: '/booking', icon: 'cross' },
                { title: 'Kết Quả & Bệnh Án', description: 'Xem hồ sơ khám bệnh, đơn thuốc và kết quả soi da/xét nghiệm.', href: '/patient/medical-history', icon: 'stethoscope' },
              ]}
            />
          }
        />
        <Route path="patient/appointments" element={<RoleDashboard title="Lịch Hẹn Khám Của Tôi" description="Danh sách lịch hẹn sắp tới và lịch sử khám." roleCode="PATIENT" />} />
        <Route path="patient/booking" element={<BookingWizardPage />} />
        <Route path="patient/medical-history" element={<RoleDashboard title="Lịch Sử Khám Bệnh" description="Toa thuốc và chẩn đoán trước đây." roleCode="PATIENT" />} />
        <Route path="patient/profile" element={<RoleDashboard title="Hồ Sơ Cá Nhân" description="Thông tin liên lạc và bảo hiểm y tế." roleCode="PATIENT" />} />
      </Route>
    </Routes>
  );
}
