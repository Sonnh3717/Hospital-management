import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Field from "../ui/Field.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import { formatDateTime } from "../../utils/dateTime.js";

export default function ResultPanel({
  request,
  onClose,
  onReview,
  onDownload,
  busy = false,
  error,
  readOnly = false,
}) {
  const [decision, setDecision] = useState("");
  const [discard, setDiscard] = useState(false);
  const result = request?.result;
  function close() {
    if (decision && onReview && !readOnly && !result?.review) setDiscard(true);
    else onClose();
  }
  return (
    <>
      <Modal
        open={Boolean(request)}
        onClose={close}
        title="Kết quả dịch vụ"
        busy={busy}
      >
        {result && (
          <div className="clinical-stack">
            <div className="clinical-inline">
              <h3>{request.service.serviceName}</h3>
              <StatusBadge
                status={result.review ? "REVIEWED" : "COMPLETED"}
                label={
                  result.review ? "Đã xử lý lâm sàng" : "Chưa xử lý lâm sàng"
                }
              />
            </div>
            <dl className="clinical-metadata">
              <div>
                <dt>Người ghi nhận</dt>
                <dd>{result.recordedBy?.fullName || "—"}</dd>
              </div>
              <div>
                <dt>Hoàn tất lúc</dt>
                <dd>{formatDateTime(result.finalizedAt)}</dd>
              </div>
            </dl>
            <div>
              <h4>Tóm tắt kết quả</h4>
              <p className="clinical-prewrap">{result.resultSummary}</p>
            </div>
            <div>
              <h4>Nội dung báo cáo</h4>
              <p className="clinical-prewrap">{result.resultContent}</p>
            </div>
            {result.attachmentUrl && (
              <Button variant="secondary" loading={busy} onClick={onDownload}>
                Tải tệp báo cáo
              </Button>
            )}
            {error && (
              <div
                role="alert"
                className="clinical-alert clinical-alert--error"
              >
                {error.message}
              </div>
            )}
            {result.review ? (
              <div className="clinical-alert clinical-alert--success">
                <strong>Quyết định xử lý kết quả</strong>
                <p className="clinical-prewrap">
                  {result.review.handlingDecision}
                </p>
                <small>
                  {result.review.reviewingDoctor?.fullName} ·{" "}
                  {formatDateTime(result.review.handledAt)}
                </small>
              </div>
            ) : onReview && !readOnly ? (
              <form
                className="clinical-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (decision.trim()) onReview(decision);
                }}
              >
                <Field
                  label="Quyết định xử lý kết quả"
                  required
                  error={error?.fieldErrors?.handlingDecision}
                >
                  <textarea
                    rows={4}
                    value={decision}
                    onChange={(event) => setDecision(event.target.value)}
                    maxLength={10000}
                    required
                    readOnly={busy}
                  />
                </Field>
                <p className="clinical-muted">
                  Việc mở hoặc tải báo cáo chưa ghi nhận kết quả là đã xử lý.
                </p>
                <Button loading={busy} type="submit">
                  Xác nhận xử lý kết quả
                </Button>
              </form>
            ) : (
              <p className="clinical-muted">
                Chưa có xác nhận xử lý lâm sàng của bác sĩ.
              </p>
            )}
          </div>
        )}
      </Modal>
      <Modal
        open={discard}
        onClose={() => setDiscard(false)}
        title="Bỏ quyết định chưa gửi?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDiscard(false)}>
              Tiếp tục nhập
            </Button>
            <Button variant="danger" onClick={onClose}>
              Bỏ thay đổi
            </Button>
          </>
        }
      >
        <p>Quyết định xử lý kết quả chưa được gửi và sẽ bị bỏ khi đóng.</p>
      </Modal>
    </>
  );
}
