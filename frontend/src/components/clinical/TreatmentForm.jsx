import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import { todayInVietnam } from '../../utils/dateTime.js';

export default function TreatmentForm({
  draft,
  onChange,
  onSave,
  readOnly,
  busy,
  error,
  dirty,
}) {
  const follow = draft.followUp;
  function update(key, value) {
    onChange({ ...draft, [key]: value });
  }
  function updateFollow(key, value) {
    onChange({ ...draft, followUp: { ...follow, [key]: value } });
  }
  return (
    <form
      className="clinical-stack"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="clinical-section-header">
        <div>
          <h3>Điều trị và tái khám</h3>
          <p>Ghi quyết định điều trị và hướng dẫn dành cho người bệnh.</p>
        </div>
        {dirty && !readOnly && (
          <span className="clinical-unsaved">Chưa lưu</span>
        )}
      </div>
      {error && (
        <div role="alert" className="clinical-alert clinical-alert--error">
          {error.message}
        </div>
      )}
      <Field
        label="Quyết định điều trị"
        required
        error={error?.fieldErrors?.decisionText}
      >
        <textarea
          rows={5}
          value={draft.decisionText}
          onChange={(event) => update('decisionText', event.target.value)}
          maxLength={10000}
          required
          readOnly={readOnly}
        />
      </Field>
      <Field
        label="Hướng dẫn người bệnh"
        error={error?.fieldErrors?.instructions}
      >
        <textarea
          rows={4}
          value={draft.instructions}
          onChange={(event) => update('instructions', event.target.value)}
          maxLength={10000}
          readOnly={readOnly}
        />
      </Field>
      <label className="clinical-check">
        <input
          type="checkbox"
          checked={draft.followUpRequired}
          onChange={(event) => update('followUpRequired', event.target.checked)}
          disabled={readOnly}
        />{' '}
        Cần tái khám
      </label>
      {draft.followUpRequired && (
        <div className="clinical-follow-up clinical-stack">
          <h4>Yêu cầu tái khám</h4>
          <p className="clinical-muted">
            Đây là yêu cầu tái khám, chưa phải lịch hẹn có khung giờ cụ thể.
          </p>
          <Field
            label="Lý do tái khám"
            required
            error={error?.fieldErrors?.['followUp.reason']}
          >
            <textarea
              rows={3}
              value={follow.reason}
              onChange={(event) => updateFollow('reason', event.target.value)}
              maxLength={10000}
              required
              readOnly={readOnly}
            />
          </Field>
          <div className="clinical-form-grid">
            <Field
              label="Từ ngày"
              required
              error={error?.fieldErrors?.['followUp.requestedFromDate']}
            >
              <input
                type="date"
                min={todayInVietnam()}
                value={follow.requestedFromDate}
                onChange={(event) =>
                  updateFollow('requestedFromDate', event.target.value)
                }
                required
                readOnly={readOnly}
              />
            </Field>
            <Field
              label="Đến ngày (tùy chọn)"
              error={error?.fieldErrors?.['followUp.requestedToDate']}
            >
              <input
                type="date"
                min={follow.requestedFromDate || todayInVietnam()}
                value={follow.requestedToDate}
                onChange={(event) =>
                  updateFollow('requestedToDate', event.target.value)
                }
                readOnly={readOnly}
              />
            </Field>
            <Field
              label="Mức ưu tiên"
              required
              error={error?.fieldErrors?.['followUp.priority']}
            >
              <select
                value={follow.priority}
                onChange={(event) =>
                  updateFollow('priority', event.target.value)
                }
                disabled={readOnly}
              >
                <option value="ROUTINE">Thông thường</option>
                <option value="URGENT">Khẩn</option>
              </select>
            </Field>
          </div>
        </div>
      )}
      {!readOnly && (
        <div className="clinical-form-actions">
          <Button loading={busy} type="submit">
            Lưu điều trị và tái khám
          </Button>
        </div>
      )}
    </form>
  );
}
