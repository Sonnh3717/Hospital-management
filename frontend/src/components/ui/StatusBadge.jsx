import '../../styles/workspace.css';

const statuses = {
  BOOKED: ['Đã đặt lịch', 'blue'],
  CHECKED_IN: ['Đã tiếp nhận khám', 'green'],
  NO_SHOW: ['Vắng mặt', 'gray'],
  ORDERED: ['Chờ tiếp nhận', 'gold'],
  ACCEPTED: ['Đã tiếp nhận', 'blue'],
  IN_PROGRESS: ['Đang thực hiện', 'blue'],
  COMPLETED: ['Hoàn tất', 'green'],
  CANCELLED: ['Đã hủy', 'gray'],
  UNABLE_TO_PERFORM: ['Không thể thực hiện', 'red'],
  ROUTINE: ['Thường', 'gray'],
  URGENT: ['Khẩn', 'red'],
  PENDING: ['Chờ xử lý', 'gold'],
  APPROVED: ['Đã duyệt', 'green'],
  REJECTED: ['Đã từ chối', 'red'],
  SCHEDULED: ['Đã xếp lịch', 'blue'],
  OPEN: ['Đang mở', 'green'],
  BLOCKED: ['Đã chặn', 'gray'],
  FULL: ['Đã đủ chỗ', 'gold'],
  DRAFT: ['Bản nháp', 'gray'],
  ISSUED: ['Đã phát hành', 'blue'],
  VOID: ['Đã hủy hiệu lực', 'gray'],
  SUCCEEDED: ['Thành công', 'green'],
  FAILED: ['Thất bại', 'red'],
  NEW: ['Mới', 'blue'],
  RESOLVED: ['Đã xử lý', 'green'],
  ACTIVE: ['Đang hoạt động', 'green'],
  INACTIVE: ['Ngừng hoạt động', 'gray'],
};

export default function StatusBadge({ status, label, children, className = '' }) {
  const [defaultLabel, tone] = statuses[String(status || '').toUpperCase()] || ['Chưa xác định', 'gray'];
  return <span className={`ui-status ui-status--${tone} ${className}`.trim()}><span aria-hidden="true" />{children || label || defaultLabel}</span>;
}
