import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { patientApi, appointmentApi } from '../../services/api';
import {
  CalendarIcon,
  ClockIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  EyeIcon,
  EditIcon,
  StethoscopeIcon,
  UserIcon,
  ClipboardListIcon,
  PrinterIcon,
} from '../../components/common/Icons';

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [clinicalSummaryAppt, setClinicalSummaryAppt] = useState(null);
  const [clinicalSummaryData, setClinicalSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // Toast / Alert
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const fetchAppointments = async () => {
    try {
      const res = await patientApi.getMyAppointments();
      const list = Array.isArray(res) ? res : res?.data || [];
      setAppointments(list);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Không thể tải danh sách lịch hẹn.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // Helper: Normalize UTC ISO string from backend (ensuring trailing 'Z' if missing)
  const parseUtcDate = (isoString) => {
    if (!isoString) return null;
    let s = String(isoString);
    if (!s.endsWith('Z') && !s.includes('+') && s.includes('T')) {
      s += 'Z';
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(isoString) : d;
  };

  // 24h Notice Check Helper
  const check24hNotice = (startsAt) => {
    if (!startsAt) return { isEligible: false, hoursLeft: 0 };
    const now = new Date();
    const start = parseUtcDate(startsAt);
    if (!start || isNaN(start.getTime())) return { isEligible: false, hoursLeft: 0 };
    const diffMs = start.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return {
      isEligible: diffHours >= 24,
      hoursLeft: Math.max(0, Math.round(diffHours)),
    };
  };

  // Format Date and Time
  const formatDateTime = (isoString) => {
    if (!isoString) return '--';
    const d = parseUtcDate(isoString);
    if (!d || isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} - ${day}/${month}/${year}`;
  };

  const formatDateOnly = (isoString) => {
    if (!isoString) return '--';
    const d = parseUtcDate(isoString);
    if (!d || isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '--';
    const d = parseUtcDate(isoString);
    if (!d || isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: appointments.length,
      booked: appointments.filter((a) => a.status === 'BOOKED').length,
      checkedIn: appointments.filter((a) => a.status === 'CHECKED_IN').length,
      cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
    };
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Status filter
      if (statusFilter !== 'ALL' && appt.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = appt.appointmentCode?.toLowerCase().includes(q);
        const doctorMatch = appt.doctorName?.toLowerCase().includes(q);
        const specMatch = appt.specialization?.toLowerCase().includes(q);
        const reasonMatch = appt.reason?.toLowerCase().includes(q);
        return codeMatch || doctorMatch || specMatch || reasonMatch;
      }
      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  // Status Badge Renderer
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'BOOKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            Chờ khám (Đã đặt)
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã tiếp đón
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Đã hủy
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Vắng mặt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Open Cancel Modal
  const handleOpenCancel = (appt) => {
    setCancellingAppointment(appt);
    setCancelReason('');
    setCancelError('');
  };

  // Submit Cancel
  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng chọn hoặc nhập lý do hủy lịch.');
      return;
    }
    setCancelSubmitting(true);
    setCancelError('');
    try {
      await appointmentApi.cancel(cancellingAppointment.id, cancelReason.trim());
      showAlert('success', 'Hủy lịch hẹn thành công.');
      setCancellingAppointment(null);
      fetchAppointments();
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Không thể hủy lịch hẹn.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Open Reschedule Modal
  const handleOpenReschedule = (appt) => {
    setReschedulingAppointment(appt);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDateStr = tomorrow.toISOString().split('T')[0];
    setRescheduleDate(defaultDateStr);
    setSelectedSlotId(null);
    setRescheduleReason('');
    setRescheduleError('');
    loadSlotsForDate(defaultDateStr, appt.doctorId);
  };

  // Load Slots for Date
  const loadSlotsForDate = async (dateStr, docId) => {
    setSlotsLoading(true);
    setRescheduleSlots([]);
    try {
      const res = await appointmentApi.getAvailableSlots(dateStr, docId);
      const slots = Array.isArray(res) ? res : res?.data || [];
      setRescheduleSlots(slots);
    } catch (err) {
      setRescheduleSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (newDate) => {
    setRescheduleDate(newDate);
    setSelectedSlotId(null);
    if (reschedulingAppointment) {
      loadSlotsForDate(newDate, reschedulingAppointment.doctorId);
    }
  };

  // Submit Reschedule
  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setRescheduleError('Vui lòng chọn một khung giờ khám mới.');
      return;
    }
    setRescheduleSubmitting(true);
    setRescheduleError('');
    try {
      await appointmentApi.reschedule(
        reschedulingAppointment.id,
        selectedSlotId,
        rescheduleReason.trim() || 'Người bệnh đổi lịch qua Cổng dịch vụ'
      );
      showAlert('success', 'Đổi lịch hẹn thành công.');
      setReschedulingAppointment(null);
      fetchAppointments();
    } catch (err) {
      setRescheduleError(err.response?.data?.message || 'Không thể đổi lịch hẹn.');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Open Clinical Summary Modal
  const handleOpenClinicalSummary = async (appt) => {
    setClinicalSummaryAppt(appt);
    setClinicalSummaryData(null);
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await patientApi.getClinicalSummary(appt.id);
      const data = res?.data || res;
      setClinicalSummaryData(data);
    } catch (err) {
      console.error('Lỗi tải kết quả khám:', err);
      setSummaryError(err.response?.data?.message || 'Không thể tải kết quả khám và đơn thuốc.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {alert && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs transition ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {alert.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircleIcon className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-semibold">{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý lịch hẹn khám</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi danh sách, trạng thái và lịch sử các cuộc hẹn khám bệnh của bạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới danh sách"
          >
            <RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <Link
            to="/patient/book"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-500 shadow-sm transition"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Đặt lịch khám mới</span>
          </Link>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số lịch</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs bg-sky-50/30">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Chờ khám</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{metrics.booked}</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs bg-emerald-50/30">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Đã tiếp đón</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{metrics.checkedIn}</p>
        </div>
        <div className="bg-white rounded-2xl border border-rose-100 p-4 shadow-xs bg-rose-50/30">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Đã hủy</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{metrics.cancelled}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã lịch hẹn, tên bác sĩ, chuyên khoa hoặc triệu chứng..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'BOOKED', label: 'Chờ khám' },
              { id: 'CHECKED_IN', label: 'Đã tiếp đón' },
              { id: 'CANCELLED', label: 'Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointment Cards / List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCwIcon className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-3 font-medium">Đang tải danh sách lịch hẹn...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Không tìm thấy lịch hẹn nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Không có kết quả phù hợp với bộ lọc hiện tại. Thử xóa tìm kiếm hoặc chọn bộ lọc khác.'
                : 'Bạn hiện chưa có lịch hẹn khám nào. Nhấn nút bên dưới để chọn bác sĩ và đặt lịch ngay.'}
            </p>
          </div>
          {!searchQuery && statusFilter === 'ALL' && (
            <Link
              to="/patient/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-500 transition"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Đặt lịch khám đầu tiên</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((appt) => {
            const notice = check24hNotice(appt.startsAt);
            const isBooked = appt.status === 'BOOKED';

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-sky-200 hover:shadow-xs transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {appt.appointmentCode}
                    </span>
                    {renderStatusBadge(appt.status)}
                    {appt.encounterStatus === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã khám xong</span>
                      </span>
                    )}
                    {appt.encounterStatus === 'IN_PROGRESS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
                        <StethoscopeIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Bác sĩ đang khám</span>
                      </span>
                    )}
                  </div>

                  {/* 24h Notice Badge for BOOKED */}
                  {isBooked && (
                    <div>
                      {notice.isEligible ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          <span>Đủ điều kiện đổi/hủy (&gt;24h)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircleIcon className="w-3.5 h-3.5" />
                          <span>Dưới 24h trước giờ khám</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Doctor & Specialty */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <StethoscopeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Bác sĩ phụ trách</p>
                      <h4 className="font-bold text-slate-900 text-sm">{appt.doctorName || 'Bác sĩ chuyên khoa'}</h4>
                      <p className="text-xs text-sky-600 font-semibold">{appt.specialization || 'Đa khoa'}</p>
                    </div>
                  </div>

                  {/* Time & Date */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                      <ClockIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Thời gian khám</p>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {formatTimeOnly(appt.startsAt)} - {formatTimeOnly(appt.endsAt)}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{formatDateOnly(appt.startsAt)}</p>
                    </div>
                  </div>

                  {/* Chief Complaint / Symptoms */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Triệu chứng / Lý do khám</p>
                    <p className="text-xs text-slate-700 font-medium line-clamp-2">
                      {appt.reason || 'Không có mô tả triệu chứng cụ thể'}
                    </p>
                    {appt.cancellationReason && (
                      <p className="text-xs text-rose-600 font-medium mt-1">
                        Lý do hủy: {appt.cancellationReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                  <button
                    onClick={() => setSelectedAppointment(appt)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    <span>Xem chi tiết</span>
                  </button>

                  {(appt.encounterStatus === 'COMPLETED' || appt.status === 'CHECKED_IN') && (
                    <button
                      onClick={() => handleOpenClinicalSummary(appt)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition"
                    >
                      <ClipboardListIcon className="w-3.5 h-3.5" />
                      <span>Kết quả khám & Đơn thuốc</span>
                    </button>
                  )}

                  {isBooked && (
                    <>
                      <button
                        onClick={() => handleOpenReschedule(appt)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition"
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                        <span>Đổi lịch</span>
                      </button>

                      <button
                        onClick={() => handleOpenCancel(appt)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                        <span>Hủy hẹn</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chi tiết Phiếu Lịch Hẹn</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedAppointment.appointmentCode}</p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Virtual Ticket Card */}
            <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-2xl p-6 space-y-4 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] tracking-widest text-sky-300 font-bold uppercase">
                    Bệnh viện Đa khoa Quốc tế
                  </span>
                  <h4 className="text-xl font-bold tracking-tight mt-1">{selectedAppointment.appointmentCode}</h4>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
                  {selectedAppointment.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs">
                <div>
                  <p className="text-slate-400">Bác sĩ phụ trách</p>
                  <p className="font-bold text-sm text-white mt-0.5">{selectedAppointment.doctorName}</p>
                  <p className="text-sky-300">{selectedAppointment.specialization}</p>
                </div>
                <div>
                  <p className="text-slate-400">Thời gian khám</p>
                  <p className="font-bold text-sm text-white mt-0.5">
                    {formatTimeOnly(selectedAppointment.startsAt)} - {formatTimeOnly(selectedAppointment.endsAt)}
                  </p>
                  <p className="text-slate-300">{formatDateOnly(selectedAppointment.startsAt)}</p>
                </div>
              </div>
            </div>

            {/* Clinical & Appointment Metadata */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400">Người bệnh:</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedAppointment.patientName || 'Tôi'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Số điện thoại:</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedAppointment.patientPhone || '--'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Nguồn đặt hẹn:</span>
                  <p className="font-semibold text-slate-700">{selectedAppointment.bookingSource || 'ONLINE'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Trạng thái:</span>
                  <p className="mt-0.5">{renderStatusBadge(selectedAppointment.status)}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Lý do khám / Triệu chứng ban đầu:</span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {selectedAppointment.reason || 'Chưa có thông tin triệu chứng'}
                </p>
              </div>

              {selectedAppointment.note && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Ghi chú từ nhân viên y tế:</span>
                  <p className="text-slate-800 font-medium leading-relaxed">{selectedAppointment.note}</p>
                </div>
              )}

              {/* Check-in info */}
              {selectedAppointment.checkedInAt && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    <span>Đã hoàn tất tiếp đón tại quầy</span>
                  </div>
                  <p className="text-emerald-700">
                    Thời gian tiếp đón: {formatDateTime(selectedAppointment.checkedInAt)}
                    {selectedAppointment.checkedInByStaffName && ` bởi ${selectedAppointment.checkedInByStaffName}`}
                  </p>
                </div>
              )}

              {/* Cancellation info */}
              {selectedAppointment.cancelledAt && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <AlertCircleIcon className="w-4 h-4 text-rose-600" />
                    <span>Lịch hẹn đã bị hủy</span>
                  </div>
                  <p className="text-rose-700">Thời gian hủy: {formatDateTime(selectedAppointment.cancelledAt)}</p>
                  <p className="text-rose-700">Lý do: {selectedAppointment.cancellationReason || '--'}</p>
                </div>
              )}

              {/* Rescheduled info */}
              {selectedAppointment.lastRescheduledAt && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-sky-700">
                  Đã đổi lịch lần cuối lúc: {formatDateTime(selectedAppointment.lastRescheduledAt)}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CANCEL MODAL ==================== */}
      {cancellingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircleIcon className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Xác nhận Hủy Lịch Hẹn</h3>
              </div>
              <button
                onClick={() => setCancellingAppointment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 24h Notice Verification Card */}
            {(() => {
              const notice = check24hNotice(cancellingAppointment.startsAt);
              if (notice.isEligible) {
                return (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Đủ điều kiện hủy trước 24 giờ:</span> Ca khám còn cách {notice.hoursLeft} giờ. Yêu cầu hủy lịch của bạn sẽ được phê duyệt ngay.
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                    <AlertCircleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Cảnh báo quy định 24 giờ:</span> Ca khám của bạn diễn ra trong vòng {notice.hoursLeft} giờ tới. Theo quy định bệnh viện, người bệnh chỉ được tự hủy lịch trước tối thiểu 24 giờ.
                    </div>
                  </div>
                );
              }
            })()}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <p><span className="text-slate-400">Mã lịch hẹn:</span> <strong className="text-slate-800">{cancellingAppointment.appointmentCode}</strong></p>
              <p><span className="text-slate-400">Bác sĩ:</span> <strong className="text-slate-800">{cancellingAppointment.doctorName}</strong> ({cancellingAppointment.specialization})</p>
              <p><span className="text-slate-400">Thời gian:</span> <strong className="text-slate-800">{formatDateTime(cancellingAppointment.startsAt)}</strong></p>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do hủy lịch khám <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Bận việc đột xuất',
                    'Sức khỏe đã ổn định',
                    'Đổi sang ngày khám khác',
                    'Nhầm lịch cá nhân',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setCancelReason(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập chi tiết lý do hủy lịch của bạn..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingAppointment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {cancelSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== RESCHEDULE MODAL ==================== */}
      {reschedulingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sky-600">
                <CalendarIcon className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Đổi Lịch Hẹn Khám</h3>
              </div>
              <button
                onClick={() => setReschedulingAppointment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 24h Notice Check */}
            {(() => {
              const notice = check24hNotice(reschedulingAppointment.startsAt);
              if (!notice.isEligible) {
                return (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Lịch hẹn hiện tại cách ít hơn 24 giờ ({notice.hoursLeft}h). Theo quy định, việc đổi lịch có thể bị giới hạn.</span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <p><span className="text-slate-400">Mã lịch hẹn:</span> <strong className="text-slate-800">{reschedulingAppointment.appointmentCode}</strong></p>
              <p><span className="text-slate-400">Bác sĩ:</span> <strong className="text-slate-800">{reschedulingAppointment.doctorName}</strong> ({reschedulingAppointment.specialization})</p>
              <p><span className="text-slate-400">Khung giờ hiện tại:</span> <strong className="text-slate-800">{formatDateTime(reschedulingAppointment.startsAt)}</strong></p>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              {/* Date selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn ngày khám mới <span className="text-sky-500">*</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                />
              </div>

              {/* Slot selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn khung giờ trống khả dụng <span className="text-sky-500">*</span>
                </label>
                {slotsLoading ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                    <RefreshCwIcon className="w-4 h-4 animate-spin text-sky-600" />
                    <span>Đang kiểm tra khung giờ trống...</span>
                  </div>
                ) : rescheduleSlots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                    Bác sĩ không có ca khám khả dụng trong ngày này. Vui lòng chọn ngày khác.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                    {rescheduleSlots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      const isPast = slot.endsAt && (parseUtcDate(slot.endsAt) || new Date(slot.endsAt)) <= new Date();
                      const hasCapacity = slot.remaining > 0 && !isPast;

                      return (
                        <button
                          type="button"
                          key={slot.id}
                          disabled={!hasCapacity}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col justify-between ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : hasCapacity
                              ? 'bg-white hover:border-sky-300 border-slate-200 text-slate-800'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className={`font-bold ${isPast ? 'line-through text-slate-400' : ''}`}>
                            {formatTimeOnly(slot.startsAt)} - {formatTimeOnly(slot.endsAt)}
                          </div>
                          <div className={`text-[10px] mt-1 ${isSelected ? 'text-sky-100' : isPast ? 'text-rose-500 font-semibold' : 'text-slate-500'}`}>
                            {isPast ? 'Đã qua giờ' : hasCapacity ? `Còn ${slot.remaining} chỗ` : 'Hết chỗ'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do đổi lịch (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Ví dụ: Bận lịch công tác, đổi giờ..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingAppointment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={rescheduleSubmitting || !selectedSlotId}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {rescheduleSubmitting ? 'Đang cập nhật...' : 'Xác nhận đổi lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CLINICAL SUMMARY & PRESCRIPTION MODAL ==================== */}
      {clinicalSummaryAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ClipboardListIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Kết quả Khám bệnh & Đơn thuốc</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Mã hẹn: {clinicalSummaryAppt.appointmentCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-bold"
                  title="In đơn thuốc"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">In đơn thuốc</span>
                </button>
                <button
                  onClick={() => setClinicalSummaryAppt(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            {summaryLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Đang tải hồ sơ bệnh án và đơn thuốc điện tử...
              </div>
            ) : summaryError ? (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {summaryError}
              </div>
            ) : !clinicalSummaryData ? (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                Lịch hẹn này chưa có dữ liệu khám bệnh hoàn tất từ Bác sĩ phụ trách.
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Hospital Badge & Doctor Info */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      Bệnh viện Chuyên khoa Da Liễu
                    </p>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                      Bác sĩ khám: {clinicalSummaryData.doctor?.fullName || clinicalSummaryAppt.doctorName}
                    </h4>
                    <p className="text-sky-600 font-semibold">{clinicalSummaryAppt.specialization || 'Da liễu chuyên sâu'}</p>
                  </div>
                  <div className="text-right sm:text-right">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {clinicalSummaryData.status === 'COMPLETED' ? 'Đã hoàn tất khám' : 'Đang tiến hành'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {clinicalSummaryData.completedAt || clinicalSummaryData.startedAt}
                    </p>
                  </div>
                </div>

                {/* Patient Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Bệnh nhân</span>
                    <strong className="text-slate-900">{clinicalSummaryData.patient?.fullName || clinicalSummaryAppt.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mã bệnh nhân</span>
                    <strong className="text-slate-900 font-mono">{clinicalSummaryData.patient?.patientCode || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Số điện thoại</span>
                    <strong className="text-slate-900">{clinicalSummaryData.patient?.phone || clinicalSummaryAppt.patientPhone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Giới tính</span>
                    <strong className="text-slate-900">{clinicalSummaryData.patient?.gender === 'MALE' ? 'Nam' : 'Nữ'}</strong>
                  </div>
                </div>

                {/* Diagnoses */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Chẩn đoán bệnh (ICD-10)
                  </h4>
                  {clinicalSummaryData.diagnoses && clinicalSummaryData.diagnoses.length > 0 ? (
                    <div className="space-y-1.5">
                      {clinicalSummaryData.diagnoses.map((d) => (
                        <div
                          key={d.id}
                          className="p-3 rounded-xl border border-sky-100 bg-sky-50/50 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-[11px]">
                              {d.diagnosisCode}
                            </span>
                            <span className="font-semibold text-slate-800">{d.diagnosisText}</span>
                          </div>
                          {d.primary && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Chính
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Chưa có chẩn đoán</p>
                  )}
                </div>

                {/* Clinical Findings & Symptoms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block">Triệu chứng cơ năng</span>
                    <p className="text-slate-600 whitespace-pre-wrap">{clinicalSummaryData.symptoms || '—'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block">Tổn thương lâm sàng</span>
                    <p className="text-slate-600 whitespace-pre-wrap">{clinicalSummaryData.clinicalFindings || '—'}</p>
                  </div>
                </div>

                {/* Treatment & Prescription */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Toa thuốc & Phác đồ điều trị
                  </h4>
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                    {clinicalSummaryData.treatment?.decisionText ? (
                      <div>
                        <span className="text-[11px] font-bold text-amber-900 block mb-1">Đơn thuốc chỉ định:</span>
                        <div className="font-mono text-slate-900 whitespace-pre-wrap bg-white p-3 rounded-xl border border-amber-100 text-xs">
                          {clinicalSummaryData.treatment.decisionText}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Chưa có đơn thuốc</p>
                    )}

                    {clinicalSummaryData.treatment?.instructions && (
                      <div>
                        <span className="text-[11px] font-bold text-amber-900 block mb-1">Lời dặn của Bác sĩ:</span>
                        <p className="text-slate-700 whitespace-pre-wrap text-xs">
                          {clinicalSummaryData.treatment.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow-up recommendation */}
                {clinicalSummaryData.followUps && clinicalSummaryData.followUps.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
                    <span className="font-bold text-sky-900 block">Lịch hẹn tái khám đề nghị</span>
                    <p className="text-sky-800">
                      Lý do: {clinicalSummaryData.followUps[0].reason}
                    </p>
                    <p className="text-sky-700 text-[11px]">
                      Khoảng thời gian: từ <strong>{clinicalSummaryData.followUps[0].requestedFromDate}</strong>
                      {clinicalSummaryData.followUps[0].requestedToDate && (
                        <span> đến <strong>{clinicalSummaryData.followUps[0].requestedToDate}</strong></span>
                      )}
                    </p>
                  </div>
                )}

                {/* Paraclinical Results (if any) */}
                {clinicalSummaryData.requests && clinicalSummaryData.requests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Kết quả xét nghiệm & Kỹ thuật
                    </h4>
                    <div className="space-y-2">
                      {clinicalSummaryData.requests.map((r) => (
                        <div key={r.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{r.service?.serviceName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {r.status}
                            </span>
                          </div>
                          {r.result?.resultSummary && (
                            <p className="text-slate-700"><span className="font-semibold">Kết quả:</span> {r.result.resultSummary}</p>
                          )}
                          {r.result?.review?.handlingDecision && (
                            <p className="text-sky-800 text-[11px] italic">
                              Đánh giá bác sĩ: {r.result.review.handlingDecision}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
