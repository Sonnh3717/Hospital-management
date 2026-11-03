import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  PhoneIcon,
  MapPinIcon,
  MailIcon,
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '../../components/common/Icons';

export default function PatientBookingPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Back link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Đặt lịch khám trực tuyến</h1>
          <p className="text-sm text-slate-500 mt-1">
            Đặt hẹn nhanh chóng với đội ngũ bác sĩ chuyên khoa đầu ngành
          </p>
        </div>
        <Link
          to="/patient/appointments"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:text-sky-600 hover:border-sky-300 transition shadow-xs"
        >
          <span>Quản lý lịch hẹn của tôi</span>
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      {/* Main Notice Banner */}
      <div className="bg-gradient-to-br from-sky-50 via-teal-50 to-indigo-50 rounded-2xl border border-sky-200/80 p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-600/20">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Phân hệ Đang Nâng Cấp & Chuẩn Hóa</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Cổng Đặt Lịch Hẹn Trực Tuyến & Cổng Thanh Toán PayOS
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              Hệ thống đặt hẹn tự động tích hợp điều phối ca khám trực tuyến và thanh toán viện phí qua PayOS đang được hoàn thiện. 
              Quý người bệnh vui lòng sử dụng các kênh tiếp nhận nhanh dưới đây để được hỗ trợ đặt lịch khám ngay lập tức.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Alternative Booking Channels */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-sky-600" />
          <span>3 Phương thức Đặt hẹn Khám nhanh chóng</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Channel 1: Hotline 24/7 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-sky-200 transition group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition">
                <PhoneIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Tổng đài CSKH 24/7</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Liên hệ trực tiếp tổng đài để được tư vấn viên hỗ trợ chọn bác sĩ và xếp giờ khám ưu tiên theo yêu cầu.
                </p>
              </div>
            </div>
            <div className="pt-6">
              <a
                href="tel:19006868"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 font-bold text-sm hover:bg-sky-600 hover:text-white transition"
              >
                <PhoneIcon className="w-4 h-4" />
                <span>1900 6868 (Miễn phí)</span>
              </a>
            </div>
          </div>

          {/* Channel 2: Counter at Floor 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-teal-200 transition group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
                <MapPinIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Quầy Tiếp đón Tầng 1</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Đăng ký trực tiếp tại sảnh tiếp đón trung tâm bệnh viện. Đội ngũ nhân viên lễ tân tiếp nhận và phân luồng chu đáo.
                </p>
              </div>
            </div>
            <div className="pt-6 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <ClockIcon className="w-4 h-4 text-teal-600" />
                <span>07:00 – 17:00 (Thứ 2 – Chủ Nhật)</span>
              </div>
              <p className="text-xs text-slate-400">Tầng 1, Tòa nhà Khám Đa khoa</p>
            </div>
          </div>

          {/* Channel 3: Email Support */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                <MailIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Hỗ trợ qua Thư điện tử</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Gửi yêu cầu đặt hẹn kèm thông tin triệu chứng hoặc giấy chuyển viện qua thư điện tử để nhận phản hồi nhanh.
                </p>
              </div>
            </div>
            <div className="pt-6">
              <a
                href="mailto:cskh@hospital.vn"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm hover:bg-indigo-600 hover:text-white transition"
              >
                <MailIcon className="w-4 h-4" />
                <span>cskh@hospital.vn</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Useful tips card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h4 className="font-bold text-slate-900 text-sm">Lưu ý quan trọng dành cho Người bệnh</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold mt-0.5">✓</div>
            <p>Người bệnh vui lòng đến trước giờ khám tối thiểu 15 phút để hoàn tất thủ tục tiếp đón tại quầy lễ tân.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold mt-0.5">✓</div>
            <p>Mang theo Căn cước công dân gắn chip hoặc thẻ BHYT và các đơn thuốc hoặc kết quả xét nghiệm gần nhất.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold mt-0.5">✓</div>
            <p>Có thể hủy hẹn hoặc đổi ca khám trước giờ khám tối thiểu 24 giờ qua Cổng quản lý lịch hẹn.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold mt-0.5">✓</div>
            <p>Mọi thắc mắc về chi phí khám và bảo lãnh viện phí, vui lòng liên hệ tổng đài 1900 6868 để được hướng dẫn.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
