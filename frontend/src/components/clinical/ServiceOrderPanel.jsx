import { useRef, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';

export default function ServiceOrderPanel({
  services,
  request,
  onClose,
  onSubmit,
  error,
  busy,
}) {
  const [draft, setDraft] = useState({
    medicalServiceId: request?.service?.id || '',
    priority: request?.priority || 'ROUTINE',
    clinicalIndication: request?.clinicalIndication || '',
  });
  const key = useRef(crypto.randomUUID());
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  function change(field, value) {
    key.current = crypto.randomUUID();
    setDirty(true);
    setDraft({ ...draft, [field]: value });
  }
  function close() {
    if (dirty) setDiscard(true);
    else onClose();
  }
  return (
    <>
      <Modal
        open
        onClose={close}
        title={request ? 'Sửa chỉ định dịch vụ' : 'Tạo chỉ định dịch vụ'}
        busy={busy}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({
              ...draft,
              medicalServiceId: Number(draft.medicalServiceId),
              idempotencyKey: key.current,
            });
          }}
        >
          <fieldset disabled={busy} className="clinical-stack">
            <p className="clinical-muted">
              Chỉ định được tạo cho người bệnh và lượt khám hiện tại. Bác sĩ chỉ
              định lấy từ tài khoản đăng nhập.
            </p>
            {error && (
              <div
                role="alert"
                className="clinical-alert clinical-alert--error"
              >
                {error.message}
              </div>
            )}
            <Field
              label="Dịch vụ y tế"
              required
              error={error?.fieldErrors?.medicalServiceId}
            >
              <select
                required
                value={draft.medicalServiceId}
                onChange={(event) =>
                  change('medicalServiceId', event.target.value)
                }
              >
                <option value="">Chọn dịch vụ</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.serviceName} · {service.serviceCode}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Mức ưu tiên"
              required
              error={error?.fieldErrors?.priority}
            >
              <select
                value={draft.priority}
                onChange={(event) => change('priority', event.target.value)}
              >
                <option value="ROUTINE">Thông thường</option>
                <option value="URGENT">Khẩn</option>
              </select>
            </Field>
            <Field
              label="Chỉ dẫn chuyên môn"
              error={error?.fieldErrors?.clinicalIndication}
            >
              <textarea
                rows={4}
                value={draft.clinicalIndication}
                onChange={(event) =>
                  change('clinicalIndication', event.target.value)
                }
                maxLength={10000}
              />
            </Field>
            <Button type="submit" loading={busy}>
              {request ? 'Lưu thay đổi' : 'Tạo chỉ định'}
            </Button>
          </fieldset>
        </form>
      </Modal>
      <Modal
        open={discard}
        onClose={() => setDiscard(false)}
        title="Bỏ nội dung chỉ định?"
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
        <p>Những thông tin chưa gửi sẽ không được lưu.</p>
      </Modal>
    </>
  );
}
