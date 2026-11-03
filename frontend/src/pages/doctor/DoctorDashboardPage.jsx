import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  StethoscopeIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClipboardListIcon,
  ActivityIcon,
} from '../../components/common/Icons';

export default function DoctorDashboardPage() {
  const { user } = useAuth();

  // Dynamic doctor name resolution
  const doctorDisplayName = user?.fullName || user?.username || 'Bác sĩ';

  // Format today in Vietnamese
  const todayFormatted = (() => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[now.getDay()];
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${dayName}, ngày ${d}/${m}/${y}`;
  })();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Dynamic Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-sky-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute right-32 bottom-0 -mb-10 w-60 h-60 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sky-300 text-xs font-semibold border border-white/10">
              <StethoscopeIcon className="w-3.5 h-3.5" />
              <span>Chuyên khoa Da liễu & Laser Thẩm mỹ</span>
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {todayFormatted}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào mừng Bác sĩ, {doctorDisplayName}!
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Chúc Bác sĩ một ca trực làm việc thuận lợi, chính xác và hiệu quả. Hệ thống quản lý bệnh nhân và lịch hẹn đã sẵn sàng phục vụ.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>Phòng khám Chuyên khoa 204 (Tầng 2)</span>
            </div>
            <span className="text-slate-600">•</span>
            <div>Ca trực: <strong>08:00 – 17:00</strong></div>
            <span className="text-slate-600">•</span>
            <div>Mã số nhân viên: <strong>{user?.staffId ? `BS-${user.staffId}` : 'BS-MINH'}</strong></div>
          </div>
        </div>
      </div>

      {/* Quick Shift Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Ca trực hôm nay</span>
            <CalendarIcon className="w-5 h-5 text-sky-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">04</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">lịch hẹn</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đã phân bổ theo khung giờ</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs bg-emerald-50/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Bệnh nhân chờ khám</span>
            <UserGroupIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-700">01</span>
            <span className="text-xs text-emerald-600 ml-1.5 font-medium">đã tiếp đón</span>
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Sẵn sàng tại sảnh chờ tầng 2</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Đã hoàn thành</span>
            <CheckCircleIcon className="w-5 h-5 text-teal-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">00</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">ca khám</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Chưa kết luận bệnh án nào</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs bg-indigo-50/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Lịch hẹn ngày mai</span>
            <ClockIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-indigo-700">03</span>
            <span className="text-xs text-indigo-600 ml-1.5 font-medium">lịch hẹn</span>
          </div>
          <p className="text-[11px] text-indigo-600/80 mt-1">Đã xác nhận đặt trước</p>
        </div>
      </div>

      {/* Clinical Dashboard Feature Showcase & Roadmap Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Phân hệ Bàn khám & Hồ sơ bệnh án điện tử</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Tính Năng Lâm Sàng Đang Phát Triển (Milestone 3 Roadmap)
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Các mô-đun khám chữa bệnh chuyên sâu dành cho Bác sĩ điều trị đang được chuẩn hóa giao diện và tích hợp API hồ sơ bệnh án điện tử (EMR).
            </p>
          </div>
        </div>

        {/* 4 Feature Roadmap Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Module 1 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-indigo-300 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                <UserGroupIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Hàng chờ Khám bệnh (Worklist Queue)</h4>
                <span className="text-[11px] text-indigo-600 font-semibold">Tự động đồng bộ từ Lễ tân</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Hiển thị danh sách bệnh nhân đã hoàn tất check-in tại quầy, hỗ trợ gọi loa tự động vào phòng khám và cập nhật trạng thái ca khám thời gian thực.
            </p>
          </div>

          {/* Module 2 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-indigo-300 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition">
                <ClipboardListIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Khám lâm sàng & Mã bệnh ICD-10</h4>
                <span className="text-[11px] text-sky-600 font-semibold">Chuẩn hóa dữ liệu y tế</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Ghi nhận triệu chứng, tiền sử dị ứng, sinh hiệu (huyết áp, mạch, nhiệt độ), và tra cứu tự động danh mục chẩn đoán bệnh theo mã ICD-10 của Bộ Y tế.
            </p>
          </div>

          {/* Module 3 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-indigo-300 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Kê đơn thuốc điện tử (E-Prescription)</h4>
                <span className="text-[11px] text-teal-600 font-semibold">Liên thông kho Dược</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Kê toa thuốc nhanh theo phác đồ mẫu, kiểm tra tương tác thuốc có hại và truyền dữ liệu tự động đến quầy Dược để cấp phát thuốc cho người bệnh.
            </p>
          </div>

          {/* Module 4 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-indigo-300 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition">
                <ActivityIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Chỉ định Cận lâm sàng & Xét nghiệm</h4>
                <span className="text-[11px] text-rose-600 font-semibold">Kết nối PACS / LIS</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Chỉ định xét nghiệm máu, nước tiểu, chẩn đoán hình ảnh (X-quang, CT, MRI, siêu âm) và nhận kết quả trực tuyến ngay trên màn hình làm việc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
