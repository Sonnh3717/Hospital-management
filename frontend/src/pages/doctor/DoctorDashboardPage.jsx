import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi } from '../../services/api';
import {
  StethoscopeIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClipboardListIcon,
  ActivityIcon,
  SearchIcon,
  RefreshCwIcon,
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  XIcon,
  UserIcon,
  PrinterIcon,
} from '../../components/common/Icons';

// Presets ICD-10 chuyên khoa Da Liễu
const DERM_ICD10_PRESETS = [
  { code: 'L70.0', text: 'Mụn trứng cá thông thường (Acne vulgaris)' },
  { code: 'L20.9', text: 'Viêm da cơ địa dị ứng (Atopic dermatitis)' },
  { code: 'L21.0', text: 'Viêm da tiết bã da đầu & mặt (Seborrhoeic dermatitis)' },
  { code: 'L40.0', text: 'Vảy nến thể mảng thông thường (Psoriasis vulgaris)' },
  { code: 'L50.0', text: 'Mề đay dị ứng cấp tính (Allergic urticaria)' },
  { code: 'B35.4', text: 'Nấm da thân / Hắc lào (Tinea corporis)' },
  { code: 'B35.1', text: 'Nấm móng (Tinea unguium)' },
  { code: 'L82', text: 'Dày sừng tiết bã (Seborrhoeic keratosis)' },
  { code: 'L80', text: 'Bạch biến (Vitiligo)' },
  { code: 'L90.5', text: 'Sẹo teo và xơ sẹo sau mụn (Scar condition and fibrosis of skin)' },
];

