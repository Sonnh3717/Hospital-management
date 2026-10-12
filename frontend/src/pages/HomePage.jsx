import { useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  doctors,
  specialties,
  getBookingDays,
  getPreviewSlots,
  getVietnamDate,
  formatAppointmentDate,
} from '../data/appointmentPreview.js';

export default function HomePage() {
  const [bookingDays] = useState(getBookingDays);
  const [specialty, setSpecialty] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(() => bookingDays[0].value);
  const [customDate, setCustomDate] = useState(false);
  const [slotId, setSlotId] = useState('');
  const [slotError, setSlotError] = useState('');
  const [preview, setPreview] = useState(null);
  const dateInput = useRef(null);
  const slotGroup = useRef(null);
  const previewPanel = useRef(null);
  const filteredDoctors = doctors.filter(
    (doctor) => doctor.specialization === specialty,
  );
  const slots = getPreviewSlots(doctorId, date);

  function clearPreview() {
    setPreview(null);
  }

  function changeSpecialty(event) {
    setSpecialty(event.target.value);
    setDoctorId('');
    setSlotId('');
    setSlotError('');
    clearPreview();
  }

  function changeDoctor(event) {
    setDoctorId(event.target.value);
    setSlotId('');
    setSlotError('');
    clearPreview();
  }

  function changeDate(value) {
    setDate(value);
    setSlotId('');
    setSlotError('');
    clearPreview();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const nameInput = form.elements.namedItem('fullName');
    const phoneInput = form.elements.namedItem('phone');
    nameInput.setCustomValidity(
      nameInput.value.trim() ? '' : 'Vui lòng nhập họ và tên.',
    );
    const digits = phoneInput.value.replace(/\D/g, '');
    phoneInput.setCustomValidity(
      digits.length >= 8 && digits.length <= 15
        ? ''
        : 'Vui lòng nhập số điện thoại có từ 8 đến 15 chữ số.',
    );
    if (!form.reportValidity()) return;
    const slot = slots.find((item) => item.id === slotId && item.available);
    if (!slot) {
      setSlotError('Vui lòng chọn một khung giờ khám.');
      slotGroup.current?.focus();
      return;
    }
    const data = new FormData(form);
    setPreview({
      fullName: data.get('fullName').trim(),
      doctor: doctors.find((doctor) => doctor.id === doctorId).name,
      specialization: specialty,
      date: formatAppointmentDate(date),
      time: slot.time,
    });
    requestAnimationFrame(() => previewPanel.current?.focus());
  }

  return (
    <>
      <section
        className="home-hero"
        id="gioi-thieu"
        aria-labelledby="hero-title"
      >
        <div className="hero-image" aria-hidden="true" />
        <div className="site-container hero-content">
          <span className="hero-eyebrow">
            <span /> ĐỒNG HÀNH CÙNG SỨC KHỎE CỦA BẠN
          </span>
          <h1 id="hero-title">
            An tâm chăm sóc.
            <br />
            <span>Chủ động đặt lịch.</span>
          </h1>
          <p>
            Chọn bác sĩ và thời gian phù hợp.
            <br />
            Bắt đầu hành trình chăm sóc sức khỏe ngay hôm nay.
          </p>
          <a className="hero-cta" href="#dat-lich">
            Đặt lịch khám <Icon name="arrow-right" size={18} />
          </a>
          <div className="hero-assurance">
            <Icon name="shield" size={17} /> Thông tin của bạn được tôn trọng và
            bảo mật
          </div>
        </div>
      </section>

      <div className="site-container quick-actions" aria-label="Truy cập nhanh">
        <a href="#lien-he" className="quick-action quick-consult">
          <Icon name="phone" size={27} />
          <span>
            Tư vấn sức khỏe<small>Chúng tôi luôn sẵn sàng lắng nghe</small>
          </span>
          <Icon name="chevron-right" size={19} />
        </a>
        <a href="#dat-lich" className="quick-action quick-booking">
          <Icon name="calendar" size={27} />
          <span>
            Đặt lịch khám<small>Chọn thời gian phù hợp với bạn</small>
          </span>
          <Icon name="chevron-right" size={19} />
        </a>
        <a href="#bac-si" className="quick-action quick-doctor">
          <Icon name="stethoscope" size={27} />
          <span>
            Tìm bác sĩ<small>Chăm sóc theo từng chuyên khoa</small>
          </span>
          <Icon name="chevron-right" size={19} />
        </a>
      </div>

      <section
        className="booking-section"
        id="dat-lich"
        aria-labelledby="booking-title"
      >
        <div className="site-container booking-container">
          <nav className="breadcrumb" aria-label="Đường dẫn">
            <a href="#gioi-thieu">Trang chủ</a>
            <Icon name="chevron-right" size={13} />
            <span aria-current="location">Đặt lịch khám</span>
          </nav>
          <div className="booking-heading">
            <div>
              <span className="section-eyebrow">
                MỘT BƯỚC ĐẾN GẦN HƠN VỚI SỨC KHỎE
              </span>
              <h2 id="booking-title">Đặt lịch khám</h2>
              <p>
                Vui lòng để lại thông tin để chuẩn bị cho buổi khám của bạn.
              </p>
            </div>
            <span className="booking-heading-icon">
              <Icon name="calendar" size={30} />
            </span>
          </div>

          <form
            className="appointment-form"
            onSubmit={handleSubmit}
            onChange={clearPreview}
          >
            <div className="form-section-title">
              <span className="section-number">01</span>
              <div>
                <h3>Thông tin lịch khám</h3>
                <p>Lựa chọn chuyên khoa, bác sĩ và thời gian khám.</p>
              </div>
              <span className="required-note">
                <span>*</span> Thông tin bắt buộc
              </span>
            </div>
            <div className="appointment-grid">
              <div className="appointment-preferences">
                <div className="field">
                  <label htmlFor="chuyen-khoa">
                    Chuyên khoa <span className="required-mark">*</span>
                  </label>
                  <div className="select-wrap">
                    <Icon name="stethoscope" size={18} />
                    <select
                      id="chuyen-khoa"
                      name="specialization"
                      value={specialty}
                      onChange={changeSpecialty}
                      required
                    >
                      <option value="">Chọn chuyên khoa</option>
                      {specialties.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <Icon name="chevron-down" size={15} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="bac-si">
                    Bác sĩ <span className="required-mark">*</span>
                  </label>
                  <div className="select-wrap">
                    <Icon name="user" size={18} />
                    <select
                      id="bac-si"
                      name="doctorId"
                      value={doctorId}
                      onChange={changeDoctor}
                      disabled={!specialty}
                      required
                      aria-describedby="doctor-hint"
                    >
                      <option value="">
                        {specialty
                          ? 'Chọn bác sĩ'
                          : 'Vui lòng chọn chuyên khoa trước'}
                      </option>
                      {filteredDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                    <Icon name="chevron-down" size={15} />
                  </div>
                  <small id="doctor-hint" className="field-hint">
                    Bác sĩ được hiển thị theo chuyên khoa bạn chọn.
                  </small>
                </div>
                <div className="form-help">
                  <Icon name="info" size={18} />
                  <p>
                    Chuyên khoa, bác sĩ và khung giờ hiện là dữ liệu minh họa để
                    xem trước giao diện.
                  </p>
                </div>
              </div>
              <div className="appointment-schedule">
                <fieldset className="date-fieldset">
                  <legend>
                    Ngày khám <span className="required-mark">*</span>
                  </legend>
                  <div className="date-options">
                    {bookingDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        className={`date-option ${date === day.value && !customDate ? 'is-selected' : ''}`}
                        aria-pressed={date === day.value && !customDate}
                        onClick={() => {
                          setCustomDate(false);
                          changeDate(day.value);
                        }}
                      >
                        <span>{day.label}</span>
                        <small>{day.weekday}</small>
                        {date === day.value && !customDate && (
                          <Icon name="check" size={12} />
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`date-option other-date ${customDate ? 'is-selected' : ''}`}
                      aria-pressed={customDate}
                      aria-expanded={customDate}
                      aria-controls="custom-date-field"
                      onClick={() => {
                        setCustomDate(true);
                        requestAnimationFrame(() => dateInput.current?.focus());
                      }}
                    >
                      <Icon name="calendar" size={20} />
                      <small>Ngày khác</small>
                    </button>
                  </div>
                </fieldset>
                {customDate && (
                  <div
                    className="field custom-date-field"
                    id="custom-date-field"
                  >
                    <label htmlFor="appointmentDate">Chọn ngày khám</label>
                    <input
                      ref={dateInput}
                      id="appointmentDate"
                      name="appointmentDate"
                      type="date"
                      min={bookingDays[0].value}
                      value={date}
                      onChange={(event) => changeDate(event.target.value)}
                      required
                    />
                  </div>
                )}
                <fieldset
                  className="time-fieldset"
                  ref={slotGroup}
                  tabIndex={-1}
                  aria-describedby={slotError ? 'slot-error' : 'slot-hint'}
                >
                  <legend>
                    Khung giờ <span className="required-mark">*</span>
                    <span className="timezone">Giờ Việt Nam</span>
                  </legend>
                  {doctorId && date ? (
                    <div className="time-options">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          className={`time-option ${slotId === slot.id ? 'is-selected' : ''}`}
                          disabled={!slot.available}
                          aria-pressed={slotId === slot.id}
                          aria-label={`${slot.time}${slot.available ? '' : ' — đã hết chỗ (minh họa)'}`}
                          onClick={() => {
                            setSlotId(slot.id);
                            setSlotError('');
                            clearPreview();
                          }}
                        >
                          {slot.time}
                          {slotId === slot.id && (
                            <Icon name="check" size={12} />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="time-placeholder">
                      <Icon name="clock" size={18} />
                      <span>Chọn bác sĩ để xem khung giờ khám</span>
                    </div>
                  )}
                  {slotError && (
                    <p className="field-error" id="slot-error" role="alert">
                      {slotError}
                    </p>
                  )}
                </fieldset>
                <p className="schedule-note" id="slot-hint">
                  <Icon name="clock" size={14} /> Khung giờ minh họa, chưa phải
                  lịch khám được xác nhận.
                </p>
              </div>
            </div>

            <div className="form-divider" />
            <div className="form-section-title">
              <span className="section-number">02</span>
              <div>
                <h3>Thông tin người khám</h3>
                <p>Giúp chúng tôi chuẩn bị và liên hệ với bạn.</p>
              </div>
            </div>
            <div className="patient-grid">
              <div className="field">
                <label htmlFor="fullName">
                  Họ và tên <span className="required-mark">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Nhập đầy đủ họ và tên"
                  maxLength={150}
                  required
                  onInput={(event) => event.target.setCustomValidity('')}
                />
              </div>
              <div className="field">
                <label htmlFor="dateOfBirth">
                  Ngày sinh{' '}
                  <span className="optional-label">(không bắt buộc)</span>
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  autoComplete="bday"
                  max={getVietnamDate()}
                />
              </div>
              <div className="field">
                <label htmlFor="phone">
                  Số điện thoại <span className="required-mark">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Nhập số điện thoại liên hệ"
                  maxLength={25}
                  pattern="\+?[0-9][0-9\s\(\).\-]{7,24}"
                  title="Số điện thoại có thể gồm chữ số, dấu + ở đầu, khoảng trắng, dấu ngoặc và dấu gạch ngang."
                  required
                  onInput={(event) => event.target.setCustomValidity('')}
                />
              </div>
              <div className="field">
                <label htmlFor="contactEmail">
                  Email <span className="optional-label">(không bắt buộc)</span>
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="Nhập địa chỉ email"
                  maxLength={254}
                />
              </div>
              <fieldset className="gender-fieldset">
                <legend>
                  Giới tính{' '}
                  <span className="optional-label">(không bắt buộc)</span>
                </legend>
                <div className="gender-options">
                  <label>
                    <input type="radio" name="gender" value="MALE" /> Nam
                  </label>
                  <label>
                    <input type="radio" name="gender" value="FEMALE" /> Nữ
                  </label>
                  <label>
                    <input type="radio" name="gender" value="OTHER" /> Khác
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="UNSPECIFIED"
                      defaultChecked
                    />{' '}
                    Không cung cấp
                  </label>
                </div>
              </fieldset>
              <div className="field reason-field">
                <label htmlFor="reason">
                  Lý do khám{' '}
                  <span className="optional-label">(không bắt buộc)</span>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  placeholder="Mô tả ngắn gọn triệu chứng hoặc nhu cầu khám của bạn…"
                  maxLength={500}
                />
                <small className="field-hint">Tối đa 500 ký tự.</small>
              </div>
            </div>
            <div className="form-bottom">
              <p className="privacy-note">
                <Icon name="shield" size={18} />
                <span>
                  Thông tin trên form chỉ dùng để xem trước và không được gửi
                  hoặc lưu.
                </span>
              </p>
              <button type="submit" className="submit-booking">
                Xem trước lịch hẹn <Icon name="arrow-right" size={17} />
              </button>
            </div>
            {preview && (
              <div
                className="booking-preview"
                ref={previewPanel}
                tabIndex={-1}
                role="status"
                aria-live="polite"
              >
                <span className="preview-icon">
                  <Icon name="check" size={21} />
                </span>
                <div>
                  <h4>Thông tin lịch hẹn của {preview.fullName}</h4>
                  <p>
                    {preview.specialization} · {preview.doctor}
                  </p>
                  <p>
                    <strong>{preview.time}</strong> · {preview.date}
                  </p>
                  <small>
                    Đây là bản xem trước. Lịch hẹn chưa được gửi, lưu hay xác
                    nhận.
                  </small>
                </div>
              </div>
            )}
          </form>
          <div className="booking-trust">
            <span>
              <Icon name="shield" size={18} /> Tôn trọng quyền riêng tư
            </span>
            <span>
              <Icon name="heart" size={18} /> Chăm sóc tận tâm
            </span>
            <span>
              <Icon name="calendar" size={18} /> Chủ động thời gian
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
