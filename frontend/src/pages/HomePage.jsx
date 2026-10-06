import { useState } from 'react';
import systemService from '../services/systemService.js';

export default function HomePage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function checkConnection() {
    setLoading(true);
    setStatus('');
    try {
      const result = await systemService.getHealth();
      setStatus(result.status === 'UP'
        ? 'Đã kết nối với backend.'
        : 'Backend trả về trạng thái không xác định.');
    } catch {
      setStatus('Chưa kết nối được. Kiểm tra backend và địa chỉ API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="starter-card">
      <p className="eyebrow">DỰ ÁN SWD</p>
      <h1>Bắt đầu dự án mới</h1>
      <p>Khung giao diện đã sẵn sàng để phát triển các tính năng của bạn.</p>
      <button type="button" onClick={checkConnection} disabled={loading}>
        {loading ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}
      </button>
      <p role="status" aria-live="polite">{status}</p>
    </section>
  );
}

