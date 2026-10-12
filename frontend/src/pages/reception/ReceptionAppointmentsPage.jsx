import { useCallback, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import UnsavedChangesDialog from '../../components/ui/UnsavedChangesDialog.jsx';
import AppointmentDetailsPanel from '../../components/reception/AppointmentDetailsPanel.jsx';
import AppointmentBookingPanel from '../../components/reception/AppointmentBookingPanel.jsx';
import { appointmentDateInVietnam, errorMessage } from '../../components/reception/appointmentUtils.js';
import useAsyncResource from '../../hooks/useAsyncResource.js';
import useUnsavedChanges from '../../hooks/useUnsavedChanges.js';
import receptionService from '../../services/receptionService.js';
import { todayInVietnam, formatDate, formatTime, formatDateTime } from '../../utils/dateTime.js';
import '../../styles/operations.css';

const pageSize = 20;
const sources = { ONLINE: 'Trực tuyến', ASSISTED: 'Lễ tân đặt', WALK_IN: 'Khám trực tiếp' };

export default function ReceptionAppointmentsPage() {
  const [date, setDate] = useState(todayInVietnam);
  const [doctorId, setDoctorId] = useState('');
  const [status, setStatus] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [bookingSource, setBookingSource] = useState(null);
  const [notice, setNotice] = useState('');
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [bookingDirty, setBookingDirty] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [pendingSelectedId, setPendingSelectedId] = useState(null);
  const blocker = useUnsavedChanges(detailsDirty || bookingDirty || detailsBusy || bookingBusy);
  const loadAppointments = useCallback((signal) => receptionService.listAppointments({ date, doctorId: doctorId || undefined, status: status || undefined, search: search || undefined, page, size: pageSize }, { signal }), [date, doctorId, status, search, page]);
  const appointments = useAsyncResource(loadAppointments);
  const options = useAsyncResource(useCallback((signal) => receptionService.getOptions(date, { signal }), [date]));
  const items = appointments.data?.items || [];
  const total = appointments.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function resetSelection() {
    setPage(0);
    setNotice('');
  }

  function selectAppointment(id) {
    if (detailsBusy || id === selectedId) return;
    if (detailsDirty) setPendingSelectedId(id);
    else setSelectedId(id);
  }

  function handleCreated(appointment) {
    setBookingSource(null);
    setDate(appointmentDateInVietnam(appointment.slot?.startsAt) || date);
    setDoctorId('');
    setStatus('');
    setSearch('');
    setSearchDraft('');
    setPage(0);
    setSelectedId(appointment.id);
    setNotice(`Đã tạo lịch hẹn ${appointment.appointmentCode || ''}.`);
    appointments.reload();
    options.reload();
  }

  return (
    <>
      <div className="work-page-heading"><div><span className="work-eyebrow">TIẾP NHẬN NGƯỜI BỆNH</span><h1>Lịch hẹn tiếp nhận</h1><p>Tra cứu lịch hẹn, tiếp nhận và điều phối người bệnh đến bác sĩ.</p></div><div className="work-heading-actions"><Button variant="secondary" disabled={detailsDirty || detailsBusy} onClick={() => { setBookingSource('WALK_IN'); setNotice(''); }}><Icon name="user" size={17} /> Tiếp nhận trực tiếp</Button><Button disabled={detailsDirty || detailsBusy} onClick={() => { setBookingSource('ASSISTED'); setNotice(''); }}><Icon name="calendar" size={17} /> Đặt lịch hỗ trợ</Button></div></div>
      {notice && <div className="work-notice work-notice--success" role="status"><Icon name="check" size={18} />{notice}</div>}
      <form className="work-filter-card reception-filters" onSubmit={(event) => { event.preventDefault(); setSearch(searchDraft.trim()); resetSelection(); }}>
        <Field label="Ngày khám" id="reception-date"><input type="date" value={date} required onChange={(event) => { setDate(event.target.value); setDoctorId(''); resetSelection(); }} /></Field>
        <Field label="Bác sĩ" id="reception-doctor"><select value={doctorId} onChange={(event) => { setDoctorId(event.target.value); resetSelection(); }} disabled={options.loading}><option value="">Tất cả bác sĩ</option>{(options.data?.doctors || []).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}</select></Field>
        <Field label="Trạng thái" id="reception-status"><select value={status} onChange={(event) => { setStatus(event.target.value); resetSelection(); }}><option value="">Tất cả trạng thái</option><option value="BOOKED">Đã đặt lịch</option><option value="CHECKED_IN">Đã tiếp nhận khám</option><option value="CANCELLED">Đã hủy</option><option value="NO_SHOW">Vắng mặt</option></select></Field>
        <Field label="Tìm người bệnh / lịch hẹn" id="reception-search"><input type="search" placeholder="Tên, mã người bệnh, mã lịch hẹn, điện thoại…" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} /></Field>
        <Button type="submit" variant="secondary"><Icon name="search" size={17} /> Tìm kiếm</Button>
      </form>
      {options.error && <div className="work-notice work-notice--error" role="alert">Không tải được danh sách bác sĩ. <Button variant="ghost" onClick={options.reload}>Thử lại</Button></div>}

      <div className={`reception-workspace${selectedId ? ' reception-workspace--details' : ''}`}>
        <section className="work-card" aria-labelledby="appointments-list-title">
          <div className="work-card-heading"><div><h2 id="appointments-list-title">Danh sách lịch hẹn <span className="work-count">{total}</span></h2><p>{formatDate(date)} <span aria-hidden="true">·</span> Giờ Việt Nam</p></div><Button variant="ghost" onClick={appointments.reload} loading={appointments.loading}><Icon name="clock" size={16} /> Làm mới</Button></div>
          {appointments.error && <div className="work-notice work-notice--error" role="alert">{errorMessage(appointments.error)}<Button variant="ghost" onClick={appointments.reload}>Thử lại</Button></div>}
          {appointments.loading ? <div className="work-loading" role="status">Đang tải lịch hẹn…</div> : !appointments.error && items.length === 0 ? <EmptyState title="Không tìm thấy lịch hẹn" description="Thử thay đổi ngày, bác sĩ hoặc thông tin tìm kiếm." /> : !appointments.error && <div className="work-table-scroll"><table className="work-table"><thead><tr><th>Người bệnh</th><th>Bác sĩ / giờ khám</th><th>Trạng thái / check-in</th><th>Nguồn đặt</th><th><span className="work-sr-only">Thao tác</span></th></tr></thead><tbody>{items.map((appointment) => <tr key={appointment.id} className={selectedId === appointment.id ? 'is-selected' : ''} onClick={() => selectAppointment(appointment.id)}><td><button className="work-patient-link" type="button" onClick={() => selectAppointment(appointment.id)}>{appointment.patient?.fullName}</button><span className="work-cell-secondary">{appointment.patient?.patientCode} · {appointment.appointmentCode}</span>{appointment.patient?.phone && <span className="work-cell-secondary">{appointment.patient.phone}</span>}</td><td><strong>{appointment.doctor?.fullName || appointment.slot?.doctorName}</strong><span className="work-cell-secondary">{formatTime(appointment.slot?.startsAt)} – {formatTime(appointment.slot?.endsAt)} · {appointment.doctor?.specialization || appointment.slot?.specialization}</span></td><td><StatusBadge status={appointment.status} />{appointment.checkedInAt && <span className="work-cell-secondary">Check-in: {formatDateTime(appointment.checkedInAt)}</span>}{appointment.encounterId && <span className="work-cell-secondary">{appointment.encounterStatus === 'COMPLETED' ? 'Đã hoàn tất lượt khám' : 'Đã bắt đầu lượt khám'}</span>}</td><td>{sources[appointment.bookingSource] || 'Chưa cập nhật'}</td><td><button className="work-icon-button" type="button" aria-label={`Xem chi tiết lịch hẹn của ${appointment.patient?.fullName || 'người bệnh'}`} onClick={() => selectAppointment(appointment.id)}><Icon name="chevron-right" size={18} /></button></td></tr>)}</tbody></table></div>}
          {!appointments.loading && !appointments.error && total > 0 && <div className="work-pagination"><span>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} / {total} lịch hẹn</span><div><Button variant="ghost" disabled={page === 0} onClick={() => setPage((previous) => previous - 1)} aria-label="Trang trước"><Icon name="chevron-right" className="work-icon-reverse" size={17} /></Button><span>Trang {page + 1} / {totalPages}</span><Button variant="ghost" disabled={page + 1 >= totalPages} onClick={() => setPage((previous) => previous + 1)} aria-label="Trang tiếp theo"><Icon name="chevron-right" size={17} /></Button></div></div>}
        </section>
        {selectedId && <AppointmentDetailsPanel key={selectedId} appointmentId={selectedId} onClose={() => setSelectedId(null)} onChanged={() => { appointments.reload(); options.reload(); }} onDirtyChange={setDetailsDirty} onBusyChange={setDetailsBusy} />}
      </div>
      {bookingSource && <AppointmentBookingPanel key={bookingSource} open bookingSource={bookingSource} initialDate={bookingSource === 'WALK_IN' ? todayInVietnam() : date} onClose={() => setBookingSource(null)} onCreated={handleCreated} onDirtyChange={setBookingDirty} onBusyChange={setBookingBusy} />}
      <Modal open={pendingSelectedId !== null} title="Bỏ thay đổi trước khi mở lịch khác?" onClose={() => setPendingSelectedId(null)} footer={<><Button variant="secondary" onClick={() => setPendingSelectedId(null)}>Tiếp tục chỉnh sửa</Button><Button variant="danger" onClick={() => { setSelectedId(pendingSelectedId); setPendingSelectedId(null); setDetailsDirty(false); }}>Bỏ thay đổi và mở lịch</Button></>}><p>Nội dung thao tác lịch hẹn chưa gửi sẽ bị bỏ khi mở lịch hẹn khác.</p></Modal>
      <UnsavedChangesDialog blocker={blocker} busy={detailsBusy || bookingBusy} />
    </>
  );
}
