import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import Modal from '../ui/Modal.jsx';
import AppointmentSlotPicker from './AppointmentSlotPicker.jsx';
import useAsyncResource from '../../hooks/useAsyncResource.js';
import receptionService from '../../services/receptionService.js';
import { formatDate, todayInVietnam } from '../../utils/dateTime.js';
import '../../styles/operations.css';

const emptyPatient = { fullName: '', dateOfBirth: '', gender: '', phone: '', contactEmail: '' };

export default function AppointmentBookingPanel({ open, onClose, onCreated, bookingSource = 'ASSISTED', initialDate, onDirtyChange, onBusyChange }) {
  const walkIn = bookingSource === 'WALK_IN';
  const [date, setDate] = useState(walkIn ? todayInVietnam() : initialDate || todayInVietnam());
  const [doctorId, setDoctorId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [patientMode, setPatientMode] = useState('existing');
  const [patientQuery, setPatientQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patient, setPatient] = useState(emptyPatient);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const inFlight = useRef(false);
  const submission = useRef(null);
  const dirty = Boolean(slotId || selectedPatient || reason || Object.values(patient).some(Boolean));
  const patients = useAsyncResource(useCallback((signal) => receptionService.searchPatients(search, { signal }), [search]), Boolean(search));

  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => () => { onDirtyChange?.(false); onBusyChange?.(false); }, [onDirtyChange, onBusyChange]);

  function requestClose() { if (!busy) { if (dirty) setDiscardOpen(true); else onClose(); } }
  function updatePatient(name, value) { setPatient((previous) => ({ ...previous, [name]: value })); setFieldErrors((previous) => ({ ...previous, [`patient.${name}`]: undefined, [name]: undefined })); }
  function findPatients() { if (patientQuery.trim() && !busy) { setSearch(patientQuery.trim()); patients.reload(); } }

  async function create(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const errors = {};
    if (!slotId) errors.slotId = 'Vui lòng chọn khung giờ khám.';
    if (patientMode === 'existing' && !selectedPatient) errors.patientId = 'Vui lòng chọn một hồ sơ người bệnh.';
    if (patientMode === 'new' && !patient.fullName.trim()) errors['patient.fullName'] = 'Vui lòng nhập họ tên người bệnh.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    const payload = { slotId: Number(slotId), bookingSource, reason: reason.trim() || undefined };
    if (patientMode === 'existing') payload.patientId = selectedPatient.id;
    else payload.patient = Object.fromEntries(Object.entries(patient).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
    const signature = JSON.stringify(payload);
    if (submission.current?.signature !== signature) submission.current = { signature, key: crypto.randomUUID() };
    payload.idempotencyKey = submission.current.key;
    inFlight.current = true; setBusy(true); setError(null);
    try { const appointment = await receptionService.createAppointment(payload); onCreated(appointment); }
    catch (cause) { setError(cause); setFieldErrors(cause.fieldErrors || {}); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <>
    <Modal open={open} title={walkIn ? 'Tạo lịch khám trực tiếp' : 'Đặt lịch hỗ trợ người bệnh'} onClose={requestClose} busy={busy} footer={<><Button variant="secondary" disabled={busy} onClick={requestClose}>Đóng</Button><Button type="submit" form="reception-booking-form" loading={busy}>Tạo lịch hẹn</Button></>}>
      <form id="reception-booking-form" className="work-form-stack" onSubmit={create}>
        <div className="work-patient-mode" role="group" aria-label="Chọn hồ sơ người bệnh"><label><input type="radio" name="patient-mode" value="existing" checked={patientMode === 'existing'} disabled={busy} onChange={() => setPatientMode('existing')} />Hồ sơ đã có</label><label><input type="radio" name="patient-mode" value="new" checked={patientMode === 'new'} disabled={busy} onChange={() => setPatientMode('new')} />Tạo hồ sơ mới</label></div>
        {patientMode === 'existing' ? <div className="work-form-stack"><Field label="Tìm hồ sơ người bệnh" error={fieldErrors.patientId} hint="Tìm theo tên, mã người bệnh hoặc số điện thoại."><input type="search" value={patientQuery} maxLength={150} disabled={busy} onChange={(event) => { setPatientQuery(event.target.value); setSelectedPatient(null); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); findPatients(); } }} /></Field><Button variant="secondary" disabled={busy || !patientQuery.trim()} loading={patients.loading} onClick={findPatients}>Tìm hồ sơ</Button>
          {patients.error && <div className="work-notice work-notice--error" role="alert">{patients.error.message}<Button variant="ghost" disabled={busy} onClick={patients.reload}>Thử lại</Button></div>}
          {search && !patients.loading && !patients.error && <div className="work-patient-results" role="group" aria-label="Hồ sơ tìm thấy">{(patients.data || []).length ? patients.data.map((item) => <button key={item.id} type="button" className={`work-patient-result ${selectedPatient?.id === item.id ? 'is-selected' : ''}`} disabled={busy} aria-pressed={selectedPatient?.id === item.id} onClick={() => { setSelectedPatient(item); setFieldErrors((previous) => ({ ...previous, patientId: undefined })); }}><strong>{item.fullName}</strong><span>{item.patientCode} · {item.dateOfBirth ? formatDate(item.dateOfBirth) : 'Chưa có ngày sinh'}{item.phone ? ` · ${item.phone}` : ''}</span></button>) : <p className="work-muted">Không tìm thấy hồ sơ phù hợp. Bạn có thể chọn tạo hồ sơ mới.</p>}</div>}
          {selectedPatient && <div className="work-notice work-notice--success" role="status">Đã chọn {selectedPatient.fullName} · {selectedPatient.patientCode}.</div>}
        </div> : <div className="work-form-grid"><Field label="Họ tên" required error={fieldErrors['patient.fullName'] || fieldErrors.fullName}><input value={patient.fullName} maxLength={150} disabled={busy} onChange={(event) => updatePatient('fullName', event.target.value)} /></Field><Field label="Ngày sinh" error={fieldErrors['patient.dateOfBirth'] || fieldErrors.dateOfBirth}><input type="date" max={todayInVietnam()} value={patient.dateOfBirth} disabled={busy} onChange={(event) => updatePatient('dateOfBirth', event.target.value)} /></Field><Field label="Giới tính" error={fieldErrors['patient.gender'] || fieldErrors.gender}><select value={patient.gender} disabled={busy} onChange={(event) => updatePatient('gender', event.target.value)}><option value="">Chưa cung cấp</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></Field><Field label="Số điện thoại" error={fieldErrors['patient.phone'] || fieldErrors.phone}><input type="tel" maxLength={25} value={patient.phone} disabled={busy} onChange={(event) => updatePatient('phone', event.target.value)} /></Field><Field label="Email liên hệ" error={fieldErrors['patient.contactEmail'] || fieldErrors.contactEmail}><input type="email" maxLength={254} value={patient.contactEmail} disabled={busy} onChange={(event) => updatePatient('contactEmail', event.target.value)} /></Field></div>}
        <div className="work-form-divider" />
        <AppointmentSlotPicker date={date} doctorId={doctorId} slotId={slotId} onDateChange={(value) => { setDate(value); setDoctorId(''); setSlotId(''); }} onDoctorChange={(value) => { setDoctorId(value); setSlotId(''); }} onSlotChange={(value) => { setSlotId(value); setFieldErrors((previous) => ({ ...previous, slotId: undefined })); }} walkIn={walkIn} disabled={busy} fieldErrors={fieldErrors} />
        <Field label="Lý do khám" error={fieldErrors.reason}><textarea rows={3} value={reason} maxLength={500} disabled={busy} onChange={(event) => setReason(event.target.value)} /></Field>
        {error && <div className="work-notice work-notice--error" role="alert">{error.message}{error.status === 409 && <p>Khung giờ hoặc điều kiện đặt lịch đã thay đổi. Hãy kiểm tra lại lựa chọn; nội dung nhập vẫn được giữ.</p>}</div>}
        <p className="work-muted">Sau khi tạo lịch, đối chiếu người bệnh và thực hiện check-in tại danh sách tiếp nhận.</p>
      </form>
    </Modal>
    <Modal open={discardOpen} title="Bỏ nội dung đặt lịch chưa lưu?" onClose={() => setDiscardOpen(false)} footer={<><Button variant="secondary" onClick={() => setDiscardOpen(false)}>Tiếp tục nhập</Button><Button variant="danger" onClick={onClose}>Bỏ thay đổi và đóng</Button></>}><p>Nội dung đặt lịch đang nhập sẽ bị bỏ khi đóng form.</p></Modal>
  </>;
}
