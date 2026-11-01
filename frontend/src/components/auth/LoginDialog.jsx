import Modal from '../ui/Modal.jsx';
import LoginForm from './LoginForm.jsx';
import { useState } from 'react';
import '../../styles/auth.css';

export default function LoginDialog({ open, onClose, redirect = true }) {
  const [busy, setBusy] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Đăng nhập SWD Care" busy={busy}>
      <p className="clinical-muted">
        Đăng nhập bằng tài khoản người bệnh hoặc tài khoản nhân viên được cấp.
      </p>
      <LoginForm
        onSuccess={onClose}
        redirect={redirect}
        onBusyChange={setBusy}
      />
    </Modal>
  );
}
