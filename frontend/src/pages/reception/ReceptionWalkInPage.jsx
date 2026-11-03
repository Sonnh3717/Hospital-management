import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlusIcon,
  CalendarCheckIcon,
  UserGroupIcon,
  ClockIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '../../components/common/Icons';

export default function ReceptionWalkInPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tạo hẹn khám trực tiếp (Walk-in)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tiếp đón và phân luồng bệnh nhân vãng lai chưa đặt lịch trước tại quầy lễ tân Tầng 1
        </p>
      </div>

      {/* Modern Active Development Announcement */}
      <div className="bg-gradient-to-br from-teal-50 via-sky-50 to-emerald-50 rounded-2xl border border-teal-200/80 p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
            <UserPlusIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Phân hệ Đang Phát Triển & Chuẩn Hóa Kiosk</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Hệ Thống Đặt Số Khám Tự Động (Walk-in Ticketing)</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              Tính năng cấp số khám tự động tại quầy và tích hợp Kiosk tự phục vụ đang được hoàn thiện. 
              Hiện tại, nhân viên tiếp đón thực hiện theo quy trình chuẩn dưới đây để tra cứu hồ sơ và tiếp đón người bệnh.
            </p>
          </div>
        </div>
      </div>

      {/* Standard Operating Procedure (SOP) Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-sky-600" />
          <span>Quy trình Tiếp đón Khám Trực tiếp tại Quầy (SOP)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center">1</div>
              <h4 className="font-bold text-slate-800 text-sm">Tra cứu hồ sơ người bệnh</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kiểm tra thông tin bệnh nhân qua CCCD/SĐT trên hệ thống. Nếu là bệnh nhân mới, tạo mới hồ sơ bệnh nhân.
              </p>
            </div>
            <Link
              to="/reception/patients"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 pt-2"
            >
              <span>Quản lý bệnh nhân &rarr;</span>
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center">2</div>
              <h4 className="font-bold text-slate-800 text-sm">Kiểm tra ca khám & Tiếp đón</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tra cứu danh sách lịch hẹn trong ngày, tiếp đón bệnh nhân đến khám và xác nhận check-in vào hàng chờ.
              </p>
            </div>
            <Link
              to="/reception/appointments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 pt-2"
            >
              <span>Quản lý lịch hẹn &rarr;</span>
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center">3</div>
              <h4 className="font-bold text-slate-800 text-sm">Điều phối vào phòng khám</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hướng dẫn người bệnh tới sảnh chờ chuyên khoa tương ứng theo số phòng chỉ định trên phiếu khám.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium pt-2">Bác sĩ tiếp nhận trên Bàn làm việc</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/reception/appointments"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition">
            <CalendarCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition">Quản lý lịch hẹn bệnh viện</h4>
            <p className="text-xs text-slate-500 mt-0.5">Tiếp đón, tra cứu toàn viện, đổi ca và hủy hẹn</p>
          </div>
        </Link>

        <Link
          to="/reception/patients"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-xs transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-teal-600 transition">Quản lý hồ sơ bệnh nhân</h4>
            <p className="text-xs text-slate-500 mt-0.5">Thêm mới bệnh nhân, cập nhật thông tin và kích hoạt hồ sơ</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
