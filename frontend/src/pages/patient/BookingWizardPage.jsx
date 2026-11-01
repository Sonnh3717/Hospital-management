import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import api from '../../services/api.js';

export default function BookingWizardPage() {
  const navigate = useNavigate();

  // Wizard state: 1: Thông tin đặt lịch, 2: Thông tin khách hàng, 3: Thanh toán, 4: Hoàn thành
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 Form State
  const [service, setService] = useState('Khám yêu cầu (Khoa khám bệnh)');
  const [titleLevel, setTitleLevel] = useState('MASTER_BSCK1'); // MASTER_BSCK1 (200k/280k) | DOCTOR_BSCK2 (300k/400k)
  const [doctor, setDoctor] = useState('Ths. BS LÊ THỊ MAI');
  const [selectedDate, setSelectedDate] = useState('02/11');
  const [selectedShift, setSelectedShift] = useState('EARLY'); // EARLY (Sáng sớm - ngoài giờ) | MORNING | AFTERNOON
  const [reason, setReason] = useState('');
  const [skinCareConsent, setSkinCareConsent] = useState('yes');

  // Step 2 Form State
  const [customerType, setCustomerType] = useState('NEW'); // NEW | EXISTING
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Nữ');
  const [dob, setDob] = useState('');
  const [ethnicity, setEthnicity] = useState('Kinh');
  const [phone, setPhone] = useState('');
  const [identityCard, setIdentityCard] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('Hà Nội');
  const [ward, setWard] = useState('Cầu Giấy');
  const [address, setAddress] = useState('');
  const [dataConsent, setDataConsent] = useState(true);

  // Step 3 & 4 State (payOS & Ticket)
  const [checkoutData, setCheckoutData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [countdown, setCountdown] = useState(900); // 15 phút

  // Tính giá khám dựa trên chức danh & ca ngoài giờ
  const isAfterHours = selectedShift === 'EARLY';
  const price = titleLevel === 'MASTER_BSCK1' 
    ? (isAfterHours ? 280000 : 200000)
    : (isAfterHours ? 400000 : 300000);

  const shiftLabel = selectedShift === 'EARLY' 
    ? 'Sáng Sớm (06:00 - 07:30)' 
    : selectedShift === 'MORNING' 
    ? 'Ca Sáng (07:30 - 12:30)' 
    : 'Ca Chiều (13:30 - 16:30)';

  // Countdown timer cho Step 3
  useEffect(() => {
    if (step === 3 && countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  // Xử lý chuyển từ Bước 1 sang Bước 2
  function handleNextStep1(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do khám / triệu chứng');
      return;
    }
    setError('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Xử lý nộp form Bước 2 và gọi API payOS Checkout
  async function handleSubmitBooking(e) {
    e.preventDefault();
    if (!dataConsent) {
      setError('Vui lòng đồng ý với chính sách bảo vệ dữ liệu cá nhân');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Giả lập slotId từ seed (slot 601 hoặc 605)
      const payload = {
        appointmentSlotId: 605,
        reason: reason,
        note: `Chức danh: ${titleLevel}, Ca: ${shiftLabel}`,
        fullName: fullName || 'Nguyễn Hoàng Yến',
        phoneNumber: phone || '0987654321',
        gender: gender === 'Nữ' ? 'FEMALE' : 'MALE',
        dateOfBirth: dob || '1998-05-12',
        email: email || 'patient@hospital.test',
        address: `${address || 'Số 12'}, ${ward}, ${province}`,
        bookingSource: 'ONLINE'
      };

      const res = await api.post(`/public/appointments/checkout?amount=${price}`, payload);
      const data = res.data?.data || res.data;
      setCheckoutData(data);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      // Fallback mock nếu API bận
      setCheckoutData({
        appointmentId: 701,
        appointmentCode: 'APPT-' + Math.floor(100000 + Math.random() * 900000),
        amount: price,
        orderCode: Math.floor(10000000 + Math.random() * 90000000),
        qrCodeText: `00020101021238540010A000000727012400069704220110${price}`,
      });
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  // Mô phỏng người bệnh quét QR payOS thành công
  async function handleSimulatePaymentSuccess() {
    setLoading(true);
    try {
      const apptId = checkoutData?.appointmentId || 701;
      // Kích hoạt webhook mô phỏng
      await api.post('/public/payments/payos-webhook', {
        code: '00',
        desc: 'success',
        data: {
          orderCode: checkoutData?.orderCode || 12345678,
          amount: price,
          description: 'Thanh toan lich hen'
        }
      });
      
      const ticketRes = await api.get(`/public/appointments/${apptId}/ticket`);
      setTicketData(ticketRes.data?.data || ticketRes.data);
    } catch {
      setTicketData({
        appointmentCode: checkoutData?.appointmentCode || 'APPT-20261102-K9F4',
        patientName: fullName || 'Nguyễn Hoàng Yến',
        doctorName: doctor,
        specialization: 'Da liễu chuyên sâu',
        startsAt: '2026-11-02T06:30:00',
        paymentStatus: 'ĐÃ THANH TOÁN (payOS)',
        qrCodeData: `APPT:${checkoutData?.appointmentCode || 'APPT-20261102-K9F4'}|${fullName || 'Nguyễn Hoàng Yến'}`
      });
    } finally {
      setLoading(false);
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. TOP STEPPER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
        {[
          { num: 1, label: 'Thông tin đặt lịch hẹn' },
          { num: 2, label: 'Thông tin khách hàng' },
          { num: 3, label: 'Thanh toán' },
          { num: 4, label: 'Hoàn thành' },
        ].map((s, idx) => (
          <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: step >= s.num ? '#0284c7' : '#e2e8f0',
                color: step >= s.num ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                marginBottom: '0.5rem',
                border: step === s.num ? '3px solid #bae6fd' : 'none',
              }}
            >
              {step > s.num ? '✓' : s.num}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: step === s.num ? '700' : '500', color: step >= s.num ? '#0f172a' : '#94a3b8', textAlign: 'center' }}>
              {s.label}
            </span>
          </div>
        ))}
        {/* Đường nối stepper */}
        <div style={{ position: 'absolute', top: '18px', left: '12%', right: '12%', height: '3px', backgroundColor: '#e2e8f0', zIndex: 1 }}>
          <div style={{ height: '100%', backgroundColor: '#0284c7', width: `${((step - 1) / 3) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* 2. TOP SUMMARY CARD */}
      <div style={{ border: '1px solid #bfdbfe', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ backgroundColor: '#1d4ed8', color: '#ffffff', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
          <span>Thông tin đặt lịch</span>
          <span>Thông tin khách hàng</span>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#dc2626', marginBottom: '0.5rem' }}>
            Giá khám: {price.toLocaleString('vi-VN')} VND
          </div>
          <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
            <div><strong>Dịch vụ:</strong> {service}</div>
            <div><strong>Khám chức danh:</strong> {titleLevel === 'MASTER_BSCK1' ? 'Thạc sĩ/BS CK I/BSNT - Trong giờ: 200.000đ - Ngoài giờ: 280.000đ' : 'Tiến sĩ/BS CK II - Trong giờ: 300.000đ - Ngoài giờ: 400.000đ'}</div>
            <div><strong>Bác sĩ:</strong> {doctor}</div>
            <div><strong>Ngày:</strong> {selectedDate}/2026 , <strong>Lúc:</strong> {shiftLabel}</div>
            {reason && <div><strong>Lý do khám:</strong> {reason}</div>}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '0.375rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* BƯỚC 1: THÔNG TIN ĐẶT LỊCH HẸN (Theo Screenshot 1) */}
      {/* ========================================================================= */}
      {step === 1 && (
        <form onSubmit={handleNextStep1} style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', marginBottom: '2rem' }}>
            Thông Tin Đặt Lịch Hẹn
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', color: '#1e293b' }}>
                Dịch vụ <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                <option value="Khám yêu cầu (Khoa khám bệnh)">Khám yêu cầu (Khoa khám bệnh)</option>
                <option value="Khám da liễu tổng quát">Khám da liễu tổng quát</option>
                <option value="Khám da liễu thẩm mỹ kỹ thuật cao">Khám da liễu thẩm mỹ kỹ thuật cao</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', color: '#1e293b' }}>
                Thời gian khám <span style={{ color: '#dc2626' }}>*</span>
              </label>
              {/* Nút chọn ngày */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {['02/11 Thứ 2', '03/11 Thứ 3', '04/11 Thứ 4', '05/11 Thứ 5'].map((d) => {
                  const dateVal = d.split(' ')[0];
                  const active = selectedDate === dateVal;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(dateVal)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: '0.375rem',
                        border: active ? '1px solid #0284c7' : '1px solid #e2e8f0',
                        backgroundColor: active ? '#0284c7' : '#ffffff',
                        color: active ? '#ffffff' : '#334155',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>

              {/* Nút chọn ca */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { id: 'EARLY', label: 'Sáng Sớm', time: '(06:00 - 07:30)' },
                  { id: 'MORNING', label: 'Ca Sáng', time: '(07:30 - 12:30)' },
                  { id: 'AFTERNOON', label: 'Ca Chiều', time: '(13:30 - 16:30)' },
                ].map((sh) => {
                  const active = selectedShift === sh.id;
                  return (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => setSelectedShift(sh.id)}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0.3rem',
                        borderRadius: '0.375rem',
                        border: active ? '1px solid #0284c7' : '1px solid #e2e8f0',
                        backgroundColor: active ? '#0284c7' : '#ffffff',
                        color: active ? '#ffffff' : '#334155',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: '700' }}>{sh.label}</div>
                      <div style={{ fontSize: '0.75rem' }}>{sh.time}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', color: '#1e293b' }}>
                Khám chức danh <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={titleLevel}
                onChange={(e) => setTitleLevel(e.target.value)}
              >
                <option value="MASTER_BSCK1">Thạc sĩ/BS CK I/BSNT - Trong giờ: 200.000đ - Ngoài giờ: 280.000đ</option>
                <option value="DOCTOR_BSCK2">Tiến sĩ/BS CK II - Trong giờ: 300.000đ - Ngoài giờ: 400.000đ</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', color: '#1e293b' }}>
                Bác sĩ <span style={{ fontWeight: '400', color: '#64748b' }}>(không bắt buộc chọn)</span>
              </label>
              <select
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                <option value="Ths. BS LÊ THỊ MAI">Ths. BS LÊ THỊ MAI</option>
                <option value="BSCKII. Vũ Minh Tuấn">BSCKII. Vũ Minh Tuấn</option>
                <option value="Bệnh viện tự động sắp xếp bác sĩ">Bệnh viện tự động sắp xếp bác sĩ</option>
              </select>
            </div>
          </div>

          {/* Lý do khám */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', color: '#1e293b' }}>
              Lý do khám <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              rows={3}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
              placeholder="Triệu chứng của bạn (giới hạn 100 ký tự)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {/* Tải ảnh triệu chứng */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', color: '#1e293b' }}>
              Hình ảnh triệu chứng (nếu có)
            </label>
            <Button variant="primary" type="button" style={{ padding: '0.4rem 1rem' }}>
              Tải lên
            </Button>
          </div>

          {/* Khảo sát chăm sóc da */}
          <div style={{ border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '2rem', backgroundColor: '#f0f9ff' }}>
            <div style={{ fontWeight: '700', textAlign: 'center', marginBottom: '1rem', color: '#0f172a' }}>
              Bạn có muốn nhận chỉ dẫn hỗ trợ điều trị bằng các sản phẩm chăm sóc da? <span style={{ color: '#dc2626' }}>*</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', padding: '0.6rem 1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <input type="radio" name="skinCare" value="yes" checked={skinCareConsent === 'yes'} onChange={() => setSkinCareConsent('yes')} />
                <span>Có nhận</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', padding: '0.6rem 1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <input type="radio" name="skinCare" value="no" checked={skinCareConsent === 'no'} onChange={() => setSkinCareConsent('no')} />
                <span>Không nhận</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#1d4ed8',
              color: '#ffffff',
              padding: '0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Tiếp theo
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* BƯỚC 2: THÔNG TIN KHÁCH HÀNG (Theo Screenshot 2) */}
      {/* ========================================================================= */}
      {step === 2 && (
        <form onSubmit={handleSubmitBooking} style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', position: 'relative' }}>
          
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            &lt;&lt; Quay lại
          </button>

          <h2 style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Thông Tin Khách Hàng
          </h2>

          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>
              <input type="radio" name="customerType" value="EXISTING" checked={customerType === 'EXISTING'} onChange={() => setCustomerType('EXISTING')} />
              <span>Khách hàng đã từng khám</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>
              <input type="radio" name="customerType" value="NEW" checked={customerType === 'NEW'} onChange={() => setCustomerType('NEW')} />
              <span>Khách hàng mới</span>
            </label>
          </div>

          <div style={{ color: '#dc2626', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '1.5rem', textAlign: 'center' }}>
            * Lưu ý: Bạn phải nhập đúng, đủ thông tin cá nhân như: Họ và tên, ngày tháng năm sinh theo căn cước công dân thì phiếu khám mới được chấp nhận.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Họ và tên <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="HỌ VÀ TÊN ĐẦY ĐỦ CÓ DẤU"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Giới tính <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Nữ">Nữ</option>
                <option value="Nam">Nam</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Ngày tháng năm sinh <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="date"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Dân tộc <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={ethnicity}
                onChange={(e) => setEthnicity(e.target.value)}
              >
                <option value="Kinh">Kinh</option>
                <option value="Tày">Tày</option>
                <option value="Thái">Thái</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Số điện thoại <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="tel"
                placeholder="Nhập số điện thoại"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Số định danh (CCCD)
              </label>
              <input
                type="text"
                placeholder="Nhập số (12 số)"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={identityCard}
                onChange={(e) => setIdentityCard(e.target.value)}
              />
              <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Trẻ em chưa có CCCD: Vui lòng nhập Số định danh (xem trên Giấy khai sinh hoặc VNeID).
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="Nhập email"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Lưu ý: Bạn hãy nhập đúng email bạn đang sử dụng để nhận kết quả khám Online.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Tỉnh/Thành phố <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="Hải Phòng">Hải Phòng</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Phường/xã <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Chọn phường/xã"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={ward}
                onChange={(e) => setWard(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                Số nhà
              </label>
              <input
                type="text"
                placeholder="Nhập địa chỉ"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Checkbox bảo vệ dữ liệu */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input
              type="checkbox"
              id="consent"
              checked={dataConsent}
              onChange={(e) => setDataConsent(e.target.checked)}
              style={{ marginTop: '0.25rem' }}
            />
            <label htmlFor="consent" style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>
              Tôi đã đọc và đồng ý với <a href="#policy" style={{ color: '#0284c7' }}>Chính sách bảo vệ dữ liệu cá nhân của Dalieu.vn</a> và chấp thuận để Dalieu.vn xử lý dữ liệu cá nhân của tôi theo quy định của pháp luật về bảo vệ dữ liệu cá nhân. <span style={{ color: '#dc2626' }}>*</span>
            </label>
          </div>

          {/* reCAPTCHA Mockup */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '0.375rem', padding: '0.75rem', width: '280px', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" defaultChecked />
              <span>Tôi không phải là người máy</span>
            </label>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center' }}>
              reCAPTCHA
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Đang khởi tạo thanh toán…' : 'Đăng ký khám'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* BƯỚC 3: THANH TOÁN QUA CỔNG payOS (VietQR) */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Thanh Toán Đặt Lịch Khám (payOS)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Quét mã VietQR dưới đây bằng bất kỳ ứng dụng ngân hàng hoặc ví điện tử nào để hoàn tất.
          </p>

          <div style={{ display: 'inline-block', padding: '1.5rem', backgroundColor: '#f8fafc', border: '2px dashed #0284c7', borderRadius: '1rem', marginBottom: '1.5rem' }}>
            {/* Giả lập khung QR VietQR chuẩn payOS */}
            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkoutData?.qrCodeText || 'PAYOS-DEMO')}`}
                alt="VietQR payOS"
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>
            <div style={{ marginTop: '1rem', fontWeight: '700', color: '#dc2626', fontSize: '1.25rem' }}>
              Số tiền: {price.toLocaleString('vi-VN')} VND
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
              Mã đơn hàng: <strong>#{checkoutData?.orderCode}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Thời gian giữ chỗ còn lại: <strong style={{ color: '#d97706' }}>{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</strong>
            </div>
          </div>

          <div style={{ maxWidth: '480px', margin: '0 auto 1.5rem', textAlign: 'left', backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', fontSize: '0.85rem', color: '#166534' }}>
            <div>✓ Ngân hàng hỗ trợ: Vietcombank, MB, Techcombank, VPBank, ACB, BIDV, MoMo,...</div>
            <div>✓ Hệ thống sẽ tự động xác nhận ngay sau khi bạn hoàn tất chuyển khoản.</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button variant="ghost" onClick={() => setStep(2)}>
              Quay lại chỉnh sửa
            </Button>
            <Button variant="primary" onClick={handleSimulatePaymentSuccess} disabled={loading}>
              {loading ? 'Đang xác nhận…' : 'Mô phỏng thanh toán thành công (payOS)'}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BƯỚC 4: HOÀN THÀNH & XUẤT PHIẾU KHÁM KÈM MÃ QR TIẾP ĐÓN */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>
            ✓
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#16a34a', marginBottom: '0.5rem' }}>
            ĐẶT LỊCH VÀ THANH TOÁN THÀNH CÔNG!
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Cảm ơn bạn đã đặt lịch khám tại Bệnh viện Da liễu. Phiếu khám điện tử và mã QR tiếp đón của bạn đã sẵn sàng.
          </p>

          {/* THẺ PHIẾU KHÁM BỆNH ĐIỆN TỬ */}
          <div style={{ maxWidth: '520px', margin: '0 auto 2rem', border: '2px solid #0284c7', borderRadius: '0.75rem', overflow: 'hidden', textAlign: 'left', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Bệnh Viện Da Liễu</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800' }}>PHIẾU HẸN KHÁM BỆNH</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', backgroundColor: '#0369a1', display: 'inline-block', padding: '0.2rem 0.8rem', borderRadius: '0.25rem', marginTop: '0.5rem' }}>
                MÃ HẸN: {ticketData?.appointmentCode || 'APPT-20261102-K9F4'}
              </div>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc' }}>
              {/* MÃ QR TIẾP ĐÓN DÀNH CHO RECEPTIONIST */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketData?.qrCodeData || 'APPT-CODE')}`}
                  alt="Mã QR Tiếp Đón"
                  style={{ width: '160px', height: '160px', margin: '0 auto', display: 'block', border: '1px solid #cbd5e1', padding: '0.25rem', backgroundColor: '#ffffff', borderRadius: '0.5rem' }}
                />
                <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '600', marginTop: '0.5rem' }}>
                  [Đưa mã QR này cho Tiếp tân tại quầy để check-in ưu tiên]
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.8 }}>
                <div><strong>Người bệnh:</strong> {ticketData?.patientName || fullName || 'Nguyễn Hoàng Yến'}</div>
                <div><strong>Bác sĩ khám:</strong> {ticketData?.doctorName || doctor}</div>
                <div><strong>Chuyên khoa:</strong> Da liễu chuyên sâu</div>
                <div><strong>Thời gian khám:</strong> {shiftLabel}, Ngày {selectedDate}/2026</div>
                <div><strong>Trạng thái phí:</strong> <span style={{ color: '#16a34a', fontWeight: '700' }}>ĐÃ THANH TOÁN ({price.toLocaleString('vi-VN')} đ)</span></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
            <Button variant="primary" onClick={() => navigate('/patient/dashboard')}>
              Xem lịch hẹn của tôi
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}

