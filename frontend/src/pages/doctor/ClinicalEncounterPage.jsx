import { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAsyncResource from '../../hooks/useAsyncResource.js';
import useUnsavedChanges from '../../hooks/useUnsavedChanges.js';
import clinicalService from '../../services/clinicalService.js';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field from '../../components/ui/Field.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import UnsavedChangesDialog from '../../components/ui/UnsavedChangesDialog.jsx';
import PatientSummary from '../../components/clinical/PatientSummary.jsx';
import ExaminationForm from '../../components/clinical/ExaminationForm.jsx';
import TreatmentForm from '../../components/clinical/TreatmentForm.jsx';
import ServiceOrderPanel from '../../components/clinical/ServiceOrderPanel.jsx';
import ResultPanel from '../../components/clinical/ResultPanel.jsx';
import Icon from '../../components/Icon.jsx';
import { formatDate, formatDateTime } from '../../utils/dateTime.js';
import { saveBlob } from '../../utils/download.js';

function examinationDraft(encounter) {
  return {
    chiefComplaint: encounter.chiefComplaint || '',
    symptoms: encounter.symptoms || '',
    clinicalFindings: encounter.clinicalFindings || '',
    clinicalNotes: encounter.clinicalNotes || '',
    diagnoses: (encounter.diagnoses || []).map((item) => ({
      ...item,
      diagnosisCode: item.diagnosisCode || '',
    })),
  };
}

function treatmentDraft(encounter) {
  const follow = encounter.followUps?.[0];
  return {
    decisionText: encounter.treatment?.decisionText || '',
    instructions: encounter.treatment?.instructions || '',
    followUpRequired: encounter.treatment?.followUpRequired || false,
    followUp: {
      reason: follow?.reason || '',
      requestedFromDate: follow?.requestedFromDate || '',
      requestedToDate: follow?.requestedToDate || '',
      priority: follow?.priority || 'ROUTINE',
    },
  };
}

const tabs = [
  ['record', 'Hồ sơ liên quan', 'user'],
  ['examination', 'Khám và chẩn đoán', 'stethoscope'],
  ['services', 'Chỉ định và kết quả', 'clipboard'],
  ['treatment', 'Điều trị và tái khám', 'heart'],
];

export default function ClinicalEncounterPage() {
  const { encounterId } = useParams();
  const loader = useCallback(
    (signal) => clinicalService.getEncounter(encounterId, signal),
    [encounterId],
  );
  const resource = useAsyncResource(loader);
  if (!resource.data || String(resource.data.id) !== encounterId)
    return (
      <div className="clinical-stack">
        <Link to="/doctor/patients">← Danh sách người bệnh</Link>
        {resource.error ? (
          <EmptyState
            title="Không thể mở lượt khám"
            description={resource.error.message}
          >
            <Button onClick={resource.reload}>Thử lại</Button>
          </EmptyState>
        ) : (
          <p role="status">Đang tải lượt khám…</p>
        )}
      </div>
    );
  return (
    <EncounterEditor
      key={encounterId}
      encounter={resource.data}
      onUpdate={resource.setData}
      onRefresh={resource.reload}
      refreshError={resource.error}
      refreshing={resource.loading}
    />
  );
}

function EncounterEditor({
  encounter,
  onUpdate,
  onRefresh,
  refreshError,
  refreshing,
}) {
  const [tab, setTab] = useState('examination');
  const [exam, setExam] = useState(() => examinationDraft(encounter));
  const [savedExam, setSavedExam] = useState(() =>
    JSON.stringify(examinationDraft(encounter)),
  );
  const [treatment, setTreatment] = useState(() => treatmentDraft(encounter));
  const [savedTreatment, setSavedTreatment] = useState(() =>
    JSON.stringify(treatmentDraft(encounter)),
  );
  const [busy, setBusy] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [order, setOrder] = useState(null);
  const [result, setResult] = useState(null);
  const [cancelRequest, setCancelRequest] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [completionOpen, setCompletionOpen] = useState(false);
  const [historyDetail, setHistoryDetail] = useState(null);
  const inFlight = useRef(false);
  const examDirty = JSON.stringify(exam) !== savedExam;
  const treatmentDirty = JSON.stringify(treatment) !== savedTreatment;
  const dirty = examDirty || treatmentDirty;
  const readOnly = encounter.status === 'COMPLETED';
  const blocker = useUnsavedChanges(
    dirty ||
      Boolean(order) ||
      Boolean(result && !result.result?.review && !readOnly && !historyDetail),
  );
  const history = useAsyncResource(
    useCallback(
      (signal) => clinicalService.getHistory(encounter.id, signal),
      [encounter.id],
    ),
    tab === 'record',
  );
  const catalog = useAsyncResource(
    useCallback((signal) => clinicalService.getServices(signal), []),
  );

  async function mutate(name, operation, success) {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(name);
    setError(null);
    setNotice('');
    try {
      const updated = await operation();
      onUpdate(updated);
      success?.(updated);
      setNotice('Đã lưu thay đổi.');
      return true;
    } catch (failure) {
      setError(failure);
      if (failure.status === 409) onRefresh();
      return false;
    } finally {
      inFlight.current = false;
      setBusy('');
    }
  }

  async function saveExamination() {
    return mutate(
      'examination',
      () => clinicalService.saveExamination(encounter.id, exam),
      (updated) => {
        const value = examinationDraft(updated);
        setExam(value);
        setSavedExam(JSON.stringify(value));
      },
    );
  }

  async function saveTreatment() {
    const payload = {
      decisionText: treatment.decisionText,
      instructions: treatment.instructions,
      followUpRequired: treatment.followUpRequired,
    };
    if (treatment.followUpRequired)
      payload.followUp = {
        ...treatment.followUp,
        requestedToDate: treatment.followUp.requestedToDate || null,
      };
    return mutate(
      'treatment',
      () => clinicalService.saveTreatment(encounter.id, payload),
      (updated) => {
        const value = treatmentDraft(updated);
        setTreatment(value);
        setSavedTreatment(JSON.stringify(value));
      },
    );
  }

  async function saveAndLeave() {
    if (examDirty && !(await saveExamination())) return;
    if (treatmentDirty && !(await saveTreatment())) return;
    blocker.proceed?.();
  }

  async function download(request) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy('download');
    setError(null);
    try {
      const blob = await clinicalService.downloadAttachment(
        encounter.id,
        request.id,
      );
      const extension =
        { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' }[
          blob.type
        ] || 'bin';
      saveBlob(blob, `${request.requestCode}.${extension}`);
    } catch (failure) {
      setError(failure);
    } finally {
      inFlight.current = false;
      setBusy('');
    }
  }

  const completionBlockers = [
    ...(dirty ? ['Có nội dung khám hoặc điều trị chưa lưu.'] : []),
    ...(encounter.completionBlockers || []),
  ];
  const activeRequests = encounter.requests.filter((request) =>
    ['ORDERED', 'ACCEPTED', 'IN_PROGRESS'].includes(request.status),
  ).length;
  const unhandledResults = encounter.requests.filter(
    (request) => request.status === 'COMPLETED' && !request.result?.review,
  ).length;

  return (
    <div className="clinical-stack">
      <div className="clinical-page-heading">
        <div>
          <Link className="clinical-back" to="/doctor/patients">
            ← Người bệnh được phân công
          </Link>
          <span className="clinical-overline">S16 · KHÔNG GIAN LƯỢT KHÁM</span>
          <h1>Khám và điều trị</h1>
        </div>
        <div className="clinical-actions">
          <Button
            variant="secondary"
            loading={refreshing}
            disabled={Boolean(busy)}
            onClick={onRefresh}
          >
            <Icon name="clock" size={16} /> Làm mới
          </Button>
          {!readOnly && (
            <Button
              disabled={Boolean(busy)}
              onClick={() => {
                setError(null);
                setCompletionOpen(true);
              }}
            >
              Hoàn tất lượt khám <Icon name="check" size={17} />
            </Button>
          )}
        </div>
      </div>
      <section
        className="clinical-card clinical-patient-banner"
        aria-label="Thông tin lượt khám"
      >
        <PatientSummary patient={encounter.patient} />
        <dl className="clinical-metadata">
          <div>
            <dt>Mã lịch hẹn</dt>
            <dd>{encounter.appointmentCode}</dd>
          </div>
          <div>
            <dt>Bác sĩ phụ trách</dt>
            <dd>{encounter.doctor.fullName}</dd>
          </div>
          <div>
            <dt>Bắt đầu</dt>
            <dd>{formatDateTime(encounter.startedAt)}</dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>
              <StatusBadge
                status={encounter.status}
                label={readOnly ? 'Đã hoàn tất' : 'Đang khám'}
              />
            </dd>
          </div>
        </dl>
      </section>
      {readOnly && (
        <div className="clinical-alert clinical-alert--success">
          <Icon name="check" size={18} />
          <span>
            Lượt khám đã hoàn tất lúc {formatDateTime(encounter.completedAt)}.
            Nội dung lâm sàng đang ở chế độ xem.
          </span>
        </div>
      )}
      {(refreshError || error) &&
        !order &&
        !result &&
        !cancelRequest &&
        !completionOpen && (
          <div className="clinical-alert clinical-alert--error" role="alert">
            {(error || refreshError).message}
          </div>
        )}
      {notice && (
        <div className="clinical-alert clinical-alert--success" role="status">
          {notice}
        </div>
      )}
      <section className="clinical-card clinical-encounter-body">
        <div
          className="clinical-tabs"
          role="tablist"
          aria-label="Nội dung lượt khám"
        >
          {tabs.map(([value, label, icon]) => (
            <button
              key={value}
              type="button"
              id={`tab-${value}`}
              role="tab"
              aria-selected={tab === value}
              aria-controls={`panel-${value}`}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => {
                setTab(value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (
                  ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
                ) {
                  event.preventDefault();
                  const index = tabs.findIndex(([key]) => key === value);
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? tabs.length - 1
                        : (index +
                            (event.key === 'ArrowRight'
                              ? 1
                              : tabs.length - 1)) %
                          tabs.length;
                  setTab(tabs[next][0]);
                  requestAnimationFrame(() =>
                    document.getElementById(`tab-${tabs[next][0]}`)?.focus(),
                  );
                }
              }}
            >
              <Icon name={icon} size={18} />
              {label}
              {value === 'services' && unhandledResults > 0 && (
                <span className="clinical-tab-count">{unhandledResults}</span>
              )}
            </button>
          ))}
        </div>
        <div
          className="clinical-tab-panel"
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
        >
          {tab === 'examination' && (
            <ExaminationForm
              draft={readOnly ? examinationDraft(encounter) : exam}
              onChange={setExam}
              onSave={saveExamination}
              readOnly={readOnly || Boolean(busy)}
              busy={busy === 'examination'}
              error={error}
              dirty={examDirty}
            />
          )}
          {tab === 'treatment' && (
            <TreatmentForm
              draft={readOnly ? treatmentDraft(encounter) : treatment}
              onChange={setTreatment}
              onSave={saveTreatment}
              readOnly={readOnly || Boolean(busy)}
              busy={busy === 'treatment'}
              error={error}
              dirty={treatmentDirty}
            />
          )}
          {tab === 'record' && (
            <div className="clinical-stack">
              <div className="clinical-section-header">
                <div>
                  <h3>Hồ sơ liên quan</h3>
                  <p>
                    Thông tin và bệnh sử của người bệnh thuộc lượt khám hiện
                    tại. Các lượt khám trước chỉ có thể xem.
                  </p>
                </div>
              </div>
              <dl className="clinical-metadata">
                <div>
                  <dt>Ngày sinh</dt>
                  <dd>{formatDate(encounter.patient.dateOfBirth)}</dd>
                </div>
                <div>
                  <dt>Giới tính</dt>
                  <dd>
                    {
                      {
                        MALE: 'Nam',
                        FEMALE: 'Nữ',
                        OTHER: 'Khác',
                        UNSPECIFIED: 'Không cung cấp',
                      }[encounter.patient.gender]
                    }
                  </dd>
                </div>
                <div>
                  <dt>Điện thoại</dt>
                  <dd>{encounter.patient.phone || '—'}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{encounter.patient.contactEmail || '—'}</dd>
                </div>
              </dl>
              <h3>Lịch sử lượt khám</h3>
              {history.loading ? (
                <p role="status">Đang tải lịch sử…</p>
              ) : history.error ? (
                <div
                  role="alert"
                  className="clinical-alert clinical-alert--error"
                >
                  {history.error.message}
                  <Button variant="secondary" onClick={history.reload}>
                    Thử lại
                  </Button>
                </div>
              ) : history.data?.length ? (
                <div className="clinical-table-scroll">
                  <table className="clinical-table">
                    <thead>
                      <tr>
                        <th>Ngày khám</th>
                        <th>Bác sĩ</th>
                        <th>Chẩn đoán</th>
                        <th>Trạng thái</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {history.data.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDateTime(item.startedAt)}</td>
                          <td>{item.doctor.fullName}</td>
                          <td>
                            {item.diagnoses
                              .map((diagnosis) => diagnosis.diagnosisText)
                              .join('; ') || '—'}
                          </td>
                          <td>
                            <StatusBadge status={item.status} />
                          </td>
                          <td>
                            <Button
                              variant="secondary"
                              onClick={() => setHistoryDetail(item)}
                            >
                              Xem chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="Chưa có lượt khám trước"
                  description="Lịch sử sẽ xuất hiện khi người bệnh có lượt khám đã ghi nhận."
                />
              )}
            </div>
          )}
          {tab === 'services' && (
            <div className="clinical-stack">
              <div className="clinical-section-header">
                <div>
                  <h3>Chỉ định và kết quả</h3>
                  <p>
                    {activeRequests} chỉ định chưa hoàn tất · {unhandledResults}{' '}
                    kết quả chưa xử lý lâm sàng
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    disabled={
                      Boolean(busy) || catalog.loading || Boolean(catalog.error)
                    }
                    onClick={() => {
                      setOrder({ mode: 'create' });
                      setError(null);
                    }}
                  >
                    + Tạo chỉ định
                  </Button>
                )}
              </div>
              {catalog.error && (
                <div
                  role="alert"
                  className="clinical-alert clinical-alert--error"
                >
                  {catalog.error.message}
                  <Button variant="secondary" onClick={catalog.reload}>
                    Tải lại danh mục
                  </Button>
                </div>
              )}
              {encounter.requests.length ? (
                <div className="clinical-table-scroll">
                  <table className="clinical-table">
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Ưu tiên</th>
                        <th>Trạng thái</th>
                        <th>Người phụ trách</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {encounter.requests.map((request) => (
                        <tr key={request.id}>
                          <td>
                            <strong>{request.service.serviceName}</strong>
                            <small>{request.requestCode}</small>
                            {request.clinicalIndication && (
                              <p className="clinical-prewrap">
                                {request.clinicalIndication}
                              </p>
                            )}
                            {request.unableReason && (
                              <span className="clinical-error-text">
                                Không thực hiện được: {request.unableReason}
                              </span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={request.priority} />
                          </td>
                          <td>
                            <StatusBadge status={request.status} />
                            {request.status === 'COMPLETED' && (
                              <small>
                                {request.result?.review
                                  ? 'Đã xử lý kết quả'
                                  : 'Cần xử lý kết quả'}
                              </small>
                            )}
                          </td>
                          <td>
                            {request.responsibleStaff?.fullName ||
                              'Chưa tiếp nhận'}
                          </td>
                          <td>
                            <div className="clinical-actions">
                              {request.status === 'ORDERED' && !readOnly && (
                                <>
                                  <Button
                                    variant="secondary"
                                    disabled={Boolean(busy)}
                                    onClick={() => {
                                      setOrder({ mode: 'edit', request });
                                      setError(null);
                                    }}
                                  >
                                    Sửa
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    disabled={Boolean(busy)}
                                    onClick={() => {
                                      setCancelRequest(request);
                                      setCancellationReason('');
                                      setError(null);
                                    }}
                                  >
                                    Hủy
                                  </Button>
                                </>
                              )}
                              {request.result && (
                                <Button
                                  variant="secondary"
                                  disabled={Boolean(busy)}
                                  onClick={() => {
                                    setResult(request);
                                    setError(null);
                                  }}
                                >
                                  Xem kết quả
                                </Button>
                              )}
                              {!request.result &&
                                request.status !== 'ORDERED' && (
                                  <span className="clinical-muted">
                                    Theo dõi
                                  </span>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="Chưa có chỉ định dịch vụ"
                  description="Tạo chỉ định khi cần xét nghiệm, chẩn đoán hình ảnh hoặc dịch vụ khác."
                />
              )}
            </div>
          )}
        </div>
      </section>

      {order && (
        <ServiceOrderPanel
          key={order.request?.id || 'new'}
          services={catalog.data || []}
          request={order.request}
          onClose={() => setOrder(null)}
          busy={Boolean(busy)}
          error={error}
          onSubmit={(payload) =>
            mutate(
              'request',
              () =>
                order.mode === 'edit'
                  ? clinicalService.updateRequest(
                      encounter.id,
                      order.request.id,
                      payload,
                    )
                  : clinicalService.createRequest(encounter.id, payload),
              () => setOrder(null),
            )
          }
        />
      )}
      {result && (
        <ResultPanel
          key={result.id}
          request={result}
          onClose={() => setResult(null)}
          busy={Boolean(busy)}
          error={error}
          readOnly={readOnly || Boolean(historyDetail)}
          onDownload={() => download(result)}
          onReview={(handlingDecision) =>
            mutate(
              'review',
              () =>
                clinicalService.reviewResult(encounter.id, result.result.id, {
                  handlingDecision,
                }),
              () => setResult(null),
            )
          }
        />
      )}
      <Modal
        open={Boolean(cancelRequest)}
        onClose={() => setCancelRequest(null)}
        title="Hủy chỉ định dịch vụ"
        busy={Boolean(busy)}
      >
        <form
          className="clinical-stack"
          onSubmit={(event) => {
            event.preventDefault();
            mutate(
              'cancel',
              () =>
                clinicalService.cancelRequest(encounter.id, cancelRequest.id, {
                  reason: cancellationReason,
                }),
              () => setCancelRequest(null),
            );
          }}
        >
          <p>
            Chỉ định {cancelRequest?.service.serviceName} chỉ được hủy khi chưa
            có nhân viên tiếp nhận.
          </p>
          {error && (
            <div className="clinical-alert clinical-alert--error" role="alert">
              {error.message}
            </div>
          )}
          <Field
            label="Lý do hủy (tùy chọn)"
            error={error?.fieldErrors?.reason}
          >
            <textarea
              rows={3}
              maxLength={500}
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
            />
          </Field>
          <Button variant="danger" loading={Boolean(busy)} type="submit">
            Xác nhận hủy chỉ định
          </Button>
        </form>
      </Modal>
      <Modal
        open={completionOpen}
        onClose={() => setCompletionOpen(false)}
        title="Hoàn tất lượt khám"
        busy={Boolean(busy)}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={Boolean(busy)}
              onClick={() => setCompletionOpen(false)}
            >
              Quay lại hoàn thiện
            </Button>
            <Button
              loading={busy === 'complete'}
              disabled={completionBlockers.length > 0 || Boolean(busy)}
              onClick={() =>
                mutate(
                  'complete',
                  () => clinicalService.completeEncounter(encounter.id),
                  () => setCompletionOpen(false),
                )
              }
            >
              Xác nhận hoàn tất
            </Button>
          </>
        }
      >
        <div className="clinical-stack">
          <p>Hoàn tất sẽ chuyển toàn bộ nội dung lâm sàng sang chế độ xem.</p>
          {completionBlockers.length > 0 ? (
            <div className="clinical-alert clinical-alert--warning">
              <strong>Cần hoàn thiện trước khi kết thúc</strong>
              <ul>
                {completionBlockers.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="clinical-alert clinical-alert--success">
              Các điều kiện đã đầy đủ. Backend sẽ kiểm tra lại trước khi hoàn
              tất.
            </div>
          )}
          {error && (
            <div className="clinical-alert clinical-alert--error" role="alert">
              {error.message}
              {error.blockers?.length > 0 && (
                <ul>
                  {error.blockers.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Modal>
      <Modal
        open={Boolean(historyDetail)}
        onClose={() => setHistoryDetail(null)}
        title="Chi tiết lượt khám trước — chỉ xem"
      >
        <div className="clinical-stack">
          {historyDetail && (
            <>
              <dl className="clinical-metadata">
                <div>
                  <dt>Ngày khám</dt>
                  <dd>{formatDateTime(historyDetail.startedAt)}</dd>
                </div>
                <div>
                  <dt>Bác sĩ</dt>
                  <dd>{historyDetail.doctor.fullName}</dd>
                </div>
              </dl>
              {[
                ['Lý do khám', historyDetail.chiefComplaint],
                ['Triệu chứng', historyDetail.symptoms],
                ['Kết quả khám', historyDetail.clinicalFindings],
                ['Ghi chú', historyDetail.clinicalNotes],
                [
                  'Chẩn đoán',
                  historyDetail.diagnoses
                    .map((item) => item.diagnosisText)
                    .join('; '),
                ],
                ['Điều trị', historyDetail.treatment?.decisionText],
                ['Hướng dẫn', historyDetail.treatment?.instructions],
              ].map(([label, value]) => (
                <div key={label}>
                  <h4>{label}</h4>
                  <p className="clinical-prewrap">{value || '—'}</p>
                </div>
              ))}
              <h4>Kết quả dịch vụ trước đây</h4>
              {historyDetail.requests
                .filter((request) => request.result)
                .map((request) => (
                  <Button
                    key={request.id}
                    variant="secondary"
                    onClick={() => {
                      setResult(request);
                      setError(null);
                    }}
                  >
                    {request.service.serviceName} — Xem kết quả
                  </Button>
                ))}
            </>
          )}
        </div>
      </Modal>
      <UnsavedChangesDialog
        blocker={blocker}
        onSave={
          dirty && !readOnly && !order && !result ? saveAndLeave : undefined
        }
        busy={Boolean(busy)}
        error={error}
      />
    </div>
  );
}
