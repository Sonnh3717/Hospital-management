import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { receptionApi } from '../../services/api';
import {
  UserGroupIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  EyeIcon,
  EditIcon,
  LockIcon,
  UnlockIcon,
  PlusIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
} from '../../components/common/Icons';

export default function ReceptionPatientsPage() {
  // Query & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'NO_ACCOUNT'
  const [page, setPage] = useState(0);
  const size = 20;

  // Data
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null); // { patient, nextStatus }

  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [createForm, setCreateForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    address: '',
    contactEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    address: '',
    contactEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Fetch Patients
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
      };
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await receptionApi.listPatients(params);
      const items = res?.data?.items || res?.items || (Array.isArray(res?.data) ? res.data : []);
      const totalCount = res?.data?.total ?? res?.total ?? items.length;
      setPatients(items);
      setTotal(totalCount);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Không thể tải danh sách bệnh nhân.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  // Format Helpers
  const formatDate = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Filtered by Account Status client-side
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (statusFilter === 'ACTIVE') {
        return p.accountStatus === 'ACTIVE';
      }
      if (statusFilter === 'INACTIVE') {
        return p.accountStatus === 'INACTIVE';
      }
      if (statusFilter === 'NO_ACCOUNT') {
        return p.userAccountId == null;
      }
      return true;
    });
  }, [patients, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const active = patients.filter((p) => p.accountStatus === 'ACTIVE').length;
    const inactive = patients.filter((p) => p.accountStatus === 'INACTIVE').length;
    const noAccount = patients.filter((p) => p.userAccountId == null).length;
    return {
      total: total || patients.length,
      active,
      inactive,
      noAccount,
    };
  }, [patients, total]);

  // Gender badge
  const renderGenderBadge = (gender) => {
    switch (gender) {
      case 'MALE':
        return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">Nam</span>;
      case 'FEMALE':
        return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Nữ</span>;
      default:
        return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Khác</span>;
    }
  };

  // Account status badge
  const renderAccountBadge = (patient) => {
    if (patient.userAccountId == null) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Chưa có TK online
        </span>
      );
    }
    if (patient.accountStatus === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Hoạt động
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <LockIcon className="w-3 h-3 text-rose-600" />
        Đã khóa
      </span>
    );
  };

  // Initial Avatar initials
  const getInitials = (name) => {
    if (!name) return 'BN';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // ---------------- ACTION HANDLERS ----------------

  // Open Create
  const handleOpenCreate = () => {
    setCreateForm({
      fullName: '',
      dateOfBirth: '',
      gender: 'MALE',
      phone: '',
      address: '',
      contactEmail: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    });
    setFormError('');
    setCreateModalOpen(true);
  };

  // Submit Create
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    // Phone validation
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(createForm.phone.trim())) {
      setFormError('Số điện thoại không hợp lệ (10-11 chữ số, bắt đầu bằng 0 hoặc +84).');
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        fullName: createForm.fullName.trim(),
        dateOfBirth: createForm.dateOfBirth,
        gender: createForm.gender,
        phone: createForm.phone.trim(),
        address: createForm.address.trim(),
        contactEmail: createForm.contactEmail.trim() || null,
        emergencyContactName: createForm.emergencyContactName.trim() || null,
        emergencyContactPhone: createForm.emergencyContactPhone.trim() || null,
      };

      const res = await receptionApi.createPatient(payload);
      showToast('success', `Tạo hồ sơ bệnh nhân ${res?.data?.fullName || payload.fullName} thành công.`);
      setCreateModalOpen(false);
      fetchPatients();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Không thể tạo mới bệnh nhân.');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit
  const handleOpenEdit = async (patient) => {
    try {
      const res = await receptionApi.getPatientDetail(patient.id);
      const detail = res?.data || res;
      setEditModal(detail);
      setEditForm({
        fullName: detail.fullName || '',
        dateOfBirth: detail.dateOfBirth ? String(detail.dateOfBirth).split('T')[0] : '',
        gender: detail.gender || 'MALE',
        phone: detail.phone || '',
        address: detail.address || '',
        contactEmail: detail.contactEmail || '',
        emergencyContactName: detail.emergencyContactName || '',
        emergencyContactPhone: detail.emergencyContactPhone || '',
      });
      setFormError('');
    } catch (err) {
      showToast('error', 'Không thể lấy thông tin chi tiết bệnh nhân để sửa.');
    }
  };

  // Submit Edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    setFormLoading(true);
    setFormError('');

    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(editForm.phone.trim())) {
      setFormError('Số điện thoại không hợp lệ (10-11 chữ số, bắt đầu bằng 0 hoặc +84).');
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        contactEmail: editForm.contactEmail.trim() || null,
        emergencyContactName: editForm.emergencyContactName.trim() || null,
        emergencyContactPhone: editForm.emergencyContactPhone.trim() || null,
      };

      await receptionApi.updatePatient(editModal.id, payload);
      showToast('success', `Cập nhật thông tin bệnh nhân ${payload.fullName} thành công.`);
      setEditModal(null);
      fetchPatients();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Không thể cập nhật hồ sơ bệnh nhân.');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Detail
  const handleOpenDetail = async (patient) => {
    try {
      const res = await receptionApi.getPatientDetail(patient.id);
      setDetailModal(res?.data || res);
    } catch (err) {
      showToast('error', 'Không thể lấy thông tin chi tiết bệnh nhân.');
    }
  };

  // Open Status Toggle
  const handleOpenStatusToggle = (patient) => {
    if (patient.userAccountId == null) return;
    const nextStatus = patient.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusModal({ patient, nextStatus });
    setFormError('');
  };

  // Confirm Status Toggle
  const handleConfirmStatusToggle = async () => {
    if (!statusModal) return;
    setFormLoading(true);
    setFormError('');
    try {
      await receptionApi.updatePatientStatus(statusModal.patient.id, statusModal.nextStatus);
      showToast(
        'success',
        `Đã ${statusModal.nextStatus === 'ACTIVE' ? 'kích hoạt' : 'khóa'} tài khoản bệnh nhân ${statusModal.patient.fullName} thành công.`
      );
      setStatusModal(null);
      fetchPatients();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
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
          <h1 className="text-2xl font-bold text-slate-900">Quản lý hồ sơ bệnh nhân</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu, cập nhật thông tin nhân khẩu và kiểm soát quyền truy cập tài khoản người bệnh
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-500 shadow-sm transition"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Thêm mới bệnh nhân</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số hồ sơ</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs bg-emerald-50/30">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Đang hoạt động</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{metrics.active}</p>
        </div>
        <div className="bg-white rounded-2xl border border-rose-100 p-4 shadow-xs bg-rose-50/30">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Đã khóa</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{metrics.inactive}</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-xs bg-amber-50/30">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Chưa có TK online</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{metrics.noAccount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Tìm theo mã bệnh nhân, họ tên, số điện thoại, email..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Hoạt động' },
              { id: 'INACTIVE', label: 'Đã khóa' },
              { id: 'NO_ACCOUNT', label: 'Chưa có TK online' },
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

      {/* Patient Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCwIcon className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-3 font-medium">Đang tải danh sách hồ sơ bệnh nhân...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Không tìm thấy bệnh nhân nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL'
                ? 'Không có kết quả khớp với điều kiện tìm kiếm hiện tại.'
                : 'Chưa có hồ sơ bệnh nhân nào. Bạn có thể nhấn nút "Thêm mới bệnh nhân" để bắt đầu.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Mã bệnh nhân</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Ngày sinh & Giới tính</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4">Địa chỉ</th>
                  <th className="py-3 px-4">Trạng thái tài khoản</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => {
                  const hasOnlineAccount = patient.userAccountId != null;

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/80 transition">
                      {/* Mã BN */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <span className="bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                          {patient.patientCode}
                        </span>
                      </td>

                      {/* Họ tên */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {getInitials(patient.fullName)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{patient.fullName}</div>
                            {patient.username && (
                              <div className="text-[10px] text-slate-400">@{patient.username}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Ngày sinh & Giới tính */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{formatDate(patient.dateOfBirth)}</div>
                        <div className="mt-1">{renderGenderBadge(patient.gender)}</div>
                      </td>

                      {/* Liên hệ */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{patient.phone}</div>
                        {patient.contactEmail ? (
                          <div className="text-[11px] text-slate-400 mt-0.5">{patient.contactEmail}</div>
                        ) : (
                          <div className="text-[11px] text-slate-300 italic mt-0.5">Không có email</div>
                        )}
                      </td>

                      {/* Địa chỉ */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate text-slate-700" title={patient.address}>
                          {patient.address || '--'}
                        </div>
                      </td>

                      {/* Trạng thái tài khoản */}
                      <td className="py-3.5 px-4">
                        {renderAccountBadge(patient)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Xem chi tiết */}
                          <button
                            onClick={() => handleOpenDetail(patient)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                            title="Xem chi tiết"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>

                          {/* Sửa thông tin */}
                          <button
                            onClick={() => handleOpenEdit(patient)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                            title="Chỉnh sửa thông tin"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>

                          {/* Khóa/Kích hoạt toggle */}
                          {hasOnlineAccount ? (
                            <button
                              onClick={() => handleOpenStatusToggle(patient)}
                              className={`p-1.5 rounded-lg transition ${
                                patient.accountStatus === 'ACTIVE'
                                  ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-rose-600 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={patient.accountStatus === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                            >
                              {patient.accountStatus === 'ACTIVE' ? (
                                <LockIcon className="w-4 h-4" />
                              ) : (
                                <UnlockIcon className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-slate-300 cursor-not-allowed"
                              title="Bệnh nhân vãng lai chưa có tài khoản trực tuyến"
                            >
                              <LockIcon className="w-4 h-4 opacity-40" />
                            </span>
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
            Hiển thị <strong>{filteredPatients.length}</strong> trên tổng số <strong>{total}</strong> bệnh nhân
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

      {/* ==================== CREATE MODAL ==================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <PlusIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Thêm Mới Hồ Sơ Bệnh Nhân (Tiếp đón tại Quầy)</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Họ tên */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên bệnh nhân <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={createForm.dateOfBirth}
                    onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa chỉ Email (Tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={createForm.contactEmail}
                    onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                    placeholder="patient@example.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa chỉ cư trú <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="Số nhà, đường, phường/xã..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Người liên hệ khẩn cấp */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Người liên hệ khẩn cấp (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={createForm.emergencyContactName}
                    onChange={(e) => setCreateForm({ ...createForm, emergencyContactName: e.target.value })}
                    placeholder="Tên người thân/người giám hộ..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* SĐT liên hệ khẩn cấp */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    SĐT liên hệ khẩn cấp (Tùy chọn)
                  </label>
                  <input
                    type="tel"
                    value={createForm.emergencyContactPhone}
                    onChange={(e) => setCreateForm({ ...createForm, emergencyContactPhone: e.target.value })}
                    placeholder="0909888777"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {formLoading ? 'Đang tạo...' : 'Lưu hồ sơ bệnh nhân'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <EditIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cập Nhật Thông Tin Bệnh Nhân</h3>
                  <p className="text-xs font-mono text-slate-500">{editModal.patientCode}</p>
                </div>
              </div>
              <button
                onClick={() => setEditModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Họ tên */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên bệnh nhân <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa chỉ Email (Tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={editForm.contactEmail}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa chỉ cư trú <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Người liên hệ khẩn cấp */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Người liên hệ khẩn cấp (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={editForm.emergencyContactName}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* SĐT liên hệ khẩn cấp */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    SĐT liên hệ khẩn cấp (Tùy chọn)
                  </label>
                  <input
                    type="tel"
                    value={editForm.emergencyContactPhone}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {formLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hồ Sơ Chi Tiết Người Bệnh</h3>
                <p className="text-xs font-mono text-slate-500">{detailModal.patientCode}</p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Demographics */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Nhân khẩu học</p>
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="text-slate-400">Họ và tên:</span> <strong className="text-slate-900">{detailModal.fullName}</strong></p>
                  <p><span className="text-slate-400">Giới tính:</span> {renderGenderBadge(detailModal.gender)}</p>
                  <p><span className="text-slate-400">Ngày sinh:</span> {formatDate(detailModal.dateOfBirth)}</p>
                  <p><span className="text-slate-400">Mã hồ sơ:</span> <span className="font-mono">{detailModal.patientCode}</span></p>
                </div>
              </div>

              {/* Contact */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Thông tin liên lạc</p>
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="text-slate-400">Số điện thoại:</span> <strong className="text-slate-900">{detailModal.phone}</strong></p>
                  <p><span className="text-slate-400">Email:</span> {detailModal.contactEmail || '--'}</p>
                  <p className="col-span-2"><span className="text-slate-400">Địa chỉ:</span> {detailModal.address}</p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Người liên hệ khẩn cấp</p>
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="text-slate-400">Họ tên:</span> {detailModal.emergencyContactName || '--'}</p>
                  <p><span className="text-slate-400">SĐT:</span> {detailModal.emergencyContactPhone || '--'}</p>
                </div>
              </div>

              {/* Account Status */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Tài khoản cổng thông tin</p>
                <div className="flex items-center justify-between">
                  <span>Trạng thái tài khoản:</span>
                  <div>{renderAccountBadge(detailModal)}</div>
                </div>
                {detailModal.username && (
                  <p><span className="text-slate-400">Tên đăng nhập:</span> <strong className="font-mono">@{detailModal.username}</strong></p>
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

      {/* ==================== STATUS CONFIRM MODAL ==================== */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className={`flex items-center gap-3 ${statusModal.nextStatus === 'INACTIVE' ? 'text-rose-600' : 'text-emerald-600'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusModal.nextStatus === 'INACTIVE' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                {statusModal.nextStatus === 'INACTIVE' ? (
                  <LockIcon className="w-6 h-6 text-rose-600" />
                ) : (
                  <UnlockIcon className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {statusModal.nextStatus === 'INACTIVE' ? 'Khóa Tài Khoản Bệnh Nhân' : 'Kích Hoạt Tài Khoản'}
                </h3>
                <p className="text-xs text-slate-500">Cập nhật quyền đăng nhập vào Cổng Bệnh nhân</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {statusModal.nextStatus === 'INACTIVE' ? (
                <>
                  Bạn có chắc chắn muốn <strong>khóa tài khoản</strong> của bệnh nhân <strong>{statusModal.patient.fullName}</strong>? Người bệnh sẽ không thể đăng nhập hoặc thao tác trên Cổng bệnh nhân.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn <strong>kích hoạt lại</strong> tài khoản cho bệnh nhân <strong>{statusModal.patient.fullName}</strong>?
                </>
              )}
            </p>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmStatusToggle}
                disabled={formLoading}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition disabled:opacity-50 ${
                  statusModal.nextStatus === 'INACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {formLoading ? 'Đang cập nhật...' : statusModal.nextStatus === 'INACTIVE' ? 'Xác nhận khóa' : 'Xác nhận kích hoạt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