export default function DoctorDashboardPage() {
  const { user } = useAuth();

  // Helper: Normalize UTC ISO string from backend & convert to local browser time (UTC+7)
  const parseUtcDate = (isoString) => {
    if (!isoString) return null;
    let s = String(isoString);
    if (!s.endsWith('Z') && !s.includes('+') && s.includes('T')) {
      s += 'Z';
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '--';
    const d = parseUtcDate(isoString);
    if (!d) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  const formatDateOnly = (isoString) => {
    if (!isoString) return '--';
    const d = parseUtcDate(isoString);
    if (!d) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '--';
    const d = parseUtcDate(isoString);
    if (!d) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} - ${day}/${month}/${year}`;
  };

  // Worklist filter state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');
  const [worklistItems, setWorklistItems] = useState([]);
  const [loadingWorklist, setLoadingWorklist] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Active Encounter Workbench state
  const [activeEncounterId, setActiveEncounterId] = useState(null);
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [loadingEncounter, setLoadingEncounter] = useState(false);
  const [workbenchTab, setWorkbenchTab] = useState('EXAM'); // 'EXAM' | 'REQUESTS' | 'TREATMENT' | 'HISTORY'

  // Service catalogue for requests
  const [catalogue, setCatalogue] = useState([]);

  // Form states for active encounter
  // 1. Examination & Diagnoses
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnoses, setDiagnoses] = useState([]);
  const [newDiagCode, setNewDiagCode] = useState('');
  const [newDiagText, setNewDiagText] = useState('');
  const [newDiagPrimary, setNewDiagPrimary] = useState(false);
  const [savingExam, setSavingExam] = useState(false);

  // 2. Service Requests
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [requestPriority, setRequestPriority] = useState('ROUTINE');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [reviewDecisions, setReviewDecisions] = useState({});
  const [submittingReview, setSubmittingReview] = useState(null);

  // 3. Treatment & Prescription
  const [decisionText, setDecisionText] = useState('');
  const [instructions, setInstructions] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpReason, setFollowUpReason] = useState('Tái khám đánh giá đáp ứng phác đồ');
  const [followUpFromDate, setFollowUpFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [followUpToDate, setFollowUpToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().split('T')[0];
  });
  const [followUpPriority, setFollowUpPriority] = useState('ROUTINE');
  const [savingTreatment, setSavingTreatment] = useState(false);

  // 4. Patient History
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 5. Complete Encounter Modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingEncounter, setCompletingEncounter] = useState(false);

  // Fetch worklist
  const fetchWorklist = useCallback(async () => {
    setLoadingWorklist(true);
    setActionError('');
    try {
      const res = await doctorApi.getWorklist({
        date: selectedDate,
        page: 0,
        size: 50,
      });
      const items = res?.items || res?.content || (Array.isArray(res) ? res : []);
      setWorklistItems(items);
    } catch (err) {
      console.error('Lỗi tải danh sách ca khám:', err);
      setActionError(err.response?.data?.message || 'Không thể tải danh sách ca khám của bác sĩ.');
    } finally {
      setLoadingWorklist(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchWorklist();
  }, [fetchWorklist]);

  // Fetch catalogue once
  useEffect(() => {
    const loadCatalogue = async () => {
      try {
        const res = await doctorApi.getCatalogue();
        const list = Array.isArray(res) ? res : (res?.data || []);
        setCatalogue(list);
        if (list.length > 0) {
          setSelectedServiceId(String(list[0].id));
        }
      } catch (err) {
        console.error('Lỗi tải danh mục kỹ thuật/dịch vụ:', err);
      }
    };
    loadCatalogue();
  }, []);

  // Sync encounter form state whenever activeEncounter changes
  const syncEncounterData = (enc) => {
    if (!enc) return;
    setChiefComplaint(enc.chiefComplaint || '');
    setSymptoms(enc.symptoms || '');
    setClinicalFindings(enc.clinicalFindings || '');
    setClinicalNotes(enc.clinicalNotes || '');
    setDiagnoses(
      (enc.diagnoses || []).map((d) => ({
        id: d.id,
        diagnosisCode: d.diagnosisCode || '',
        diagnosisText: d.diagnosisText || '',
        primary: !!d.primary,
      }))
    );

    if (enc.treatment) {
      setDecisionText(enc.treatment.decisionText || '');
      setInstructions(enc.treatment.instructions || '');
      setFollowUpRequired(!!enc.treatment.followUpRequired);
    } else {
      setDecisionText('');
      setInstructions('');
      setFollowUpRequired(false);
    }

    if (enc.followUps && enc.followUps.length > 0) {
      const fu = enc.followUps[0];
      setFollowUpReason(fu.reason || 'Tái khám đánh giá đáp ứng phác đồ');
      setFollowUpFromDate(fu.requestedFromDate || '');
      setFollowUpToDate(fu.requestedToDate || '');
      setFollowUpPriority(fu.priority || 'ROUTINE');
    }
  };

  // Load encounter details
  const openEncounter = async (encounterId) => {
    setActiveEncounterId(encounterId);
    setLoadingEncounter(true);
    setActionError('');
    try {
      const enc = await doctorApi.getEncounter(encounterId);
      setActiveEncounter(enc);
      syncEncounterData(enc);
      setWorkbenchTab('EXAM');
    } catch (err) {
      console.error('Lỗi mở bệnh án:', err);
      setActionError(err.response?.data?.message || 'Không thể tải chi tiết ca khám.');
      setActiveEncounterId(null);
    } finally {
      setLoadingEncounter(false);
    }
  };

  // Start encounter from waiting appointment
  const handleStartEncounter = async (apptId) => {
    setActionError('');
    setLoadingWorklist(true);
    try {
      const startRes = await doctorApi.startEncounter(apptId);
      const encId = startRes.encounterId;
      setSuccessToast('Đã khởi tạo phiên khám bệnh thành công!');
      setTimeout(() => setSuccessToast(''), 3000);
      await fetchWorklist();
      await openEncounter(encId);
    } catch (err) {
      console.error('Lỗi khởi tạo ca khám:', err);
      setActionError(err.response?.data?.message || 'Không thể bắt đầu ca khám.');
      setLoadingWorklist(false);
    }
  };

  // Close encounter workbench
  const handleCloseWorkbench = () => {
    setActiveEncounterId(null);
    setActiveEncounter(null);
    fetchWorklist();
  };

  // Load patient history when tab switched
  useEffect(() => {
    if (workbenchTab === 'HISTORY' && activeEncounterId) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const hist = await doctorApi.getPatientHistory(activeEncounterId);
          setPatientHistory(Array.isArray(hist) ? hist : []);
        } catch (err) {
          console.error('Lỗi tải lịch sử bệnh nhân:', err);
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [workbenchTab, activeEncounterId]);

  // Save Examination & Diagnoses
  const handleSaveExamination = async () => {
    if (!activeEncounterId) return;
    setSavingExam(true);
    setActionError('');
    try {
      const payload = {
        chiefComplaint: chiefComplaint.trim(),
        symptoms: symptoms.trim(),
        clinicalFindings: clinicalFindings.trim(),
        clinicalNotes: clinicalNotes.trim(),
        diagnoses: diagnoses.map((d) => ({
          id: d.id || null,
          diagnosisCode: d.diagnosisCode,
          diagnosisText: d.diagnosisText,
          primary: !!d.primary,
        })),
      };
      const updated = await doctorApi.saveExamination(activeEncounterId, payload);
      setActiveEncounter(updated);
      syncEncounterData(updated);
      setSuccessToast('Đã lưu thông tin khám lâm sàng và chẩn đoán thành công!');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.error('Lỗi lưu khám lâm sàng:', err);
      setActionError(err.response?.data?.message || 'Không thể lưu khám lâm sàng.');
    } finally {
      setSavingExam(false);
    }
  };

  // Add ICD-10 from preset
  const handleAddPresetDiagnosis = (preset) => {
    if (diagnoses.some((d) => d.diagnosisCode === preset.code)) return;
    const isFirst = diagnoses.length === 0;
    setDiagnoses([
      ...diagnoses,
      {
        diagnosisCode: preset.code,
        diagnosisText: preset.text,
        primary: isFirst,
      },
    ]);
  };

  // Add custom diagnosis
  const handleAddCustomDiagnosis = () => {
    if (!newDiagText.trim()) return;
    setDiagnoses([
      ...diagnoses,
      {
        diagnosisCode: newDiagCode.trim().toUpperCase(),
        diagnosisText: newDiagText.trim(),
        primary: newDiagPrimary || diagnoses.length === 0,
      },
    ]);
    setNewDiagCode('');
    setNewDiagText('');
    setNewDiagPrimary(false);
  };

  const handleRemoveDiagnosis = (index) => {
    const updated = diagnoses.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((d) => d.primary)) {
      updated[0].primary = true;
    }
    setDiagnoses(updated);
  };

  const handleSetPrimaryDiagnosis = (index) => {
    setDiagnoses(
      diagnoses.map((d, i) => ({
        ...d,
        primary: i === index,
      }))
    );
  };

  // Create Paraclinical Request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedServiceId || !activeEncounterId) return;
    setCreatingRequest(true);
    setActionError('');
    try {
      const idempotencyKey = 'REQ-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      const payload = {
        medicalServiceId: Number(selectedServiceId),
        priority: requestPriority,
        clinicalIndication: clinicalIndication.trim(),
        idempotencyKey,
      };
      const updated = await doctorApi.createServiceRequest(activeEncounterId, payload);
      setActiveEncounter(updated);
      setClinicalIndication('');
      setSuccessToast('Đã gửi chỉ định cận lâm sàng thành công!');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.error('Lỗi tạo chỉ định cận lâm sàng:', err);
      setActionError(err.response?.data?.message || 'Không thể tạo chỉ định cận lâm sàng.');
    } finally {
      setCreatingRequest(false);
    }
  };

  // Cancel Request
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy chỉ định này?')) return;
    setActionError('');
    try {
      const updated = await doctorApi.cancelServiceRequest(activeEncounterId, requestId, 'Bác sĩ hủy theo chỉ định');
      setActiveEncounter(updated);
      setSuccessToast('Đã hủy chỉ định dịch vụ thành công!');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.error('Lỗi hủy chỉ định:', err);
      setActionError(err.response?.data?.message || 'Không thể hủy chỉ định.');
    }
  };

  // Review Result
  const handleReviewResult = async (resultId) => {
    const decision = reviewDecisions[resultId];
    if (!decision || !decision.trim()) {
      alert('Vui lòng nhập ghi chú / đánh giá xử lý kết quả cận lâm sàng.');
      return;
    }
    setSubmittingReview(resultId);
    setActionError('');
    try {
      const updated = await doctorApi.reviewServiceResult(activeEncounterId, resultId, decision.trim());
      setActiveEncounter(updated);
      setSuccessToast('Đã xác nhận xử lý kết quả cận lâm sàng thành công!');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.error('Lỗi xác nhận kết quả:', err);
      setActionError(err.response?.data?.message || 'Không thể xác nhận kết quả.');
    } finally {
      setSubmittingReview(null);
    }
  };

  // Save Treatment & Prescription
  const handleSaveTreatment = async () => {
    if (!activeEncounterId) return;
    setSavingTreatment(true);
    setActionError('');
    try {
      const payload = {
        decisionText: decisionText.trim(),
        instructions: instructions.trim(),
        followUpRequired,
        followUp: followUpRequired
          ? {
              reason: followUpReason.trim(),
              requestedFromDate: followUpFromDate,
              requestedToDate: followUpToDate || null,
              priority: followUpPriority,
            }
          : null,
      };
      const updated = await doctorApi.saveTreatment(activeEncounterId, payload);
      setActiveEncounter(updated);
      syncEncounterData(updated);
      setSuccessToast('Đã lưu quyết định điều trị & đơn thuốc thành công!');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.error('Lỗi lưu quyết định điều trị:', err);
      setActionError(err.response?.data?.message || 'Không thể lưu quyết định điều trị.');
    } finally {
      setSavingTreatment(false);
    }
  };

  // Complete Encounter
  const handleCompleteEncounter = async () => {
    if (!activeEncounterId) return;
    setCompletingEncounter(true);
    setActionError('');
    try {
      const completed = await doctorApi.completeEncounter(activeEncounterId);
      setActiveEncounter(completed);
      setShowCompleteModal(false);
      setSuccessToast('ĐÃ HOÀN TẤT LƯỢT KHÁM BỆNH THÀNH CÔNG! Ca khám đã chuyển sang trạng thái Hoàn thành.');
      setTimeout(() => setSuccessToast(''), 5000);
      fetchWorklist();
    } catch (err) {
      console.error('Lỗi hoàn tất lượt khám:', err);
      const blockers = err.response?.data?.blockers;
      if (blockers && Array.isArray(blockers) && blockers.length > 0) {
        setActionError('Chưa thể hoàn tất: ' + blockers.join(', '));
      } else {
        setActionError(err.response?.data?.message || 'Không thể hoàn tất lượt khám bệnh.');
      }
      setShowCompleteModal(false);
    } finally {
      setCompletingEncounter(false);
    }
  };

  // Filtered worklist items
  const filteredItems = useMemo(() => {
    return worklistItems.filter((item) => {
      // Tab filter
      if (activeTab === 'WAITING' && item.processingStatus !== 'WAITING') return false;
      if (activeTab === 'IN_PROGRESS' && item.processingStatus !== 'IN_PROGRESS') return false;
      if (activeTab === 'COMPLETED' && item.processingStatus !== 'COMPLETED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (item.appointmentCode || '').toLowerCase();
        const pName = (item.patient?.fullName || '').toLowerCase();
        const phone = (item.patient?.phone || '').toLowerCase();
        return code.includes(q) || pName.includes(q) || phone.includes(q);
      }
      return true;
    });
  }, [worklistItems, activeTab, searchQuery]);

  // Metrics counts
  const metrics = useMemo(() => {
    const total = worklistItems.length;
    const waiting = worklistItems.filter((i) => i.processingStatus === 'WAITING').length;
    const inProgress = worklistItems.filter((i) => i.processingStatus === 'IN_PROGRESS').length;
    const completed = worklistItems.filter((i) => i.processingStatus === 'COMPLETED').length;
    return { total, waiting, inProgress, completed };
  }, [worklistItems]);

  // Is active encounter completed?
  const isEncounterCompleted = activeEncounter?.status === 'COMPLETED';

  return (
    <div className="w-full space-y-6">
      {/* Toast notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 shrink-0" />
            <span className="font-semibold text-sm">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="p-1 hover:bg-emerald-600 rounded-lg">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Action Error */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* CASE A: ACTIVE ENCOUNTER WORKBENCH VIEW                   */}
      {/* ========================================================= */}
      {activeEncounterId && activeEncounter ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Patient Clinical Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCloseWorkbench}
                  className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 text-xs font-bold"
                  title="Quay lại hàng chờ"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Hàng chờ</span>
                </button>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg">
                  {activeEncounter.patient?.fullName?.charAt(0) || 'BN'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{activeEncounter.patient?.fullName}</h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isEncounterCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {isEncounterCompleted ? 'Đã hoàn tất khám' : 'Đang khám lâm sàng'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>
                      Mã bệnh nhân:{' '}
                      <strong className="text-slate-700 font-mono">
                        {activeEncounter.patient?.patientCode || 'PAT-N/A'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Giới tính:{' '}
                      <strong className="text-slate-700">
                        {activeEncounter.patient?.gender === 'MALE'
                          ? 'Nam'
                          : activeEncounter.patient?.gender === 'FEMALE'
                          ? 'Nữ'
                          : 'Khác'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      SĐT: <strong className="text-slate-700">{activeEncounter.patient?.phone || 'Chưa có'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Mã lịch hẹn:{' '}
                      <strong className="text-sky-700 font-mono">{activeEncounter.appointmentCode}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Complete Encounter Action */}
              <div className="flex items-center gap-3">
                {isEncounterCompleted ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Lượt khám đã hoàn tất lúc {formatDateTime(activeEncounter.completedAt)}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition transform active:scale-95"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Hoàn tất lượt khám</span>
                  </button>
                )}
              </div>
            </div>

            {/* Blockers Checklist Alert (Only if in progress) */}
            {!isEncounterCompleted && activeEncounter.completionBlockers && activeEncounter.completionBlockers.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                  <AlertCircleIcon className="w-4 h-4 shrink-0" />
                  <span>Điều kiện để hoàn tất lượt khám (Quy chuẩn Bệnh viện Da liễu):</span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-amber-700">
                  {activeEncounter.completionBlockers.map((b, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation Tabs for Workbench */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
              <button
                onClick={() => setWorkbenchTab('EXAM')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  workbenchTab === 'EXAM'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <StethoscopeIcon className="w-4 h-4" />
                <span>1. Khám lâm sàng & Chẩn đoán</span>
                {diagnoses.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{diagnoses.length}</span>
                )}
              </button>

              <button
                onClick={() => setWorkbenchTab('REQUESTS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  workbenchTab === 'REQUESTS'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ActivityIcon className="w-4 h-4" />
                <span>2. Chỉ định Cận lâm sàng & Dịch vụ</span>
                {activeEncounter.requests && activeEncounter.requests.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                    {activeEncounter.requests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setWorkbenchTab('TREATMENT')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  workbenchTab === 'TREATMENT'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClipboardListIcon className="w-4 h-4" />
                <span>3. Kế hoạch Điều trị & Đơn thuốc</span>
                {activeEncounter.treatment && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                onClick={() => setWorkbenchTab('HISTORY')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  workbenchTab === 'HISTORY'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClockIcon className="w-4 h-4" />
                <span>4. Lịch sử khám bệnh</span>
              </button>
            </div>
          </div>

          {/* TAB 1: EXAMINATION & DIAGNOSIS */}
          {workbenchTab === 'EXAM' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Khám Lâm Sàng & Chẩn Đoán ICD-10</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ghi nhận triệu chứng, tổn thương thực thể và thiết lập mã bệnh da liễu
                  </p>
                </div>
                {!isEncounterCompleted && (
                  <button
                    onClick={handleSaveExamination}
                    disabled={savingExam}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>{savingExam ? 'Đang lưu...' : 'Lưu thông tin khám'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chief Complaint */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Lý do đến khám (Chief Complaint) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    disabled={isEncounterCompleted}
                    placeholder="VD: Ngứa rát vùng cánh mũi, nổi mụn bọc vùng trán 3 tuần..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:bg-slate-50"
                  />
                </div>

                {/* Symptoms */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Triệu chứng cơ năng (Symptoms) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    disabled={isEncounterCompleted}
                    placeholder="VD: Ngứa nhiều về đêm, cảm giác châm chích, đau rát khi rửa mặt..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:bg-slate-50"
                  />
                </div>

                {/* Clinical Findings */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Tổn thương thực thể / Khám lâm sàng (Clinical Findings) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={clinicalFindings}
                    onChange={(e) => setClinicalFindings(e.target.value)}
                    disabled={isEncounterCompleted}
                    placeholder="VD: Sẩn viêm đỏ đường kính 2-4mm, mụn mủ rải rác vùng má và cằm, da nhờn vùng chữ T, không có ổ áp-xe..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:bg-slate-50"
                  />
                </div>

                {/* Clinical Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Ghi chú chuyên môn (Clinical Notes)</label>
                  <textarea
                    rows={3}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    disabled={isEncounterCompleted}
                    placeholder="VD: Tiền sử kích ứng kem chống nắng, sinh hoạt thức khuya..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Diagnoses Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Chẩn đoán bệnh (ICD-10) <span className="text-rose-500">*</span>
                    </h4>
                    <p className="text-xs text-slate-500">Cần ít nhất 01 chẩn đoán xác định cho ca khám</p>
                  </div>
                </div>

                {/* Dermatology ICD-10 Quick Presets */}
                {!isEncounterCompleted && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Chọn nhanh bệnh lý da liễu phổ biến:</p>
                    <div className="flex flex-wrap gap-2">
                      {DERM_ICD10_PRESETS.map((preset) => {
                        const isAdded = diagnoses.some((d) => d.diagnosisCode === preset.code);
                        return (
                          <button
                            key={preset.code}
                            type="button"
                            onClick={() => handleAddPresetDiagnosis(preset)}
                            disabled={isAdded}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                              isAdded
                                ? 'bg-sky-100 text-sky-700 border border-sky-300 opacity-60 cursor-not-allowed'
                                : 'bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 border border-transparent'
                            }`}
                          >
                            <span className="font-bold font-mono text-[11px]">{preset.code}</span>
                            <span>{preset.text.split('(')[0].trim()}</span>
                            {isAdded && <CheckIcon className="w-3 h-3 text-sky-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Diagnoses Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4 w-24">Mã ICD-10</th>
                        <th className="py-2.5 px-4">Tên Chẩn đoán / Bệnh lý</th>
                        <th className="py-2.5 px-4 w-32 text-center">Chẩn đoán chính</th>
                        {!isEncounterCompleted && <th className="py-2.5 px-4 w-16 text-center">Xóa</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {diagnoses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                            Chưa có chẩn đoán nào. Vui lòng chọn từ danh sách trên hoặc nhập mới bên dưới.
                          </td>
                        </tr>
                      ) : (
                        diagnoses.map((diag, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-mono font-bold text-sky-700">
                              {diag.diagnosisCode || 'N/A'}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">{diag.diagnosisText}</td>
                            <td className="py-2.5 px-4 text-center">
                              {isEncounterCompleted ? (
                                diag.primary ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                    Chính
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Phụ</span>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryDiagnosis(idx)}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                                    diag.primary
                                      ? 'bg-emerald-500 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {diag.primary ? 'Chính' : 'Đặt làm chính'}
                                </button>
                              )}
                            </td>
                            {!isEncounterCompleted && (
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDiagnosis(idx)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                                >
                                  <XIcon className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Custom Diagnosis Input */}
                {!isEncounterCompleted && (
                  <div className="flex flex-col md:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Mã ICD-10 (VD: L70.8)"
                      value={newDiagCode}
                      onChange={(e) => setNewDiagCode(e.target.value)}
                      className="w-full md:w-36 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                    />
                    <input
                      type="text"
                      placeholder="Tên chẩn đoán tùy chỉnh..."
                      value={newDiagText}
                      onChange={(e) => setNewDiagText(e.target.value)}
                      className="w-full flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomDiagnosis}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition shrink-0"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Thêm chẩn đoán</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PARACLINICAL REQUESTS & RESULTS */}
          {workbenchTab === 'REQUESTS' && (
            <div className="space-y-6">
              {/* Request Creation Form */}
              {!isEncounterCompleted && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Chỉ Định Dịch Vụ Cận Lâm Sàng & Xét Nghiệm</h3>
                      <p className="text-xs text-slate-500">Soi da vi thể, sinh thiết mô da, xét nghiệm nấm, laser...</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateRequest} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Dịch vụ kỹ thuật / Xét nghiệm</label>
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500/20"
                      >
                        {catalogue.map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.serviceCode} - {svc.serviceName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Mức độ ưu tiên</label>
                      <select
                        value={requestPriority}
                        onChange={(e) => setRequestPriority(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option value="ROUTINE">Thường (ROUTINE)</option>
                        <option value="URGENT">Khẩn (URGENT)</option>
                        <option value="STAT">Tối khẩn (STAT)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-bold text-slate-700">Chỉ định lâm sàng / Vị trí tổn thương</label>
                      <input
                        type="text"
                        placeholder="VD: Soi tìm Demodex vùng cánh mũi, cạo vảy tìm vi nấm da thân..."
                        value={clinicalIndication}
                        onChange={(e) => setClinicalIndication(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div className="md:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={creatingRequest}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>{creatingRequest ? 'Đang gửi...' : 'Tạo chỉ định dịch vụ'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Requests List & Results Table */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Danh Sách Chỉ Định & Kết Quả</h3>

                {activeEncounter.requests && activeEncounter.requests.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 italic text-xs">
                    Chưa có chỉ định cận lâm sàng nào trong lượt khám này.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeEncounter.requests?.map((req) => {
                      const isCompleted = req.status === 'COMPLETED';
                      const isOrdered = req.status === 'ORDERED';
                      const isUnable = req.status === 'UNABLE_TO_PERFORM';
                      const result = req.result;
                      const hasReviewed = !!result?.review;

                      return (
                        <div
                          key={req.id}
                          className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-xs text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200">
                                {req.requestCode}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm">{req.service?.serviceName}</h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isUnable
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {req.status}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                {req.priority}
                              </span>
                            </div>

                            {isOrdered && !isEncounterCompleted && (
                              <button
                                onClick={() => handleCancelRequest(req.id)}
                                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-bold"
                              >
                                <XIcon className="w-3.5 h-3.5" />
                                <span>Hủy chỉ định</span>
                              </button>
                            )}
                          </div>

                          {req.clinicalIndication && (
                            <p className="text-xs text-slate-600">
                              <span className="font-semibold text-slate-700">Chỉ định:</span> {req.clinicalIndication}
                            </p>
                          )}

                          {/* Results section */}
                          {result && (
                            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                                  <span>Kết quả cận lâm sàng (Đã ghi nhận lúc {formatDateTime(result.finalizedAt)}):</span>
                                </span>
                                {result.attachmentUrl && (
                                  <a
                                    href={result.attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-sky-600 hover:text-sky-800 font-bold underline flex items-center gap-1"
                                  >
                                    <span>Tải file kết quả/hình ảnh</span>
                                  </a>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-slate-900">{result.resultSummary}</p>
                              {result.resultContent && (
                                <p className="text-xs text-slate-600 whitespace-pre-wrap">{result.resultContent}</p>
                              )}

                              {/* Doctor Review */}
                              <div className="pt-2 border-t border-slate-100">
                                {hasReviewed ? (
                                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold">
                                      <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Bác sĩ đã đánh giá xử lý kết quả:</span>
                                    </div>
                                    <p className="italic">"{result.review.handlingDecision}"</p>
                                  </div>
                                ) : (
                                  !isEncounterCompleted && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <input
                                        type="text"
                                        placeholder="Nhập ghi chú xử lý kết quả cận lâm sàng (VD: Đủ điều kiện kê đơn, tổn thương lành tính...)"
                                        value={reviewDecisions[result.id] || ''}
                                        onChange={(e) =>
                                          setReviewDecisions({ ...reviewDecisions, [result.id]: e.target.value })
                                        }
                                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                                      />
                                      <button
                                        onClick={() => handleReviewResult(result.id)}
                                        disabled={submittingReview === result.id}
                                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 shrink-0"
                                      >
                                        {submittingReview === result.id ? 'Đang xác nhận...' : 'Xác nhận xử lý'}
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TREATMENT & PRESCRIPTION */}
          {workbenchTab === 'TREATMENT' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Kế Hoạch Điều Trị & Toa Thuốc Điện Tử</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kê đơn thuốc da liễu, phác đồ điều trị và dặn dò tái khám
                  </p>
                </div>
                {!isEncounterCompleted && (
                  <button
                    onClick={handleSaveTreatment}
                    disabled={savingTreatment}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>{savingTreatment ? 'Đang lưu...' : 'Lưu kế hoạch điều trị'}</span>
                  </button>
                )}
              </div>

              {/* Treatment Decision Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Quyết định điều trị & Đơn thuốc <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  disabled={isEncounterCompleted}
                  placeholder="VD: 
1. Kem bôi Adapalene 0.1% (Differin) - Thoa lớp mỏng mỗi tối trước khi ngủ.
2. Gel bôi Benzoyl Peroxide 5% - Chấm điểm mụn viêm buổi sáng.
3. Sữa rửa mặt Cetaphil Gentle Cleanser - Rửa ngày 2 lần sáng/tối."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Lời dặn dò bệnh nhân & Chế độ chăm sóc da <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={isEncounterCompleted}
                  placeholder="VD: Thoa kem chống nắng phổ rộng SPF 50+ trước khi ra ngoài 20 phút. Tránh sờ nặn mụn, uống nhiều nước và ngủ trước 23h..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
                />
              </div>

              {/* Follow-up Required */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    disabled={isEncounterCompleted}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Yêu cầu tái khám (Cần thiết đối với ca điều trị theo đợt)
                  </span>
                </label>

                {followUpRequired && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-bold text-slate-700">Lý do tái khám</label>
                      <input
                        type="text"
                        value={followUpReason}
                        onChange={(e) => setFollowUpReason(e.target.value)}
                        disabled={isEncounterCompleted}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Từ ngày</label>
                      <input
                        type="date"
                        value={followUpFromDate}
                        onChange={(e) => setFollowUpFromDate(e.target.value)}
                        disabled={isEncounterCompleted}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Đến ngày</label>
                      <input
                        type="date"
                        value={followUpToDate}
                        onChange={(e) => setFollowUpToDate(e.target.value)}
                        disabled={isEncounterCompleted}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Mức độ ưu tiên</label>
                      <select
                        value={followUpPriority}
                        onChange={(e) => setFollowUpPriority(e.target.value)}
                        disabled={isEncounterCompleted}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      >
                        <option value="ROUTINE">Thường (ROUTINE)</option>
                        <option value="URGENT">Khẩn (URGENT)</option>
                        <option value="STAT">Tối khẩn (STAT)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PATIENT HISTORY */}
          {workbenchTab === 'HISTORY' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Lịch Sử Các Đợt Khám Trước Của Bệnh Nhân</h3>

              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-400">Đang tải lịch sử khám...</div>
              ) : patientHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  Chưa ghi nhận đợt khám nào trước đó của bệnh nhân này tại bệnh viện.
                </div>
              ) : (
                <div className="space-y-4">
                  {patientHistory.map((hist) => (
                    <div key={hist.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          Đợt khám ngày {formatDateTime(hist.startedAt)} - Bác sĩ phụ trách: {hist.doctor?.fullName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {hist.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Lý do khám:</span> {hist.chiefComplaint}
                      </p>
                      {hist.diagnoses && hist.diagnoses.length > 0 && (
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">Chẩn đoán:</span>{' '}
                          {hist.diagnoses.map((d) => `${d.diagnosisCode} - ${d.diagnosisText}`).join('; ')}
                        </p>
                      )}
                      {hist.treatment && (
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">Phác đồ:</span> {hist.treatment.decisionText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* CASE B: DOCTOR WORKLIST QUEUE VIEW                        */
        /* ========================================================= */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-sky-600 via-sky-700 to-indigo-800 p-8 text-white shadow-xl shadow-sky-500/10">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-sky-100 border border-white/15">
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>Bàn làm việc Bác sĩ Lâm sàng Da liễu</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Chào mừng, {user?.fullName || 'Bác sĩ chuyên khoa'}!
                </h1>
                <p className="text-sky-100/90 text-sm leading-relaxed">
                  Quản lý hàng đợi tiếp nhận, thực hiện khám lâm sàng da liễu, chỉ định kỹ thuật và hoàn tất vòng đời ca khám.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/15 border border-white/20 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
                />
                <button
                  onClick={fetchWorklist}
                  disabled={loadingWorklist}
                  className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition disabled:opacity-50"
                  title="Tải lại danh sách"
                >
                  <RefreshCwIcon className={`w-4 h-4 ${loadingWorklist ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng ca hôm nay</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chờ gọi khám</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{metrics.waiting}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Đang khám</p>
              <h3 className="text-2xl font-black text-sky-600 mt-1">{metrics.inProgress}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã hoàn thành</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{metrics.completed}</h3>
            </div>
          </div>

          {/* Worklist Filters & Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Tab Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({metrics.total})
                </button>
                <button
                  onClick={() => setActiveTab('WAITING')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'WAITING'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Chờ khám ({metrics.waiting})
                </button>
                <button
                  onClick={() => setActiveTab('IN_PROGRESS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'IN_PROGRESS'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                  }`}
                >
                  Đang khám ({metrics.inProgress})
                </button>
                <button
                  onClick={() => setActiveTab('COMPLETED')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'COMPLETED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Đã hoàn tất ({metrics.completed})
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-72">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên bệnh nhân, mã hẹn, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            {/* Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Mã Hẹn</th>
                    <th className="py-3 px-4">Bệnh nhân</th>
                    <th className="py-3 px-4">Thời gian ca</th>
                    <th className="py-3 px-4">Tiếp nhận lúc</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingWorklist ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Đang tải danh sách bệnh nhân...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                        Không có ca khám nào phù hợp với bộ lọc trong ngày đã chọn.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isWaiting = item.processingStatus === 'WAITING';
                      const isInProgress = item.processingStatus === 'IN_PROGRESS';
                      const isCompleted = item.processingStatus === 'COMPLETED';

                      return (
                        <tr key={item.appointmentId} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-sky-700">
                            {item.appointmentCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.patient?.fullName}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>SĐT: {item.patient?.phone || 'N/A'}</span>
                              <span>•</span>
                              <span>
                                {item.patient?.gender === 'MALE'
                                  ? 'Nam'
                                  : item.patient?.gender === 'FEMALE'
                                  ? 'Nữ'
                                  : 'Khác'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700">
                              {formatTimeOnly(item.slot?.startsAt)} - {formatTimeOnly(item.slot?.endsAt)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {item.checkedInAt ? formatTimeOnly(item.checkedInAt) : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isWaiting && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                                Chờ gọi khám
                              </span>
                            )}
                            {isInProgress && (
                              <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold">
                                Đang khám
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                Đã hoàn tất
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isWaiting && (
                              <button
                                onClick={() => handleStartEncounter(item.appointmentId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-xs"
                              >
                                <StethoscopeIcon className="w-3.5 h-3.5" />
                                <span>Bắt đầu khám</span>
                              </button>
                            )}
                            {isInProgress && (
                              <button
                                onClick={() => openEncounter(item.encounterId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs"
                              >
                                <ClipboardListIcon className="w-3.5 h-3.5" />
                                <span>Tiếp tục khám</span>
                              </button>
                            )}
                            {isCompleted && (
                              <button
                                onClick={() => openEncounter(item.encounterId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                              >
                                <span>Xem bệnh án</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COMPLETE ENCOUNTER CONFIRMATION MODAL                     */}
      {/* ========================================================= */}
      {showCompleteModal && activeEncounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                <span>Xác nhận Hoàn tất Ca Khám Bệnh</span>
              </h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn đang chuẩn bị hoàn tất ca khám cho bệnh nhân{' '}
              <strong className="text-slate-900">{activeEncounter.patient?.fullName}</strong>. Sau khi hoàn tất, hồ sơ
              bệnh án và toa thuốc sẽ được niêm phong để bệnh nhân tra cứu kết quả.
            </p>

            {/* Check blockers before proceeding */}
            {activeEncounter.completionBlockers && activeEncounter.completionBlockers.length > 0 ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertCircleIcon className="w-4 h-4" />
                  <span>Vẫn còn điều kiện chưa hoàn tất:</span>
                </p>
                <ul className="text-xs text-rose-600 space-y-1 list-disc list-inside">
                  {activeEncounter.completionBlockers.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-rose-500 italic pt-1">
                  Vui lòng quay lại hoàn thành các mục trên trước khi đóng ca khám.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckIcon className="w-4 h-4 text-emerald-600" />
                  <span>Tất cả các mục bắt buộc đã được ghi nhận đầy đủ!</span>
                </p>
                <p className="text-[11px]">
                  Bao gồm: Lý do khám, triệu chứng, khám lâm sàng, chẩn đoán ICD-10 và quyết định điều trị.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handleCompleteEncounter}
                disabled={
                  completingEncounter ||
                  (activeEncounter.completionBlockers && activeEncounter.completionBlockers.length > 0)
                }
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {completingEncounter ? 'Đang hoàn tất...' : 'Xác nhận Hoàn tất Ca Khám'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
