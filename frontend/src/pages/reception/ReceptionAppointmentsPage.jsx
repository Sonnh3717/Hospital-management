import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { receptionApi, appointmentApi } from '../../services/api';
import {
  CalendarCheckIcon,
  CalendarIcon,
  ClockIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  EyeIcon,
  EditIcon,
  FilterIcon,
  UserIcon,
  StethoscopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from '../../components/common/Icons';

export default function ReceptionAppointmentsPage() {
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Filter States
  const [date, setDate] = useState(todayStr);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [page, setPage] = useState(0);
  const size = 20;

  // Data States
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorOptions, setDoctorOptions] = useState([]);

  // Modals
  const [detailModal, setDetailModal] = useState(null);
  const [checkInModal, setCheckInModal] = useState(null);
  const [undoModal, setUndoModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(todayStr);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Action status
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Load Doctor Options
  const loadOptions = useCallback(async (currentDate) => {
    try {
      const res = await receptionApi.getOptions(currentDate || undefined);
      if (res && res.doctors) {
        setDoctorOptions(res.doctors);
      }
    } catch (err) {
      console.warn('Could not load options:', err);
    }
  }, []);

  // Load Appointments
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const params = {
        page,
        size,
      };
      if (date) params.date = date;
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (doctorId) params.doctorId = doctorId;

      const res = await receptionApi.listAppointments(params);
      const items = res?.items || res?.data?.items || [];
      const totalCount = res?.total ?? res?.data?.total ?? 0;
      setAppointments(items);
      setTotal(totalCount);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Không thể tải danh sách lịch hẹn toàn viện.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, search, status, doctorId, page]);

  useEffect(() => {
    loadOptions(date);
  }, [date, loadOptions]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await appointmentApi.scanNoShow();
    } catch (e) {
      // ignore
    }
    loadAppointments();
  };

  // Format Helpers
  const formatTimeOnly = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  const formatDateOnly = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} - ${day}/${month}/${year}`;
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const booked = appointments.filter((a) => a.status === 'BOOKED').length;
    const checkedIn = appointments.filter((a) => a.status === 'CHECKED_IN').length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;
    return {
      total: total || appointments.length,
      booked,
      checkedIn,
      cancelled,
    };
  }, [appointments, total]);

  // Status Badge Renderer
  const renderStatusBadge = (appt) => {
    if (appt.encounterStatus === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          Đã khám xong
        </span>
      );
    }
    if (appt.encounterStatus === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Đang khám
        </span>
      );
    }
    if (appt.status === 'CHECKED_IN') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Đã tiếp đón
        </span>
      );
    }
    if (appt.status === 'BOOKED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          Chờ tiếp đón
        </span>
      );
    }
    if (appt.status === 'CANCELLED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Đã hủy
        </span>
      );
    }
    if (appt.status === 'NO_SHOW') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Vắng mặt
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {appt.status}
      </span>
    );
  };

  // Check if slot falls on today
  const isSlotToday = (slotStartsAt) => {
    if (!slotStartsAt) return false;
    const slotDate = new Date(slotStartsAt).toISOString().split('T')[0];
    return slotDate === todayStr;
  };

  // ---------------- ACTION HANDLERS ----------------

  // Confirm Check-in
  const handleConfirmCheckIn = async () => {
    if (!checkInModal) return;
    setActionLoading(true);
    setActionError('');
    try {
      await receptionApi.checkIn(checkInModal.id);
      showToast('success', `Tiếp đón thành công bệnh nhân ${checkInModal.patient?.fullName || ''}.`);
      setCheckInModal(null);
      loadAppointments();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể tiếp đón bệnh nhân.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Undo Check-in
  const handleConfirmUndo = async () => {
    if (!undoModal) return;
    setActionLoading(true);
    setActionError('');
    try {
      await receptionApi.undoCheckIn(undoModal.id);
      showToast('success', 'Đã hoàn tác tiếp đón bệnh nhân thành công.');
      setUndoModal(null);
      loadAppointments();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể hoàn tác tiếp đón.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Cancel
  const handleConfirmCancel = async () => {
    if (!cancelModal) return;
    setActionLoading(true);
    setActionError('');
    try {
      await receptionApi.cancelAppointment(cancelModal.id, cancelReason.trim() || 'Hủy tại quầy tiếp đón');
      showToast('success', 'Hủy lịch hẹn thành công.');
      setCancelModal(null);
      loadAppointments();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể hủy lịch hẹn.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reschedule Modal & Load Slots
  const handleOpenReschedule = async (appt) => {
    setRescheduleModal(appt);
    setRescheduleDate(todayStr);
    setSelectedSlotId(null);
    setActionError('');
    loadRescheduleSlots(todayStr, appt.doctor?.id);
  };

  const loadRescheduleSlots = async (targetDate, docId) => {
    setSlotsLoading(true);
    setRescheduleSlots([]);
    try {
      const res = await appointmentApi.getAvailableSlots(targetDate, docId);
      const slots = Array.isArray(res) ? res : res?.data || [];
      setRescheduleSlots(slots);
    } catch (err) {
      setRescheduleSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleRescheduleDateChange = (newDate) => {
    setRescheduleDate(newDate);
    setSelectedSlotId(null);
    if (rescheduleModal) {
      loadRescheduleSlots(newDate, rescheduleModal.doctor?.id);
    }
  };

  // Confirm Reschedule
  const handleConfirmReschedule = async () => {
    if (!rescheduleModal || !selectedSlotId) {
      setActionError('Vui lòng chọn một khung giờ mới.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await receptionApi.rescheduleAppointment(rescheduleModal.id, selectedSlotId);
      showToast('success', 'Đổi lịch hẹn tại quầy thành công.');
      setRescheduleModal(null);
      loadAppointments();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể đổi lịch hẹn.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs transition ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircleIcon className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý lịch hẹn toàn viện</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tiếp đón người bệnh, kiểm soát hàng chờ khám và điều phối ca khám theo thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số lịch hẹn</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs bg-sky-50/30">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Chờ tiếp đón</p>
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

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Mã lịch, tên BN, mã BN, SĐT..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(0);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            {date && (
              <button
                onClick={() => {
                  setDate('');
                  setPage(0);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 border border-slate-200 rounded-xl bg-slate-50"
                title="Tất cả ngày"
              >
                Tất cả
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="BOOKED">Chờ tiếp đón (Đã xác nhận)</option>
              <option value="CHECKED_IN">Đã tiếp đón</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="NO_SHOW">Vắng mặt</option>
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <select
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="">Tất cả bác sĩ</option>
              {doctorOptions.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fullName} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCwIcon className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-3 font-medium">Đang tải lịch hẹn toàn viện...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarCheckIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Không tìm thấy lịch hẹn nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không có dữ liệu phù hợp với điều kiện tìm kiếm. Hãy thử điều chỉnh ngày hoặc bộ lọc.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Mã lịch hẹn</th>
                  <th className="py-3 px-4">Người bệnh</th>
                  <th className="py-3 px-4">Ca khám & Bác sĩ</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => {
                  const hasEncounter = appt.encounterId != null || appt.encounterStatus != null;
                  const isBooked = appt.status === 'BOOKED';
                  const isCheckedIn = appt.status === 'CHECKED_IN';
                  const isEligibleCheckInDate = isSlotToday(appt.slot?.startsAt);

                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/80 transition">
                      {/* Mã lịch hẹn */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {appt.appointmentCode}
                        {appt.bookingSource && (
                          <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                            {appt.bookingSource}
                          </div>
                        )}
                      </td>

                      {/* Người bệnh */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {appt.patient?.fullName || 'Bệnh nhân'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {appt.patient?.patientCode || '--'} • {appt.patient?.phone || '--'}
                        </div>
                      </td>

                      {/* Ca khám & Bác sĩ */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {appt.doctor?.fullName || appt.slot?.doctorName || 'Bác sĩ'}
                        </div>
                        <div className="text-[11px] text-sky-600 font-medium">
                          {appt.doctor?.specialization || appt.slot?.specialization || 'Chuyên khoa'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3 text-slate-400" />
                          <span>
                            {formatTimeOnly(appt.slot?.startsAt)} - {formatTimeOnly(appt.slot?.endsAt)} ({formatDateOnly(appt.slot?.startsAt)})
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        <div>{renderStatusBadge(appt)}</div>
                        {appt.checkedInAt && (
                          <div className="text-[10px] text-emerald-600 font-medium mt-1">
                            Tiếp đón: {formatTimeOnly(appt.checkedInAt)}
                          </div>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Chi tiết button */}
                          <button
                            onClick={() => setDetailModal(appt)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                            title="Xem chi tiết"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>

                          {/* Encounter Guard */}
                          {hasEncounter ? (
                            <span className="text-[10px] font-semibold text-slate-400 px-2 py-1 bg-slate-100 rounded-md">
                              Đang/Đã khám (Khóa)
                            </span>
                          ) : (
                            <>
                              {/* If BOOKED: Tiếp đón (Check-in), Đổi lịch (Reschedule), Hủy hẹn (Cancel) */}
                              {isBooked && (
                                <>
                                  <button
                                    onClick={() => {
                                      if (!isEligibleCheckInDate) {
                                        showToast('error', 'Chỉ được tiếp đón (check-in) các lịch hẹn thuộc ngày hôm nay.');
                                        return;
                                      }
                                      setCheckInModal(appt);
                                      setActionError('');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
                                  >
                                    Tiếp đón
                                  </button>

                                  <button
                                    onClick={() => handleOpenReschedule(appt)}
                                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition"
                                  >
                                    Đổi lịch
                                  </button>

                                  <button
                                    onClick={() => {
                                      setCancelModal(appt);
                                      setCancelReason('');
                                      setActionError('');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition"
                                  >
                                    Hủy hẹn
                                  </button>
                                </>
                              )}

                              {/* If CHECKED_IN: Hoàn tác tiếp đón */}
                              {isCheckedIn && (
                                <button
                                  onClick={() => {
                                    setUndoModal(appt);
                                    setActionError('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs transition"
                                >
                                  Hoàn tác
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer / Pagination */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Hiển thị <strong>{appointments.length}</strong> trên tổng số <strong>{total}</strong> cuộc hẹn
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Trang trước
            </button>
            <span className="px-2 font-bold text-slate-700">Trang {page + 1}</span>
            <button
              disabled={(page + 1) * size >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* ==================== DETAIL MODAL ==================== */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chi tiết Hồ sơ Lịch hẹn</h3>
                <p className="text-xs font-mono text-slate-500">{detailModal.appointmentCode}</p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Patient Profile */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Thông tin Người bệnh</p>
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="text-slate-400">Họ và tên:</span> <strong className="text-slate-800">{detailModal.patient?.fullName}</strong></p>
                  <p><span className="text-slate-400">Mã bệnh nhân:</span> <span className="font-mono">{detailModal.patient?.patientCode || '--'}</span></p>
                  <p><span className="text-slate-400">Số điện thoại:</span> {detailModal.patient?.phone || '--'}</p>
                  <p><span className="text-slate-400">Email:</span> {detailModal.patient?.contactEmail || '--'}</p>
                </div>
              </div>

              {/* Doctor & Slot */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Bác sĩ & Ca khám</p>
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="text-slate-400">Bác sĩ:</span> <strong className="text-slate-800">{detailModal.doctor?.fullName || detailModal.slot?.doctorName}</strong></p>
                  <p><span className="text-slate-400">Chuyên khoa:</span> <span className="text-sky-600 font-semibold">{detailModal.doctor?.specialization || detailModal.slot?.specialization}</span></p>
                  <p><span className="text-slate-400">Khung giờ:</span> {formatTimeOnly(detailModal.slot?.startsAt)} - {formatTimeOnly(detailModal.slot?.endsAt)}</p>
                  <p><span className="text-slate-400">Ngày khám:</span> {formatDateOnly(detailModal.slot?.startsAt)}</p>
                </div>
              </div>

              {/* Status & Encounter */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Trạng thái & Tiếp nhận</p>
                <div className="flex items-center justify-between">
                  <span>Trạng thái lịch hẹn:</span>
                  <div>{renderStatusBadge(detailModal)}</div>
                </div>
                {detailModal.checkedInAt && (
                  <p className="text-emerald-700">Đã tiếp đón lúc: {formatDateTime(detailModal.checkedInAt)}</p>
                )}
                {detailModal.encounterId && (
                  <p className="text-purple-700">
                    Mã ca khám (Encounter): #{detailModal.encounterId} ({detailModal.encounterStatus || 'IN_PROGRESS'})
                  </p>
                )}
                {detailModal.reason && (
                  <div>
                    <span className="text-slate-400">Lý do khám / Triệu chứng:</span>
                    <p className="text-slate-800 font-medium mt-0.5">{detailModal.reason}</p>
                  </div>
                )}
                {detailModal.note && (
                  <div>
                    <span className="text-slate-400">Ghi chú:</span>
                    <p className="text-slate-800 font-medium mt-0.5">{detailModal.note}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHECK-IN MODAL ==================== */}
      {checkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận Tiếp đón</h3>
                <p className="text-xs text-slate-500">Check-in vào hàng chờ khám bệnh</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <p><span className="text-slate-400">Mã lịch hẹn:</span> <strong className="text-slate-900 font-mono">{checkInModal.appointmentCode}</strong></p>
              <p><span className="text-slate-400">Bệnh nhân:</span> <strong className="text-slate-900">{checkInModal.patient?.fullName}</strong></p>
              <p><span className="text-slate-400">Bác sĩ khám:</span> {checkInModal.doctor?.fullName || checkInModal.slot?.doctorName}</p>
              <p><span className="text-slate-400">Khung giờ:</span> {formatTimeOnly(checkInModal.slot?.startsAt)} - {formatTimeOnly(checkInModal.slot?.endsAt)}</p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCheckInModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmCheckIn}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận tiếp đón'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== UNDO CHECK-IN MODAL ==================== */}
      {undoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircleIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hoàn tác Tiếp đón</h3>
                <p className="text-xs text-slate-500">Đưa lịch hẹn trở về trạng thái Chờ tiếp đón</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn hoàn tác tiếp đón cho bệnh nhân <strong>{undoModal.patient?.fullName}</strong> ({undoModal.appointmentCode})? 
              Trạng thái sẽ quay lại <strong>BOOKED</strong>.
            </p>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUndoModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmUndo}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {actionLoading ? 'Đang hoàn tác...' : 'Xác nhận hoàn tác'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CANCEL MODAL ==================== */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertCircleIcon className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hủy Lịch Hẹn tại Quầy</h3>
                <p className="text-xs text-slate-500">Đặc quyền lễ tân không giới hạn thời gian 24h</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <p><span className="text-slate-400">Mã lịch hẹn:</span> <strong className="text-slate-900 font-mono">{cancelModal.appointmentCode}</strong></p>
              <p><span className="text-slate-400">Bệnh nhân:</span> <strong className="text-slate-900">{cancelModal.patient?.fullName}</strong></p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lý do hủy (Tùy chọn)</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Bệnh nhân báo hủy tại quầy..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {actionLoading ? 'Đang hủy...' : 'Xác nhận hủy hẹn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RESCHEDULE MODAL ==================== */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sky-600">
                <CalendarIcon className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Đổi Lịch Hẹn tại Quầy</h3>
              </div>
              <button
                onClick={() => setRescheduleModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <p><span className="text-slate-400">Mã lịch hẹn:</span> <strong className="text-slate-900 font-mono">{rescheduleModal.appointmentCode}</strong></p>
              <p><span className="text-slate-400">Bệnh nhân:</span> <strong className="text-slate-900">{rescheduleModal.patient?.fullName}</strong></p>
              <p><span className="text-slate-400">Bác sĩ:</span> {rescheduleModal.doctor?.fullName || rescheduleModal.slot?.doctorName}</p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chọn ngày khám mới <span className="text-sky-500">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={rescheduleDate}
                onChange={(e) => handleRescheduleDateChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Slots */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Khung giờ khả dụng của Bác sĩ <span className="text-sky-500">*</span>
              </label>
              {slotsLoading ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                  <RefreshCwIcon className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Đang tải ca khám...</span>
                </div>
              ) : rescheduleSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                  Không có ca khám khả dụng ngày này. Vui lòng chọn ngày khác.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {rescheduleSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const isPast = slot.endsAt && new Date(slot.endsAt) <= new Date();
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

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={actionLoading || !selectedSlotId}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {actionLoading ? 'Đang cập nhật...' : 'Xác nhận đổi lịch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
