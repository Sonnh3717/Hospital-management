import { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Modal from '../../components/ui/Modal.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import UnsavedChangesDialog from '../../components/ui/UnsavedChangesDialog.jsx';
import Icon from '../../components/Icon.jsx';
import PatientSummary from '../../components/clinical/PatientSummary.jsx';
import ResultPanel from '../../components/clinical/ResultPanel.jsx';
import useAsyncResource from '../../hooks/useAsyncResource.js';
import useAuth from '../../hooks/useAuth.js';
import useUnsavedChanges from '../../hooks/useUnsavedChanges.js';
import medicalServiceWorkflowService from '../../services/medicalServiceWorkflowService.js';
import { formatDateTime } from '../../utils/dateTime.js';
import { saveBlob } from '../../utils/download.js';
import '../../styles/clinical.css';
import '../../styles/medicalservice.css';

const maxAttachmentSize = 10 * 1024 * 1024;
const allowedFileTypes = ['application/pdf', 'image/png', 'image/jpeg'];

export default function ServiceRequestPage() {
  const { requestId } = useParams();
  return <ServiceRequestWorkspace key={requestId} requestId={requestId} />;
}

function ServiceRequestWorkspace({ requestId }) {
  const { user } = useAuth();
  const resource = useAsyncResource(useCallback((signal) => medicalServiceWorkflowService.getRequest(requestId, signal), [requestId]));
  const request = resource.data;
  const [resultSummary, setResultSummary] = useState('');
  const [resultContent, setResultContent] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [unableReason, setUnableReason] = useState('');
  const [dialog, setDialog] = useState(null);
  const [viewResult, setViewResult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState('');
  const mutationInFlight = useRef(false);
  const downloadInFlight = useRef(false);
  const fileInput = useRef(null);
  const resultDirty = Boolean(resultSummary || resultContent || attachment);
  const dirty = resultDirty || Boolean(unableReason);
  const blocker = useUnsavedChanges(dirty || busy);
  const owned = Boolean(request?.responsibleStaff?.id != null && user?.staffId != null && String(request.responsibleStaff.id) === String(user.staffId));
  const ordered = request?.status === 'ORDERED';
  const canStart = request?.status === 'ACCEPTED' && owned;
  const canComplete = request?.status === 'IN_PROGRESS' && owned;
  const canUnable = ordered || (owned && ['ACCEPTED', 'IN_PROGRESS'].includes(request?.status));
  const locked = busy || resource.loading || Boolean(resource.error);
  const terminal = ['COMPLETED', 'CANCELLED', 'UNABLE_TO_PERFORM'].includes(request?.status);

  function clearDraft() {
    setResultSummary(''); setResultContent(''); setAttachment(null); setUnableReason('');
    setFieldErrors({});
    if (fileInput.current) fileInput.current.value = '';
  }

  function setField(name, value) {
    if (name === 'resultSummary') setResultSummary(value);
    if (name === 'resultContent') setResultContent(value);
    if (name === 'reason') setUnableReason(value);
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function mutate(action) {
    if (mutationInFlight.current || resource.loading || resource.error) return;
    mutationInFlight.current = true;
    setBusy(true); setActionError(null); setNotice('');
    try {
      let next;
      if (action === 'accept') next = await medicalServiceWorkflowService.accept(requestId);
      if (action === 'start') next = await medicalServiceWorkflowService.start(requestId);
      if (action === 'unable') next = await medicalServiceWorkflowService.unable(requestId, unableReason.trim());
      if (action === 'complete') {
        const payload = new FormData();
        payload.append('resultSummary', resultSummary.trim());
        payload.append('resultContent', resultContent.trim());
        if (attachment) payload.append('attachment', attachment);
        next = await medicalServiceWorkflowService.complete(requestId, payload);
      }
      resource.setData(next);
      setDialog(null);
      if (action === 'complete' || action === 'unable') clearDraft();
      const notices = { accept: 'Bạn đã tiếp nhận trách nhiệm thực hiện dịch vụ.', start: 'Đã bắt đầu thực hiện dịch vụ.', complete: 'Đã hoàn tất dịch vụ và lưu kết quả chính thức.', unable: 'Đã ghi nhận dịch vụ không thể thực hiện và lý do.' };
      setNotice(notices[action]);
    } catch (error) {
      setActionError(error);
      setFieldErrors(error.fieldErrors || {});
      if (error.status === 409) {
        setDialog(null);
        resource.reload();
      }
    } finally {
      mutationInFlight.current = false;
      setBusy(false);
    }
  }

  function prepareComplete(event) {
    event.preventDefault();
    if (!canComplete || locked) return;
    const errors = {};
    if (!resultSummary.trim()) errors.resultSummary = 'Vui lòng nhập tóm tắt kết quả.';
    if (!resultContent.trim()) errors.resultContent = 'Vui lòng nhập nội dung báo cáo.';
    setFieldErrors(errors);
    if (!Object.keys(errors).length) { setActionError(null); setDialog('complete'); }
  }

  function selectAttachment(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    let error;
    if (file.size === 0) error = 'Tệp đính kèm đang trống. Vui lòng chọn một báo cáo có nội dung.';
    else if (file.size > maxAttachmentSize) error = 'Tệp đính kèm phải có dung lượng tối đa 10 MiB.';
    else if (!/\.(pdf|png|jpe?g)$/i.test(file.name) || (file.type && !allowedFileTypes.includes(file.type))) error = 'Chỉ nhận một tệp PDF, PNG hoặc JPEG.';
    if (error) { event.target.value = ''; setFieldErrors((previous) => ({ ...previous, attachment: error })); return; }
    setAttachment(file);
    setFieldErrors((previous) => ({ ...previous, attachment: undefined }));
  }

  async function downloadAttachment() {
    if (downloadInFlight.current) return;
    downloadInFlight.current = true;
    setDownloading(true); setDownloadError(null);
    try {
      const blob = await medicalServiceWorkflowService.downloadAttachment(requestId);
      const extension = blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : 'bin';
      saveBlob(blob, `Ket-qua-${request.requestCode}.${extension}`);
    } catch (error) { setDownloadError(error); }
    finally { downloadInFlight.current = false; setDownloading(false); }
  }

  function submitUnable(event) {
    event.preventDefault();
    if (!canUnable || locked) return;
    if (!unableReason.trim()) { setFieldErrors((previous) => ({ ...previous, reason: 'Vui lòng nhập lý do không thể thực hiện.' })); return; }
    mutate('unable');
  }

  return <div className="service-page service-stack">
    <Link className="service-back-link" to="/services/queue"><Icon name="arrow-left" size={18} />Trở về hàng chờ dịch vụ</Link>
    {resource.loading && !request ? <div className="service-loading" role="status">Đang tải yêu cầu dịch vụ…</div> : null}
    {resource.error && <div className="service-alert service-alert--error" role="alert"><span>{resource.error.message || 'Không thể tải yêu cầu dịch vụ.'}</span><Button variant="ghost" onClick={resource.reload}>Thử lại</Button></div>}
    {request && <>
      <div className="service-page-heading"><div><span className="service-eyebrow">{request.requestCode}</span><h1>{request.service?.serviceName || 'Yêu cầu dịch vụ'}</h1><p>Kiểm tra chỉ định, thực hiện dịch vụ và ghi nhận kết quả.</p></div><div className="service-heading-status"><StatusBadge status={request.priority} /><StatusBadge status={request.status} /><Button variant="ghost" loading={resource.loading} disabled={busy} onClick={resource.reload}><Icon name="clock" size={16} />Làm mới</Button></div></div>
      {notice && <div className="service-alert service-alert--success" role="status"><Icon name="check" size={18} /><span>{notice}</span></div>}
      {actionError && <div className="service-alert service-alert--error" role="alert"><Icon name="info" size={18} /><div>{actionError.message}{actionError.status === 409 && <p>Trạng thái đã thay đổi. Thông tin mới nhất đang được tải lại; nội dung bạn nhập được giữ nguyên.</p>}</div></div>}
      <div className="service-detail-grid"><section className="service-card"><h2>Thông tin người bệnh</h2><PatientSummary compact patient={request.patient} /><p className="service-muted service-detail-note">Đối chiếu thông tin người bệnh trước khi bắt đầu thực hiện.</p></section><section className="service-card"><h2>Thông tin chỉ định</h2><dl className="service-metadata"><div><dt>Bác sĩ chỉ định</dt><dd>{request.requestingDoctor?.fullName || '—'}</dd></div><div><dt>Thời điểm chỉ định</dt><dd>{formatDateTime(request.requestedAt)}</dd></div><div><dt>Mã dịch vụ</dt><dd>{request.service?.serviceCode || '—'}</dd></div></dl><div className="service-indication"><h3>Chỉ dẫn chuyên môn</h3><p className="service-prewrap">{request.clinicalIndication || 'Không có chỉ dẫn bổ sung.'}</p></div></section></div>
      <section className="service-card"><div className="service-section-heading service-section-heading--flush"><div><h2>Tiến trình thực hiện</h2><p>Người phụ trách: <strong>{request.responsibleStaff?.fullName || 'Chưa tiếp nhận'}</strong></p></div><StatusBadge status={request.status} /></div><ol className="service-timeline"><li className={request.requestedAt ? 'is-done' : ''}><span>Đã chỉ định</span><time>{formatDateTime(request.requestedAt)}</time></li><li className={request.acceptedAt ? 'is-done' : ''}><span>Đã tiếp nhận</span><time>{formatDateTime(request.acceptedAt)}</time></li><li className={request.startedAt ? 'is-done' : ''}><span>Bắt đầu thực hiện</span><time>{formatDateTime(request.startedAt)}</time></li><li className={request.completedAt ? 'is-done' : ''}><span>Hoàn tất</span><time>{formatDateTime(request.completedAt)}</time></li></ol>
        {request.responsibleStaff && !owned && !terminal && <div className="service-alert"><Icon name="shield" size={18} /><span>Yêu cầu do {request.responsibleStaff.fullName} phụ trách. Bạn có thể xem thông tin và theo dõi tiến độ.</span></div>}
        {(ordered || canStart || canUnable) && <div className="service-action-bar">{ordered && <Button loading={busy} disabled={locked} onClick={() => mutate('accept')}><Icon name="check" size={18} />Tiếp nhận yêu cầu</Button>}{canStart && <Button loading={busy} disabled={locked} onClick={() => mutate('start')}><Icon name="arrow-right" size={18} />Bắt đầu dịch vụ</Button>}{canUnable && <Button variant="secondary" disabled={locked} onClick={() => { setActionError(null); setDialog('unable'); }}>Không thể thực hiện</Button>}</div>}
      </section>
      {(canComplete || resultDirty) && <section className="service-card"><div className="service-section-heading service-section-heading--flush"><div><h2>Ghi nhận kết quả</h2><p>Kết quả được lưu chính thức khi bạn xác nhận hoàn tất dịch vụ.</p></div>{resultDirty && <span className="service-draft-label">Có nội dung chưa gửi</span>}</div>
        {!canComplete && <div className="service-alert" role="status"><span>Yêu cầu đã thay đổi trạng thái hoặc người phụ trách. Nội dung chưa gửi của bạn vẫn được giữ bên dưới để đối chiếu.</span><Button variant="secondary" disabled={locked} onClick={clearDraft}>Bỏ nội dung chưa gửi</Button></div>}
        <form className="service-stack service-result-form" onSubmit={prepareComplete}>
          {request.service?.resultRequirements && <div className="service-requirements"><h3>Hướng dẫn ghi kết quả</h3><p className="service-prewrap">{request.service.resultRequirements}</p></div>}
          <Field label="Tóm tắt kết quả" required error={fieldErrors.resultSummary}><textarea rows={3} value={resultSummary} maxLength={10000} disabled={!canComplete || locked} onChange={(event) => setField('resultSummary', event.target.value)} placeholder="Nhập kết luận hoặc tóm tắt kết quả dịch vụ…" /></Field>
          <Field label="Nội dung báo cáo" required error={fieldErrors.resultContent}><textarea rows={8} value={resultContent} maxLength={1000000} disabled={!canComplete || locked} onChange={(event) => setField('resultContent', event.target.value)} placeholder="Nhập nội dung báo cáo phù hợp với dịch vụ…" /></Field>
          <Field label="Tệp báo cáo" error={fieldErrors.attachment} hint="Tối đa một tệp PDF, PNG hoặc JPEG; dung lượng tối đa 10 MiB."><input ref={fileInput} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" disabled={!canComplete || locked} onChange={selectAttachment} /></Field>
          {attachment && <div className="service-file-preview"><span>{attachment.name} <small>({(attachment.size / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} MiB)</small></span><Button variant="ghost" disabled={locked} onClick={() => { setAttachment(null); if (fileInput.current) fileInput.current.value = ''; }}>Gỡ tệp</Button></div>}
          <div className="service-result-footer"><p className="service-muted">Người ghi nhận và thời điểm hoàn tất được ghi tự động khi lưu kết quả.</p><Button type="submit" loading={busy} disabled={!canComplete || locked}>Hoàn tất dịch vụ và kết quả</Button></div>
        </form>
      </section>}
      {request.status === 'COMPLETED' && <section className="service-card"><div className="service-section-heading service-section-heading--flush"><div><h2>Kết quả dịch vụ</h2><p>Đã chốt lúc {formatDateTime(request.result?.finalizedAt || request.completedAt)} · {request.result?.recordedBy?.fullName || request.responsibleStaff?.fullName}</p></div><Button variant="secondary" disabled={!request.result} onClick={() => { setDownloadError(null); setViewResult(true); }}>Xem kết quả</Button></div>{request.result ? <p className="service-prewrap">{request.result.resultSummary}</p> : <div className="service-alert service-alert--error" role="alert">Chưa tải được kết quả của yêu cầu đã hoàn tất. Vui lòng làm mới.</div>}</section>}
      {request.status === 'UNABLE_TO_PERFORM' && <section className="service-card service-card--exception"><h2>Không thể thực hiện dịch vụ</h2><p className="service-muted">Ghi nhận lúc {formatDateTime(request.unableAt)}</p><h3>Lý do</h3><p className="service-prewrap">{request.unableReason || '—'}</p></section>}
      {request.status === 'CANCELLED' && <section className="service-card"><h2>Chỉ định đã hủy</h2><p className="service-muted">Hủy lúc {formatDateTime(request.cancelledAt)}</p><p className="service-prewrap">{request.cancellationReason || 'Không có lý do bổ sung.'}</p></section>}
      {unableReason && !canUnable && <div className="service-alert"><span>Lý do ngoại lệ chưa gửi: {unableReason}</span><Button variant="secondary" disabled={locked} onClick={() => setUnableReason('')}>Bỏ lý do chưa gửi</Button></div>}
      {terminal && <div><Link className="ui-button ui-button--secondary" to="/services/queue"><Icon name="arrow-left" size={18} />Trở về hàng chờ</Link></div>}
    </>}
    <Modal open={dialog === 'complete'} title="Hoàn tất dịch vụ và lưu kết quả" onClose={() => setDialog(null)} busy={busy} footer={<><Button variant="secondary" disabled={busy} onClick={() => setDialog(null)}>Tiếp tục chỉnh sửa</Button><Button loading={busy} disabled={!canComplete || resource.loading} onClick={() => mutate('complete')}>Xác nhận hoàn tất</Button></>}><div className="service-stack"><p>Kết quả được chốt sau khi xác nhận. Vui lòng kiểm tra người bệnh, nội dung báo cáo và tệp đính kèm trước khi gửi.</p><dl className="service-metadata"><div><dt>Người bệnh</dt><dd>{request?.patient?.fullName} · {request?.patient?.patientCode}</dd></div><div><dt>Dịch vụ</dt><dd>{request?.service?.serviceName}</dd></div><div><dt>Tệp báo cáo</dt><dd>{attachment?.name || 'Không có tệp đính kèm'}</dd></div></dl><div><h3>Tóm tắt kết quả</h3><p className="service-prewrap">{resultSummary}</p></div>{actionError && <div className="service-alert service-alert--error" role="alert">{actionError.message}</div>}</div></Modal>
    <Modal open={dialog === 'unable'} title="Ghi nhận không thể thực hiện" onClose={() => setDialog(null)} busy={busy} footer={<><Button variant="secondary" disabled={busy} onClick={() => setDialog(null)}>Quay lại</Button><Button variant="danger" type="submit" form="unable-service-form" loading={busy} disabled={!canUnable || resource.loading}>Xác nhận không thể thực hiện</Button></>}><form id="unable-service-form" className="service-stack" onSubmit={submitUnable}><p>Nhập lý do để bác sĩ chỉ định biết và quyết định bước tiếp theo.</p><Field label="Lý do không thể thực hiện" required error={fieldErrors.reason}><textarea rows={5} maxLength={10000} value={unableReason} disabled={locked} onChange={(event) => setField('reason', event.target.value)} placeholder="Ghi rõ lý do không thể bắt đầu hoặc hoàn tất dịch vụ…" /></Field>{resultDirty && <div className="service-alert">Nội dung kết quả chưa gửi sẽ được bỏ sau khi bạn xác nhận không thể thực hiện dịch vụ.</div>}{actionError && <div className="service-alert service-alert--error" role="alert">{actionError.message}</div>}</form></Modal>
    {viewResult && request && <ResultPanel request={request} readOnly onClose={() => setViewResult(false)} onDownload={downloadAttachment} busy={downloading} error={downloadError} />}
    <UnsavedChangesDialog blocker={blocker} busy={busy} />
  </div>;
}
