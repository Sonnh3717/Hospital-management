import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../ui/EmptyState.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Icon from '../Icon.jsx';
import { formatDateTime } from '../../utils/dateTime.js';

export default function ServiceQueueSection({ title, description, items, sectionId, tone = 'blue' }) {
  const navigate = useNavigate();
  return <section className={`service-queue-section service-queue-section--${tone}`} aria-labelledby={sectionId}>
    <div className="service-section-heading"><div><h2 id={sectionId}>{title} <span className="service-count">{items.length}</span></h2><p>{description}</p></div></div>
    {items.length === 0 ? <EmptyState title="Không có yêu cầu trong nhóm này" description="Danh sách tự cập nhật khi bạn trở lại hàng chờ. Có thể dùng Làm mới để kiểm tra ngay." /> : <div className="service-table-scroll"><table className="service-queue-table"><thead><tr><th>Yêu cầu / người bệnh</th><th>Dịch vụ / bác sĩ chỉ định</th><th>Ưu tiên</th><th>Thời điểm chỉ định</th><th>Trạng thái / phụ trách</th><th><span className="service-sr-only">Mở yêu cầu</span></th></tr></thead><tbody>{items.map((request) => <tr key={request.id} onClick={() => navigate(`/services/requests/${request.id}`)}><td><Link className="service-request-link" to={`/services/requests/${request.id}`} onClick={(event) => event.stopPropagation()}>{request.requestCode}</Link><strong className="service-cell-line">{request.patient?.fullName || '—'}</strong><span className="service-cell-secondary">{request.patient?.patientCode || '—'}</span></td><td><strong>{request.service?.serviceName || '—'}</strong><span className="service-cell-secondary">{request.requestingDoctor?.fullName || '—'}</span></td><td><StatusBadge status={request.priority} /></td><td><time dateTime={request.requestedAt}>{formatDateTime(request.requestedAt)}</time></td><td><StatusBadge status={request.status} /><span className="service-cell-secondary">{request.responsibleStaff?.fullName || 'Chưa có người phụ trách'}</span></td><td><Link className="service-open-link" to={`/services/requests/${request.id}`} onClick={(event) => event.stopPropagation()} aria-label={`Mở yêu cầu ${request.requestCode}`}><Icon name="chevron-right" size={19} /></Link></td></tr>)}</tbody></table></div>}
  </section>;
}
