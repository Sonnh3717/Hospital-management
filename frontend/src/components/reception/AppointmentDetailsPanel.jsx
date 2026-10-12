import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import Modal from '../ui/Modal.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Icon from '../Icon.jsx';
import AppointmentSlotPicker from './AppointmentSlotPicker.jsx';
import { appointmentDateInVietnam } from './appointmentUtils.js';
import useAsyncResource from '../../hooks/useAsyncResource.js';
import receptionService from '../../services/receptionService.js';
import { formatDate, formatDateTime, formatTime, todayInVietnam } from '../../utils/dateTime.js';
import '../../styles/operations.css';

const sourceLabels = { ONLINE: 'Trực tuyến', ASSISTED: 'Lễ tân đặt', WALK_IN: 'Khám trực tiếp' };

export default function AppointmentDetailsPanel({ appointmentId, onClose, onChanged, onDirtyChange, onBusyChange }) {
  const resource = useAsyncResource(useCallback((signal) => receptionService.getAppointment(appointmentId, { signal }), [appointmentId]));
  const appointment = resource.data;
  const [mode, setMode] = useState(null);
  const [discardTarget, setDiscardTarget] = useState(null);
  const [date, setDate] = useState(todayInVietnam);
  const [doctorId, setDoctorId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const inFlight = useRef(false);
  const dirty = Boolean(reason || slotId);
  const locked = busy || resource.loading || Boolean(resource.error);
  const beforeEncounter = !appointment?.encounterId;
  const canCheckIn = beforeEncounter && appointment?.status === 'BOOKED' && appointmentDateInVietnam(appointment?.slot?.startsAt) === todayInVietnam();
  const canUndo = beforeEncounter && appointment?.status === 'CHECKED_IN';
  const canReschedule = beforeEncounter && appointment?.status === 'BOOKED';
  const canCancel = beforeEncounter && ['BOOKED', 'CHECKED_IN'].includes(appointment?.status);

  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => () => { onDirtyChange?.(false); onBusyChange?.(false); }, [onDirtyChange, onBusyChange]);

  function clearDraft() { setReason(''); setSlotId(''); setDoctorId(''); }
  function requestClose(target) { if (busy) return; if (dirty) setDiscardTarget(target); else if (target === 'panel') onClose(); else setMode(null); }
  function openMode(next) {
    setError(null); setNotice(''); setMode(next);
    if (next === 'reschedule') setDate(appointmentDateInVietnam(appointment?.slot?.startsAt) < todayInVietnam() ? todayInVietnam() : appointmentDateInVietnam(appointment?.slot?.startsAt) || todayInVietnam());
  }

  async function mutate(action) {
    if (inFlight.current || locked) return;
    if (action === 'reschedule' && !slotId) { setError(Object.assign(new Error('Vui lòng chọn khung giờ mới.'), { fieldErrors: { slotId: 'Vui lòng chọn khung giờ mới.' } })); return; }
    inFlight.current = true; setBusy(true); setError(null); setNotice('');
    try {
      let next;
      if (action === 'check-in') next = await receptionService.checkIn(appointmentId);
      if (action === 'undo') next = await receptionService.undoCheckIn(appointmentId);
      if (action === 'cancel') next = await receptionService.cancelAppointment(appointmentId, reason.trim() || undefined);
      if (action === 'reschedule') next = await receptionService.rescheduleAppointment(appointmentId, Number(slotId));
      resource.setData(next); clearDraft(); setMode(null);
      setNotice({ 'check-in': 'Đã check-in. Người bệnh đã sẵn sàng để bác sĩ tiếp nhận.', undo: 'Đã hoàn tác check-in.', cancel: 'Đã hủy lịch hẹn.', reschedule: 'Đã đổi lịch khám.' }[action]);
      onChanged?.(next);
    } catch (cause) {
      setError(cause);
      if (cause.status === 409) {
        try {
          const latest = await receptionService.getAppointment(appointmentId);
          resource.setData(latest);
          if (action === 'undo' && latest.encounterId) setError(new Error('Bệnh nhân đã bắt đầu khám, không thể hoàn tác check-in.'));
        } catch { resource.reload(); }
        if (action === 'undo' || action === 'check-in') setMode(null);
        onChanged?.();
      }
    } finally { inFlight.current = false; setBusy(false); }
  }

  return <aside className="work-card reception-details" aria-labelledby="appointment-details-title">
    <div className="work-card-heading"><div><h2 id="appointment-details-title">Chi tiết lịch hẹn</h2><p>{appointment?.appointmentCode || 'Đang tải…'}</p></div><button className="work-icon-button" type="button" disabled={busy} onClick={() => requestClose('panel')} aria-label="Đóng chi tiết lịch hẹn"><Icon name="close" size={19} /></button></div>
    <div className="reception-details-body work-form-stack">
      {resource.loading && <div className="work-loading" role="status">Đang tải lịch hẹn…</div>}
      {resource.error && <div className="work-notice work-notice--error" role="alert">{resource.error.message}<Button variant="ghost" onClick={resource.reload}>Thử lại</Button></div>}
      {appointment && <>
        <div className="reception-detail-person"><span className="work-eyebrow">{appointment.patient?.patientCode}</span><h3>{appointment.patient?.fullName}</h3><StatusBadge status={appointment.status} /></div>
        <dl className="work-detail-list"><div><dt>Ngày sinh</dt><dd>{formatDate(appointment.patient?.dateOfBirth)}</dd></div><div><dt>Điện thoại</dt><dd>{appointment.patient?.phone || '—'}</dd></div><div><dt>Email</dt><dd>{appointment.patient?.contactEmail || '—'}</dd></div><div><dt>Bác sĩ</dt><dd>{appointment.doctor?.fullName || appointment.slot?.doctorName}</dd></div><div><dt>Chuyên khoa</dt><dd>{appointment.doctor?.specialization || appointment.slot?.specialization || '—'}</dd></div><div><dt>Ngày khám</dt><dd>{formatDate(appointment.slot?.startsAt)}</dd></div><div><dt>Khung giờ</dt><dd>{formatTime(appointment.slot?.startsAt)}–{formatTime(appointment.slot?.endsAt)}</dd></div><div><dt>Nguồn đặt</dt><dd>{sourceLabels[appointment.bookingSource] || '—'}</dd></div><div><dt>Check-in lúc</dt><dd>{formatDateTime(appointment.checkedInAt)}</dd></div></dl>
        {appointment.reason && <div><h4>Lý do khám</h4><p className="work-prewrap">{appointment.reason}</p></div>}{appointment.note && <div><h4>Ghi chú</h4><p className="work-prewrap">{appointment.note}</p></div>}
        {notice && <div className="work-notice work-notice--success" role="status">{notice}</div>}
        {error && <div className="work-notice work-notice--error" role="alert">{error.message}{error.status === 409 && <p>Lịch hẹn đã được cập nhật. Nội dung chưa gửi vẫn được giữ.</p>}</div>}
        {!beforeEncounter && <div className="work-notice">{appointment.encounterStatus === 'COMPLETED' ? 'Lượt khám đã hoàn tất.' : 'Bác sĩ đã bắt đầu khám.'} Lịch hẹn được giữ để theo dõi và đối chiếu.</div>}
        {appointment.status === 'CHECKED_IN' && beforeEncounter && <p className="work-muted">Muốn đổi lịch, hãy hoàn tác check-in trước khi chọn khung giờ mới.</p>}
        {appointment.status === 'BOOKED' && !canCheckIn && beforeEncounter && <p className="work-muted">Check-in được thực hiện trong ngày hẹn theo giờ Việt Nam.</p>}
        <div className="work-detail-actions">{canCheckIn && <Button loading={busy} disabled={locked} onClick={() => mutate('check-in')}><Icon name="check" size={17} />Check-in người bệnh</Button>}{canUndo && <Button variant="secondary" disabled={locked} onClick={() => openMode('undo')}>Hoàn tác check-in</Button>}{canReschedule && <Button variant="secondary" disabled={locked} onClick={() => openMode('reschedule')}>Đổi lịch khám</Button>}{canCancel && <Button variant="danger" disabled={locked} onClick={() => openMode('cancel')}>Hủy lịch hẹn</Button>}<Button variant="ghost" disabled={locked} onClick={resource.reload}><Icon name="clock" size={16} />Làm mới chi tiết</Button></div>
        {dirty && !mode && <div className="work-notice"><span>Nội dung thao tác chưa gửi được giữ lại.</span><Button variant="secondary" disabled={busy} onClick={() => setDiscardTarget('draft')}>Bỏ nội dung chưa gửi</Button></div>}
      </>}
    </div>
    <Modal open={mode === 'undo'} title="Hoàn tác check-in?" onClose={() => requestClose('modal')} busy={busy} footer={<><Button variant="secondary" disabled={busy} onClick={() => setMode(null)}>Quay lại</Button><Button loading={busy} disabled={!canUndo || locked} onClick={() => mutate('undo')}>Xác nhận hoàn tác</Button></>}><p>Người bệnh sẽ được đưa ra khỏi danh sách chờ khám của bác sĩ. Chỉ thực hiện khi đã đối chiếu và bác sĩ chưa bắt đầu lượt khám.</p>{error && <div className="work-notice work-notice--error" role="alert">{error.message}</div>}</Modal>
    <Modal open={mode === 'cancel'} title="Hủy lịch hẹn" onClose={() => requestClose('modal')} busy={busy} footer={<><Button variant="secondary" disabled={busy} onClick={() => requestClose('modal')}>Quay lại</Button><Button variant="danger" loading={busy} disabled={!canCancel || locked} onClick={() => mutate('cancel')}>Xác nhận hủy lịch</Button></>}><div className="work-form-stack"><p>Lịch hẹn {appointment?.appointmentCode} sẽ bị hủy. Việc hủy cần đáp ứng quy định thời gian của cơ sở.</p><Field label="Lý do hủy" error={error?.fieldErrors?.reason}><textarea rows={4} maxLength={500} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} /></Field>{error && <div className="work-notice work-notice--error" role="alert">{error.message}</div>}</div></Modal>
    <Modal open={mode === 'reschedule'} title="Chọn lịch khám mới" onClose={() => requestClose('modal')} busy={busy} footer={<><Button variant="secondary" disabled={busy} onClick={() => requestClose('modal')}>Quay lại</Button><Button loading={busy} disabled={!canReschedule || locked} onClick={() => mutate('reschedule')}>Xác nhận đổi lịch</Button></>}><div className="work-form-stack"><p>Chọn bác sĩ và khung giờ còn chỗ phù hợp cho người bệnh.</p><AppointmentSlotPicker date={date} doctorId={doctorId} slotId={slotId} onDateChange={(value) => { setDate(value); setDoctorId(''); setSlotId(''); }} onDoctorChange={(value) => { setDoctorId(value); setSlotId(''); }} onSlotChange={setSlotId} walkIn={appointment?.bookingSource === 'WALK_IN'} disabled={busy} fieldErrors={error?.fieldErrors} excludeSlotId={appointment?.slot?.id} />{error && <div className="work-notice work-notice--error" role="alert">{error.message}</div>}</div></Modal>
    <Modal open={Boolean(discardTarget)} title="Bỏ nội dung chưa gửi?" onClose={() => setDiscardTarget(null)} footer={<><Button variant="secondary" onClick={() => setDiscardTarget(null)}>Tiếp tục chỉnh sửa</Button><Button variant="danger" onClick={() => { const target = discardTarget; clearDraft(); setDiscardTarget(null); if (target === 'panel') onClose(); else setMode(null); }}>Bỏ thay đổi</Button></>}><p>Nội dung đang nhập cho thao tác lịch hẹn chưa được gửi và sẽ bị bỏ.</p></Modal>
  </aside>;
}
