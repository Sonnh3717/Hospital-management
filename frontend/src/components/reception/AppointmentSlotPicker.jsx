import { useCallback, useState } from 'react';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import useAsyncResource from '../../hooks/useAsyncResource.js';
import receptionService from '../../services/receptionService.js';
import { formatTime, todayInVietnam } from '../../utils/dateTime.js';

export default function AppointmentSlotPicker({ date, doctorId, slotId, onDateChange, onDoctorChange, onSlotChange, walkIn = false, disabled = false, fieldErrors = {}, excludeSlotId }) {
  const [openedAt] = useState(Date.now);
  const options = useAsyncResource(useCallback((signal) => receptionService.getOptions(date, { signal }), [date]), Boolean(date));
  const slots = (options.data?.slots || []).filter((slot) => slot.remaining > 0 && (!doctorId || String(slot.doctorId) === String(doctorId)) && String(slot.id) !== String(excludeSlotId) && (!walkIn || new Date(slot.endsAt).getTime() > openedAt));
  return <div className="work-form-stack">
    <div className="work-form-grid"><Field label="Ngày khám" required><input type="date" value={date} min={todayInVietnam()} disabled={disabled || walkIn} onChange={(event) => onDateChange(event.target.value)} /></Field><Field label="Bác sĩ"><select value={doctorId} disabled={disabled || options.loading} onChange={(event) => onDoctorChange(event.target.value)}><option value="">Tất cả bác sĩ</option>{(options.data?.doctors || []).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.fullName} {doctor.specialization ? `· ${doctor.specialization}` : ''}</option>)}</select></Field></div>
    <Field label="Khung giờ khám còn chỗ" required error={fieldErrors.slotId} hint={walkIn ? 'Khám trực tiếp sử dụng khung giờ hôm nay chưa kết thúc.' : 'Khung giờ phải đáp ứng quy định đặt lịch của cơ sở.'}><select value={slotId} disabled={disabled || options.loading} onChange={(event) => onSlotChange(event.target.value)}><option value="">{options.loading ? 'Đang tải khung giờ…' : 'Chọn khung giờ khám'}</option>{slots.map((slot) => <option key={slot.id} value={slot.id}>{formatTime(slot.startsAt)}–{formatTime(slot.endsAt)} · {slot.doctorName} · Còn {slot.remaining} chỗ</option>)}</select></Field>
    <div><Button variant="ghost" loading={options.loading} disabled={disabled || !date} onClick={options.reload}>Làm mới khung giờ</Button></div>
    {options.error && <div className="work-notice work-notice--error" role="alert">{options.error.message}<Button variant="ghost" disabled={disabled} onClick={options.reload}>Thử lại</Button></div>}
    {!options.loading && !options.error && slots.length === 0 && <p className="work-muted">Chưa có khung giờ phù hợp còn chỗ. Vui lòng chọn bác sĩ hoặc ngày khác.</p>}
  </div>;
}
