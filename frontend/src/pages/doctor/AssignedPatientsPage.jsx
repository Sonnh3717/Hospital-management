import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import useAsyncResource from '../../hooks/useAsyncResource.js';
import doctorWorklistService from '../../services/doctorWorklistService.js';
import { todayInVietnam, formatDate, formatTime, ageFromDateOfBirth } from '../../utils/dateTime.js';
import '../../styles/operations.css';

const pageSize = 20;
const processingLabels = { WAITING: 'Chờ khám', IN_PROGRESS: 'Đang khám', COMPLETED: 'Hoàn tất' };

export default function AssignedPatientsPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayInVietnam);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [startingId, setStartingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const actionInFlight = useRef(false);
  const loadPatients = useCallback((signal) => doctorWorklistService.listPatients({ date, status: status || undefined, page, size: pageSize }, { signal }), [date, status, page]);
  const worklist = useAsyncResource(loadPatients);
  const items = worklist.data?.items || [];
  const total = worklist.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function openEncounter(item) {
    if (actionInFlight.current) return;
    if (item.encounterId) {
      navigate(`/doctor/encounters/${item.encounterId}`);
      return;
    }
    actionInFlight.current = true;
    setStartingId(item.appointmentId);
    setActionError('');
    try {
      const result = await doctorWorklistService.startEncounter(item.appointmentId);
      navigate(`/doctor/encounters/${result.encounterId}`);
    } catch (error) {
      setActionError(error.message || 'Không thể bắt đầu lượt khám. Vui lòng thử lại.');
      worklist.reload();
    } finally {
      actionInFlight.current = false;
      setStartingId(null);
    }
  }

  return (
    <>
      <div className="work-page-heading"><div><span className="work-eyebrow">KHÁM VÀ ĐIỀU TRỊ</span><h1>Người bệnh được phân công</h1><p>Theo dõi người bệnh đã được tiếp nhận và tiếp tục lượt khám của bạn.</p></div><span className="work-date-tag"><Icon name="calendar" size={18} />{formatDate(date)}</span></div>
      <div className="work-filter-card doctor-filters"><Field label="Ngày khám" id="doctor-worklist-date"><input type="date" value={date} required onChange={(event) => { setDate(event.target.value); setPage(0); setActionError(''); }} /></Field><Field label="Tiến độ lượt khám" id="doctor-worklist-status"><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); setActionError(''); }}><option value="">Tất cả tiến độ</option><option value="WAITING">Chờ khám</option><option value="IN_PROGRESS">Đang khám</option><option value="COMPLETED">Hoàn tất</option></select></Field><span className="work-filter-note"><Icon name="shield" size={18} /> Danh sách theo phân công của bạn</span><Button variant="secondary" onClick={worklist.reload} loading={worklist.loading}><Icon name="clock" size={16} /> Làm mới</Button></div>
      {actionError && <div className="work-notice work-notice--error" role="alert"><Icon name="info" size={18} />{actionError}</div>}
      <section className="work-card" aria-labelledby="doctor-worklist-title"><div className="work-card-heading"><div><h2 id="doctor-worklist-title">Danh sách người bệnh <span className="work-count">{total}</span></h2><p>Giờ khám và giờ tiếp nhận hiển thị theo giờ Việt Nam.</p></div></div>
        {worklist.error && <div className="work-notice work-notice--error" role="alert">{worklist.error.message || 'Không thể tải danh sách người bệnh.'}<Button variant="ghost" onClick={worklist.reload}>Thử lại</Button></div>}
        {worklist.loading ? <div className="work-loading" role="status">Đang tải danh sách người bệnh…</div> : !worklist.error && items.length === 0 ? <EmptyState title="Chưa có người bệnh trong danh sách" description="Danh sách sẽ xuất hiện khi người bệnh được tiếp nhận cho lịch khám của bạn." /> : !worklist.error && <div className="work-table-scroll"><table className="work-table doctor-worklist-table"><thead><tr><th>Người bệnh</th><th>Giờ khám / tiếp nhận</th><th>Tiến độ</th><th>Dịch vụ & kết quả</th><th>Thao tác</th></tr></thead><tbody>{items.map((item) => {
          const age = ageFromDateOfBirth(item.patient?.dateOfBirth);
          return <tr key={item.appointmentId}><td><strong className="work-patient-name">{item.patient?.fullName}</strong><span className="work-cell-secondary">{item.patient?.patientCode} · {age === null ? 'Chưa có ngày sinh' : `${age} tuổi`}</span><span className="work-cell-secondary">{item.appointmentCode}</span></td><td><strong>{formatTime(item.slot?.startsAt)} – {formatTime(item.slot?.endsAt)}</strong><span className="work-cell-secondary">Tiếp nhận lúc {formatTime(item.checkedInAt)}</span></td><td><StatusBadge status={item.processingStatus === 'WAITING' ? 'ORDERED' : item.processingStatus} label={processingLabels[item.processingStatus]} /></td><td><div className="work-service-flags">{item.pendingServiceCount > 0 && <span className="work-service-flag work-service-flag--pending"><Icon name="clock" size={13} />{item.pendingServiceCount} dịch vụ đang chờ</span>}{item.unhandledResultCount > 0 && <span className="work-service-flag work-service-flag--result"><Icon name="info" size={13} />{item.unhandledResultCount} kết quả chưa xử lý</span>}{item.hasUnableService && <span className="work-service-flag work-service-flag--unable"><Icon name="info" size={13} />Có dịch vụ không thực hiện được</span>}{!item.pendingServiceCount && !item.unhandledResultCount && !item.hasUnableService && <span className="work-cell-secondary">Không có cảnh báo dịch vụ</span>}</div></td><td><Button variant={item.processingStatus === 'WAITING' ? 'primary' : 'secondary'} loading={startingId === item.appointmentId} disabled={startingId !== null && startingId !== item.appointmentId} onClick={() => openEncounter(item)}>{item.processingStatus === 'WAITING' ? 'Bắt đầu khám' : item.processingStatus === 'COMPLETED' ? 'Xem lượt khám' : 'Tiếp tục khám'}<Icon name="arrow-right" size={15} /></Button></td></tr>;
        })}</tbody></table></div>}
        {!worklist.loading && !worklist.error && total > 0 && <div className="work-pagination"><span>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} / {total} người bệnh</span><div><Button variant="ghost" disabled={page === 0} onClick={() => setPage((previous) => previous - 1)} aria-label="Trang trước"><Icon name="chevron-right" className="work-icon-reverse" size={17} /></Button><span>Trang {page + 1} / {totalPages}</span><Button variant="ghost" disabled={page + 1 >= totalPages} onClick={() => setPage((previous) => previous + 1)} aria-label="Trang tiếp theo"><Icon name="chevron-right" size={17} /></Button></div></div>}
      </section>
      <p className="work-page-note"><Icon name="info" size={15} /> Các cảnh báo dịch vụ và kết quả được hiển thị độc lập để bạn theo dõi đầy đủ tiến độ chăm sóc.</p>
    </>
  );
}
