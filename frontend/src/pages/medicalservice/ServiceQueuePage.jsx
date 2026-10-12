import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Icon from '../../components/Icon.jsx';
import ServiceQueueSection from '../../components/medicalservice/ServiceQueueSection.jsx';
import useAsyncResource from '../../hooks/useAsyncResource.js';
import medicalServiceWorkflowService from '../../services/medicalServiceWorkflowService.js';
import '../../styles/medicalservice.css';

export default function ServiceQueuePage() {
  const [params, setParams] = useSearchParams();
  const serviceId = params.get('serviceId') || '';
  const priority = params.get('priority') || '';
  const search = params.get('search') || '';
  const [searchDraft, setSearchDraft] = useState(search);
  const loadQueue = useCallback((signal) => medicalServiceWorkflowService.getQueue({ serviceId: serviceId || undefined, priority: priority || undefined, search: search || undefined }, signal), [serviceId, priority, search]);
  const queue = useAsyncResource(loadQueue);
  const data = queue.data;

  function setFilter(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value); else next.delete(name);
    setParams(next, { replace: true });
  }

  return <div className="service-page service-stack">
    <div className="service-page-heading"><div><span className="service-eyebrow">DỊCH VỤ Y TẾ</span><h1>Hàng chờ dịch vụ</h1><p>Tiếp nhận yêu cầu được phân công và theo dõi dịch vụ bạn đang thực hiện.</p></div><Button variant="secondary" loading={queue.loading} onClick={queue.reload}><Icon name="clock" size={18} />Làm mới</Button></div>
    <form className="service-filter-card" onSubmit={(event) => { event.preventDefault(); setFilter('search', searchDraft.trim()); }}>
      <Field label="Dịch vụ"><select value={serviceId} onChange={(event) => setFilter('serviceId', event.target.value)} disabled={!data && queue.loading}><option value="">Tất cả dịch vụ được phân công</option>{(data?.services || []).map((service) => <option key={service.id} value={service.id}>{service.serviceName}</option>)}</select></Field>
      <Field label="Mức ưu tiên"><select value={priority} onChange={(event) => setFilter('priority', event.target.value)}><option value="">Tất cả mức ưu tiên</option><option value="URGENT">Khẩn</option><option value="ROUTINE">Thường</option></select></Field>
      <Field label="Tìm yêu cầu / người bệnh"><input type="search" value={searchDraft} maxLength={150} placeholder="Mã yêu cầu, mã hoặc tên người bệnh…" onChange={(event) => setSearchDraft(event.target.value)} /></Field><Button type="submit" variant="secondary"><Icon name="search" size={18} />Tìm kiếm</Button>
    </form>
    {queue.error && <div className="service-alert service-alert--error" role="alert"><span>{queue.error.message || 'Không thể tải hàng chờ dịch vụ.'}</span><Button variant="ghost" onClick={queue.reload}>Thử lại</Button></div>}
    {queue.loading ? <div className="service-loading" role="status">Đang tải hàng chờ dịch vụ…</div> : !queue.error && data && <>
      <div className="service-queue-overview" aria-label="Số lượng công việc"><div><span>Chờ tiếp nhận</span><strong>{data.awaiting?.length || 0}</strong><small>Yêu cầu chưa có người nhận</small></div><div><span>Đã tiếp nhận</span><strong>{data.accepted?.length || 0}</strong><small>Đã nhận, chưa bắt đầu thực hiện</small></div><div><span>Tôi đang thực hiện</span><strong>{data.inProgress?.length || 0}</strong><small>Công việc do bạn phụ trách</small></div></div>
      <p className="service-queue-note"><Icon name="info" size={17} />Yêu cầu khẩn được xếp trước; trong mỗi mức ưu tiên, yêu cầu cũ hơn được hiển thị trước. Mở chi tiết để kiểm tra và tiếp nhận.</p>
      <ServiceQueueSection sectionId="service-awaiting" title="Chờ tiếp nhận" description="Các yêu cầu thuộc dịch vụ bạn được phân công." items={data.awaiting || []} tone="gold" />
      <ServiceQueueSection sectionId="service-accepted" title="Đã tiếp nhận, chưa bắt đầu" description="Kiểm tra người phụ trách trước khi bắt đầu dịch vụ." items={data.accepted || []} />
      <ServiceQueueSection sectionId="service-progress" title="Dịch vụ tôi đang thực hiện" description="Công việc đang thực hiện do bạn chịu trách nhiệm." items={data.inProgress || []} tone="green" />
    </>}
  </div>;
}
