import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';

export default function ExaminationForm({
  draft,
  onChange,
  onSave,
  readOnly,
  busy,
  error,
  dirty,
}) {
  function update(key, value) {
    onChange({ ...draft, [key]: value });
  }
  function diagnosis(index, key, value) {
    const diagnoses = draft.diagnoses.map((item, row) => ({
      ...item,
      ...(row === index
        ? { [key]: value }
        : key === 'primary' && value
          ? { primary: false }
          : {}),
    }));
    update('diagnoses', diagnoses);
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
          <h3>Khám và chẩn đoán</h3>
          <p>
            Lưu từng phần trong quá trình khám. Ba nội dung khám cần đầy đủ khi
            hoàn tất.
          </p>
        </div>
        {dirty && !readOnly && (
          <span className="clinical-unsaved">Chưa lưu</span>
        )}
      </div>
      {error && (
        <div className="clinical-alert clinical-alert--error" role="alert">
          {error.message}
        </div>
      )}
      <div className="clinical-form-grid">
        {[
          ['chiefComplaint', 'Lý do khám'],
          ['symptoms', 'Triệu chứng'],
          ['clinicalFindings', 'Kết quả khám'],
          ['clinicalNotes', 'Ghi chú'],
        ].map(([key, label]) => (
          <Field
            key={key}
            label={label}
            error={error?.fieldErrors?.[key]}
            hint={
              key === 'clinicalNotes'
                ? 'Không bắt buộc.'
                : 'Cần có nội dung khi hoàn tất lượt khám.'
            }
          >
            <textarea
              rows={4}
              value={draft[key]}
              onChange={(event) => update(key, event.target.value)}
              maxLength={10000}
              readOnly={readOnly}
            />
          </Field>
        ))}
      </div>
      <div className="clinical-inline clinical-between">
        <h3>Chẩn đoán</h3>
        {!readOnly && (
          <Button
            variant="secondary"
            onClick={() =>
              update('diagnoses', [
                ...draft.diagnoses,
                {
                  diagnosisCode: '',
                  diagnosisText: '',
                  primary: draft.diagnoses.length === 0,
                },
              ])
            }
          >
            + Thêm chẩn đoán
          </Button>
        )}
      </div>
      {draft.diagnoses.length === 0 && (
        <p className="clinical-muted">
          Chưa có chẩn đoán. Cần ít nhất một chẩn đoán để hoàn tất lượt khám.
        </p>
      )}
      {draft.diagnoses.map((item, index) => (
        <div className="clinical-diagnosis" key={item.id || `new-${index}`}>
          <Field
            label="Mã tham chiếu"
            error={error?.fieldErrors?.[`diagnoses[${index}].diagnosisCode`]}
          >
            <input
              value={item.diagnosisCode || ''}
              onChange={(event) =>
                diagnosis(index, 'diagnosisCode', event.target.value)
              }
              maxLength={30}
              readOnly={readOnly}
            />
          </Field>
          <Field
            label="Nội dung chẩn đoán"
            required
            error={error?.fieldErrors?.[`diagnoses[${index}].diagnosisText`]}
          >
            <input
              value={item.diagnosisText}
              onChange={(event) =>
                diagnosis(index, 'diagnosisText', event.target.value)
              }
              maxLength={1000}
              readOnly={readOnly}
              required
            />
          </Field>
          <label className="clinical-check">
            <input
              type="radio"
              name="primaryDiagnosis"
              checked={Boolean(item.primary)}
              onChange={() => diagnosis(index, 'primary', true)}
              disabled={readOnly}
            />{' '}
            Chẩn đoán chính
          </label>
          {!readOnly && (
            <Button
              variant="ghost"
              aria-label={`Xóa chẩn đoán ${index + 1}`}
              onClick={() =>
                update(
                  'diagnoses',
                  draft.diagnoses.filter((_, row) => row !== index),
                )
              }
            >
              Xóa
            </Button>
          )}
        </div>
      ))}
      {error?.fieldErrors?.diagnoses && (
        <p role="alert" className="ui-field__error">
          {error.fieldErrors.diagnoses}
        </p>
      )}
      {!readOnly && (
        <div className="clinical-form-actions">
          <Button loading={busy} type="submit">
            Lưu nội dung khám
          </Button>
        </div>
      )}
    </form>
  );
}
