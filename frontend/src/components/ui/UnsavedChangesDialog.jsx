import Modal from './Modal.jsx';
import Button from './Button.jsx';

export default function UnsavedChangesDialog({
  blocker,
  onSave,
  busy = false,
  error,
}) {
  return (
    <Modal
      open={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      title="Có thay đổi chưa lưu"
      busy={busy}
      footer={
        <>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => blocker.reset?.()}
          >
            Ở lại
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => blocker.proceed?.()}
          >
            Bỏ thay đổi và rời đi
          </Button>
          {onSave && (
            <Button loading={busy} onClick={onSave}>
              Lưu và rời đi
            </Button>
          )}
        </>
      }
    >
      <p>
        Nội dung bạn đang nhập chưa được lưu. Bạn có thể tiếp tục chỉnh sửa hoặc
        bỏ thay đổi trước khi rời màn hình.
      </p>
      {error && (
        <div className="clinical-alert clinical-alert--error" role="alert">
          {error.message || error}
        </div>
      )}
    </Modal>
  );
}
