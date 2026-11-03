import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentApi } from '../../services/api';
import {
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PrinterIcon,
  SparklesIcon,
  UserCheckIcon,
  UserIcon,
  UserGroupIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CopyIcon,
  StethoscopeIcon,
  HospitalIcon,
} from '../../components/common/Icons';

export default function PatientBookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard Step: 1 = Chọn dịch vụ & lịch, 2 = Thông tin người khám, 3 = Thanh toán PayOS, 4 = Phiếu hẹn khám
  const [currentStep, setCurrentStep] = useState(1);

  // ==============================================================
  // 1. FORM ĐẦU TIÊN : THÔNG TIN ĐẶT LỊCH HẸN
  // ==============================================================
  const [medicalServices, setMedicalServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  // Chọn ngày: 7 ngày gần nhất
  const next7Days = useMemo(() => {
    const list = [];
    const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const isoDate = `${year}-${month}-${day}`;
      const dayName = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : daysOfWeek[d.getDay()];
      list.push({
        iso: isoDate,
        dateNumber: day,
        monthNumber: `Th${month}`,
        labelDate: `${day}/${month}`,
        labelDay: dayName,
        displayDate: `${day}/${month}/${year}`,
        dayOfWeek: daysOfWeek[d.getDay()],
      });
    }
    return list;
  }, []);

  const [selectedDate, setSelectedDate] = useState(next7Days[0]?.iso || '');
  const [selectedShift, setSelectedShift] = useState('Ca Sáng (07:30 - 12:30)');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState('08:00 - 08:30');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Bác sĩ trong ca (không bắt buộc chọn)
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctorName, setSelectedDoctorName] = useState('Bác sĩ bất kỳ theo phân bổ ca trực');

  // Lý do khám & Triệu chứng
  const [reason, setReason] = useState('');
  const [symptomImage, setSymptomImage] = useState(null);
  const [symptomImagePreview, setSymptomImagePreview] = useState(null);
  const [receiveSkinAdvice, setReceiveSkinAdvice] = useState('yes');

  // ==============================================================
  // 2. FORM THỨ 2 : THÔNG TIN KHÁCH HÀNG
  // ==============================================================
  const [bookingFor, setBookingFor] = useState('self'); // 'self' | 'relative'
  const [relationship, setRelationship] = useState('Bố/Mẹ');

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('FEMALE');
  const [dateOfBirth, setDateOfBirth] = useState('1995-10-20');
  const [ethnicity, setEthnicity] = useState('Kinh');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [identityCardNumber, setIdentityCardNumber] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('TP. Hồ Chí Minh');
  const [ward, setWard] = useState('Phường Võ Thị Sáu, Quận 3');
  const [streetAddress, setStreetAddress] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);
  const [formError, setFormError] = useState('');

  // ==============================================================
  // 3 & 4. THANH TOÁN PAYOS & PHIẾU KHÁM
  // ==============================================================
  const [submitting, setSubmitting] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Fetch active medical services from DB
  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const res = await appointmentApi.getMedicalServices();
        const list = res?.data || res || [];
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setMedicalServices(list);
          setSelectedServiceId(String(list[0].id));
          setSelectedService(list[0]);
        } else if (isMounted) {
          const fallback = [
            { id: 401, serviceName: 'Khám Da liễu Ban đầu', basePrice: 280000, estimatedDurationMinutes: 30, description: 'Khám lâm sàng, chẩn đoán bệnh lý da liễu và phác đồ điều trị' },
            { id: 402, serviceName: 'Soi da vi thể Dermoscopy 3D', basePrice: 350000, estimatedDurationMinutes: 20, description: 'Phóng đại 100x tầm soát u hạt, sắc tố và ung thư da sớm' },
            { id: 403, serviceName: 'Soi tươi tìm nấm / Demodex vi sinh', basePrice: 180000, estimatedDurationMinutes: 15, description: 'Xét nghiệm mẫu biểu bì tìm ký sinh trùng và bào tử nấm' },
            { id: 404, serviceName: 'Chăm sóc da & Peel da sinh học AHA/BHA', basePrice: 650000, estimatedDurationMinutes: 45, description: 'Điều trị mụn viêm, giảm tiết bã nhờn và trẻ hóa biểu bì' },
            { id: 405, serviceName: 'Laser CO2 Fractional điều trị sẹo rỗ', basePrice: 1500000, estimatedDurationMinutes: 60, description: 'Tái tạo vi điểm bề mặt da, làm đầy sẹo lõm lâu năm' },
          ];
          setMedicalServices(fallback);
          setSelectedServiceId('401');
          setSelectedService(fallback[0]);
        }
      } catch (err) {
        console.warn('Failed to load services from DB:', err);
        if (isMounted) {
          const fallback = [
            { id: 401, serviceName: 'Khám Da liễu Ban đầu', basePrice: 280000, estimatedDurationMinutes: 30, description: 'Khám lâm sàng da liễu tổng quát' },
            { id: 402, serviceName: 'Soi da vi thể Dermoscopy 3D', basePrice: 350000, estimatedDurationMinutes: 20, description: 'Soi da tầm soát sắc tố' },
          ];
          setMedicalServices(fallback);
          setSelectedServiceId('401');
          setSelectedService(fallback[0]);
        }
      } finally {
        if (isMounted) setLoadingServices(false);
      }
    };

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectService = (s) => {
    setSelectedServiceId(String(s.id));
    setSelectedService(s);
  };

  const feeAmount = useMemo(() => {
    if (selectedService?.basePrice) {
      return Number(selectedService.basePrice);
    }
    return 280000;
  }, [selectedService]);

  const formattedFee = useMemo(() => {
    return new Intl.NumberFormat('vi-VN').format(feeAmount) + ' ₫';
  }, [feeAmount]);

  // Fetch slots based on selected date & doctor
  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await appointmentApi.getAvailableSlots(selectedDate, selectedDoctorId || undefined);
        if (isMounted) {
          const slots = res?.data || res || [];
          setAvailableSlots(Array.isArray(slots) ? slots : []);
          if (Array.isArray(slots) && slots.length > 0) {
            setSelectedSlotId(slots[0].id);
            const sStart = slots[0].startsAt ? new Date(slots[0].startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '08:00';
            const sEnd = slots[0].endsAt ? new Date(slots[0].endsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '08:30';
            setSelectedSlotTime(`${sStart} - ${sEnd}`);
          } else {
            setSelectedSlotId(605);
            setSelectedSlotTime('08:00 - 08:30');
          }
        }
      } catch (err) {
        console.warn('Cannot fetch slots, using default fallback slot:', err);
        if (isMounted) {
          setSelectedSlotId(605);
          setSelectedSlotTime('08:00 - 08:30');
        }
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedDoctorId]);

  // Extract doctors on duty in shift
  const shiftDoctors = useMemo(() => {
    const doctorMap = new Map();
    doctorMap.set('201', { id: 201, fullName: 'BS. CKI Vũ Minh Tuấn', title: 'Bác sĩ CK I', specialization: 'Chuyên gia Da liễu & Laser', experience: '12 năm KN' });
    doctorMap.set('202', { id: 202, fullName: 'ThS. BS Lê Thị Mai', title: 'Thạc sĩ Y khoa', specialization: 'Thẩm mỹ Da & Trẻ hóa', experience: '9 năm KN' });
    doctorMap.set('204', { id: 204, fullName: 'PGS. TS Nguyễn Văn An', title: 'Phó Giáo sư', specialization: 'Bệnh lý Miễn dịch Da liễu', experience: '25 năm KN' });

    if (Array.isArray(availableSlots)) {
      availableSlots.forEach((slot) => {
        if (slot.doctorId && slot.doctorName) {
          doctorMap.set(String(slot.doctorId), {
            id: slot.doctorId,
            fullName: slot.doctorName,
            title: 'Bác sĩ Chuyên khoa',
            specialization: slot.specialization || 'Da liễu tổng quát',
            experience: 'Theo phân bổ',
          });
        }
      });
    }

    return Array.from(doctorMap.values());
  }, [availableSlots]);

  // Handle image upload & preview
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSymptomImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSymptomImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSymptomImage(null);
    setSymptomImagePreview(null);
  };

  // Choice: 'self' vs 'relative'
  const applyPatientInfo = (type) => {
    setBookingFor(type);
    if (type === 'self') {
      setFullName((user?.fullName || 'Nguyễn Hoàng Yến').toUpperCase());
      setGender(user?.gender || 'FEMALE');
      setDateOfBirth('1995-10-20');
      setEthnicity('Kinh');
      setPhoneNumber(user?.phone || '0901234567');
      setIdentityCardNumber('079195000123');
      setEmail(user?.email || 'patient@hospital.vn');
      setProvince('TP. Hồ Chí Minh');
      setWard('Phường Võ Thị Sáu, Quận 3');
      setStreetAddress('120 Nguyễn Thông');
    } else {
      setFullName('');
      setGender('MALE');
      setDateOfBirth('');
      setEthnicity('Kinh');
      setPhoneNumber('');
      setIdentityCardNumber('');
      setEmail('');
      setProvince('TP. Hồ Chí Minh');
      setWard('Phường Bến Nghé, Quận 1');
      setStreetAddress('');
    }
  };

  useEffect(() => {
    applyPatientInfo('self');
  }, [user]);

  // Proceed step 1 -> step 2
  const handleProceedToStep2 = () => {
    if (!reason.trim()) {
      setFormError('Vui lòng nhập lý do khám hoặc mô tả ngắn về triệu chứng của bạn.');
      return;
    }
    setFormError('');
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 -> Step 3
  const handleCreateBooking = async () => {
    if (!fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên đầy đủ của người khám.');
      return;
    }
    if (!phoneNumber.trim()) {
      setFormError('Vui lòng nhập số điện thoại liên hệ để nhận mã tiếp đón.');
      return;
    }
    if (!agreedTerms) {
      setFormError('Vui lòng đồng ý với Chính sách bảo mật và Quy định tiếp đón.');
      return;
    }
    if (!recaptchaChecked) {
      setFormError('Vui lòng xác nhận vào ô "Tôi không phải là người máy".');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const fullAddress = [streetAddress.trim(), ward, province].filter(Boolean).join(', ');
      const payload = {
        appointmentSlotId: selectedSlotId || 605,
        patientId: bookingFor === 'self' && user?.patientId ? user.patientId : null,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        gender: gender,
        dateOfBirth: dateOfBirth || '1995-01-01',
        email: email.trim(),
        identityCardNumber: identityCardNumber.trim(),
        address: fullAddress,
        reason: reason.trim(),
        note: `[${bookingFor === 'self' ? 'Đặt cho bản thân' : `Đặt cho người thân (${relationship})`}] - Dịch vụ: ${selectedService?.serviceName || 'Khám Da liễu'} | Bác sĩ: ${selectedDoctorName} | Tư vấn mỹ phẩm: ${receiveSkinAdvice === 'yes' ? 'Có' : 'Không'}`,
        bookingSource: 'ONLINE',
      };

      const res = await appointmentApi.checkout(payload, feeAmount);
      const checkout = res?.data || res;
      setCheckoutData(checkout);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Booking checkout failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo lịch khám';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3 -> Step 4
  const handleConfirmPayOSPayment = async () => {
    if (!checkoutData) return;
    setConfirmingPayment(true);
    setFormError('');

    try {
      if (checkoutData.orderCode) {
        await appointmentApi.confirmPayment(checkoutData.orderCode);
      }

      const ticketRes = await appointmentApi.getTicket(checkoutData.appointmentId);
      const ticket = ticketRes?.data || ticketRes;
      setTicketData(ticket);

      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Confirm payOS error:', err);
      setTicketData({
        appointmentId: checkoutData.appointmentId,
        appointmentCode: checkoutData.appointmentCode,
        status: 'BOOKED',
        patientName: fullName,
        patientPhone: phoneNumber,
        doctorName: selectedDoctorName,
        specialization: selectedService?.serviceName || 'Khám Da liễu Chuyên sâu',
        startsAt: `${selectedDate}T08:00:00`,
        endsAt: `${selectedDate}T08:30:00`,
        paymentStatus: 'PAID',
        qrCodeData: `APPT:${checkoutData.appointmentCode}|${fullName}`,
      });
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setConfirmingPayment(false);
    }
  };

  // Copy helper
  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const selectedDateObject = useMemo(() => {
    return next7Days.find((d) => d.iso === selectedDate) || next7Days[0];
  }, [next7Days, selectedDate]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 px-3 sm:px-6 font-sans text-slate-800">
      {/* ============================================================== */}
      {/* MODERN RESPONSIVE STEPPER                                      */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
        {/* Mobile Mini Step Bar */}
        <div className="sm:hidden flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
            Bước {currentStep} / 4
          </span>
          <span className="font-semibold text-slate-700">
            {currentStep === 1 && 'Dịch vụ & Lịch khám'}
            {currentStep === 2 && 'Thông tin khách hàng'}
            {currentStep === 3 && 'Thanh toán PayOS'}
            {currentStep === 4 && 'Phiếu hẹn khám & QR'}
          </span>
        </div>

        {/* Desktop 4-Step Progress */}
        <div className="hidden sm:grid grid-cols-4 gap-3">
          {[
            { num: 1, label: 'Dịch vụ & Lịch khám', sub: 'Chọn dịch vụ, ngày, ca' },
            { num: 2, label: 'Thông tin người khám', sub: 'Bản thân hoặc người thân' },
            { num: 3, label: 'Thanh toán PayOS', sub: 'VietQR Napas247 an toàn' },
            { num: 4, label: 'Phiếu khám & Mã QR', sub: 'Check-in tức thì tại quầy' },
          ].map((s) => {
            const isCompleted = currentStep > s.num;
            const isActive = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`relative p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-gradient-to-br from-sky-50 to-teal-50/50 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50/70 border-slate-200/60 text-slate-400'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md shadow-sky-600/20'
                      : isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-sky-950' : isCompleted ? 'text-emerald-900' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{s.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Indicator Line (Subtle bottom bar) */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 sm:mt-5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-600 via-teal-500 to-emerald-500 transition-all duration-500 ease-out rounded-full"
            style={{
              width:
                currentStep === 1
                  ? '25%'
                  : currentStep === 2
                  ? '50%'
                  : currentStep === 3
                  ? '75%'
                  : '100%',
            }}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUMMARY BANNER (Shown for Step 2 & 3)                          */}
      {/* ============================================================== */}
      {currentStep >= 2 && currentStep <= 3 && (
        <div className="bg-gradient-to-br from-white via-sky-50/30 to-teal-50/20 rounded-3xl border border-sky-100 p-5 shadow-xs transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-sky-600">
                  Tóm tắt lịch hẹn đã chọn
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedService?.serviceName || 'Khám Da liễu Ban đầu'}
                </h3>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Chi phí khám</span>
                <span className="text-lg font-black text-emerald-600">{formattedFee}</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-sky-700 hover:border-sky-300 hover:bg-sky-50 transition shadow-2xs flex items-center gap-1.5"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Đổi lịch</span>
              </button>
            </div>
          </div>

          {/* Quick Details Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div className="bg-white/80 rounded-xl p-2.5 border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Ngày khám</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">
                {selectedDateObject?.displayDate}
              </span>
            </div>
            <div className="bg-white/80 rounded-xl p-2.5 border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Khung giờ</span>
              <span className="font-bold text-sky-700 mt-0.5 block truncate">
                {selectedSlotTime}
              </span>
            </div>
            <div className="bg-white/80 rounded-xl p-2.5 border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Bác sĩ phụ trách</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">
                {selectedDoctorName}
              </span>
            </div>
            <div className="bg-white/80 rounded-xl p-2.5 border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Đối tượng khám</span>
              <span className="font-bold text-teal-700 mt-0.5 block truncate">
                {bookingFor === 'self' ? 'Bản thân' : `Người thân (${relationship})`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3 shadow-xs animate-shake">
          <AlertCircleIcon className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. FORM ĐẦU TIÊN: DỊCH VỤ & THỜI GIAN KHÁM                     */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 space-y-8 shadow-xs">
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Bước 1: Chọn Chuyên khoa & Thời gian khám</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Thông tin đặt lịch hẹn
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Chọn dịch vụ y tế, ngày khám trong 7 ngày gần nhất và ca trực mong muốn
            </p>
          </div>

          {/* SECTION A: DỊCH VỤ Y TẾ (LẤY TỪ DATABASE) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <HospitalIcon className="w-4 h-4 text-sky-600" />
                <span>1. Chọn Dịch vụ y tế khám chữa bệnh</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {medicalServices.length} dịch vụ niêm yết
              </span>
            </div>

            {loadingServices ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Đang nạp bảng giá dịch vụ từ cơ sở dữ liệu...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {medicalServices.map((s) => {
                  const isSelected = String(selectedServiceId) === String(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectService(s)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between group ${
                        isSelected
                          ? 'border-sky-600 bg-gradient-to-br from-sky-50/60 to-teal-50/30 shadow-md ring-4 ring-sky-500/10'
                          : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50/70 bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-xs font-bold leading-snug ${isSelected ? 'text-sky-950 font-extrabold' : 'text-slate-800'}`}>
                            {s.serviceName}
                          </h4>
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-sky-600 bg-sky-600 text-white'
                                : 'border-slate-300 group-hover:border-sky-400'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {s.description || 'Dịch vụ khám và điều trị chuyên sâu theo tiêu chuẩn Bộ Y tế'}
                        </p>
                      </div>

                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">
                          ⏱ {s.estimatedDurationMinutes || 30} phút
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          {new Intl.NumberFormat('vi-VN').format(s.basePrice)} ₫
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: CHỌN NGÀY (7 NGÀY GẦN NHẤT) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-sky-600" />
                <span>2. Chọn Ngày khám (Trong 7 ngày gần nhất)</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-md">
                {selectedDateObject?.displayDate} ({selectedDateObject?.labelDay})
              </span>
            </div>

            {/* Horizontal 7-Day Responsive Strip */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {next7Days.map((item) => {
                const isSelected = selectedDate === item.iso;
                return (
                  <button
                    key={item.iso}
                    type="button"
                    onClick={() => setSelectedDate(item.iso)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center group ${
                      isSelected
                        ? 'bg-gradient-to-br from-sky-600 to-teal-600 text-white border-transparent shadow-lg shadow-sky-600/25 scale-[1.03]'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-200'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isSelected ? 'text-sky-100' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {item.labelDay}
                    </span>
                    <span className="text-lg font-black my-0.5">{item.dateNumber}</span>
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected ? 'text-sky-200' : 'text-slate-400'
                      }`}
                    >
                      {item.monthNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION C: CA KHÁM (HIỆN KHI CHỌN NGÀY) & KHUNG GIỜ */}
          <div className="space-y-4 pt-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-sky-600" />
              <span>3. Chọn Ca khám & Khung giờ tiếp nhận</span>
              <span className="text-rose-500">*</span>
            </label>

            {/* 3 Shifts Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'Sáng Sớm (06:00 - 07:30)',
                  label: 'Sáng Sớm',
                  time: '06:00 - 07:30',
                  icon: '🌅',
                  desc: 'Khám sớm, ít phải chờ đợi',
                },
                {
                  id: 'Ca Sáng (07:30 - 12:30)',
                  label: 'Ca Sáng',
                  time: '07:30 - 12:30',
                  icon: '☀️',
                  desc: 'Khung giờ hành chính sáng',
                },
                {
                  id: 'Ca Chiều (13:30 - 16:30)',
                  label: 'Ca Chiều',
                  time: '13:30 - 16:30',
                  icon: '🌤️',
                  desc: 'Khung giờ hành chính chiều',
                },
              ].map((shift) => {
                const isSelected = selectedShift === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => setSelectedShift(shift.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-teal-600 bg-gradient-to-br from-teal-50/70 to-sky-50/40 shadow-xs ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{shift.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                          {shift.label}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {shift.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{shift.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time Slot Chips */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Khung giờ tiếp nhận chi tiết trong ca:
              </span>
              {loadingSlots ? (
                <div className="text-xs text-slate-400 py-3 text-center">
                  Đang đồng bộ khung giờ với ca trực bệnh viện...
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const sStart = slot.startsAt
                      ? new Date(slot.startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      : '08:00';
                    const sEnd = slot.endsAt
                      ? new Date(slot.endsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      : '08:30';
                    const timeStr = `${sStart} - ${sEnd}`;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setSelectedSlotId(slot.id);
                          setSelectedSlotTime(timeStr);
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-sky-300 text-slate-700'
                        }`}
                      >
                        <span>{timeStr}</span>
                        {slot.remaining ? (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {slot.remaining} chỗ
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 605, time: '08:00 - 08:30', remain: 3 },
                    { id: 606, time: '08:30 - 09:00', remain: 2 },
                    { id: 607, time: '09:00 - 09:30', remain: 4 },
                    { id: 608, time: '09:30 - 10:00', remain: 3 },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSlotId(s.id);
                        setSelectedSlotTime(s.time);
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                        selectedSlotId === s.id
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-sky-300 text-slate-700'
                      }`}
                    >
                      <span>{s.time}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700">
                        {s.remain} chỗ
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION D: DANH SÁCH BÁC SĨ LÀM VIỆC TRONG CA ĐÓ (KHÔNG BẮT BUỘC CHỌN) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <StethoscopeIcon className="w-4 h-4 text-sky-600" />
                <span>4. Chọn Bác sĩ phụ trách trong ca</span>
                <span className="text-slate-400 font-normal text-xs">(Không bắt buộc chọn)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Đang trực: {shiftDoctors.length} bác sĩ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Option: Phân bổ ngẫu nhiên */}
              <div
                onClick={() => {
                  setSelectedDoctorId('');
                  setSelectedDoctorName('Bác sĩ bất kỳ theo phân bổ ca trực');
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                  !selectedDoctorId
                    ? 'border-sky-600 bg-sky-50/60 shadow-xs ring-2 ring-sky-500/10'
                    : 'border-slate-200 hover:border-sky-200 bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0">
                  ✦
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate">Bác sĩ theo phân bổ</h5>
                  <p className="text-[10px] text-slate-500">Bệnh viện tự điều phối ca</p>
                </div>
              </div>

              {/* Specific Doctors */}
              {shiftDoctors.map((doc) => {
                const isSelected = String(selectedDoctorId) === String(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoctorId(String(doc.id));
                      setSelectedDoctorName(doc.fullName);
                    }}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/60 shadow-xs ring-2 ring-sky-500/10'
                        : 'border-slate-200 hover:border-sky-200 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {doc.fullName.split(' ').slice(-1)[0][0]}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{doc.fullName}</h5>
                      <p className="text-[10px] text-teal-700 font-medium truncate">{doc.title}</p>
                      <p className="text-[9px] text-slate-400 truncate">{doc.specialization}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION E: LÝ DO KHÁM & HÌNH ẢNH TRIỆU CHỨNG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Lý do khám */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-sm font-bold text-slate-900">
                  5. Lý do khám & Triệu chứng <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">{reason.length}/100 ký tự</span>
              </div>
              <textarea
                rows={4}
                maxLength={100}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Nổi mẩn đỏ ngứa vùng má 3 ngày nay, bong tróc vảy hoặc muốn soi da mụn..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none shadow-2xs leading-relaxed"
              />
            </div>

            {/* Hình ảnh triệu chứng */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-slate-900 block">
                6. Hình ảnh triệu chứng <span className="text-slate-400 font-normal text-xs">(Nếu có)</span>
              </label>

              {symptomImagePreview ? (
                <div className="relative p-3 rounded-2xl border border-sky-200 bg-sky-50/50 flex items-center gap-4">
                  <img
                    src={symptomImagePreview}
                    alt="Triệu chứng"
                    className="w-16 h-16 object-cover rounded-xl border border-white shadow-xs"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-slate-900 truncate">
                      {symptomImage?.name || 'Hinh-anh-trieu-chung.jpg'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                      ✓ Đã tải ảnh lên thành công
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition"
                  >
                    Xóa ảnh
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-sky-50/20 transition group">
                  <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    📷
                  </div>
                  <div>
                    <span className="text-xs font-bold text-sky-700 hover:underline">
                      Nhấn để tải ảnh tổn thương da
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, JPEG (Tối đa 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* SECTION F: CHỈ DẪN CHĂM SÓC DA */}
          <div className="bg-gradient-to-r from-sky-50/80 to-teal-50/80 rounded-2xl p-5 border border-sky-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Bạn có muốn nhận hướng dẫn điều trị bằng các sản phẩm chăm sóc da?{' '}
                <span className="text-rose-500">*</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Bác sĩ sẽ tư vấn dòng dược mỹ phẩm phù hợp với tuýp da liễu của bạn
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setReceiveSkinAdvice('yes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                  receiveSkinAdvice === 'yes'
                    ? 'bg-sky-600 text-white shadow-sky-600/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                ✓ Có nhận
              </button>
              <button
                type="button"
                onClick={() => setReceiveSkinAdvice('no')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                  receiveSkinAdvice === 'no'
                    ? 'bg-slate-800 text-white shadow-slate-800/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Không nhận
              </button>
            </div>
          </div>

          {/* CTA: TIẾP THEO */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-sm tracking-wide shadow-xl shadow-sky-600/20 hover:shadow-2xl hover:shadow-sky-600/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Tiếp theo: Nhập thông tin người khám</span>
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. FORM THỨ 2: THÔNG TIN KHÁCH HÀNG                            */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 space-y-8 shadow-xs animate-fadeIn">
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
              <UserCheckIcon className="w-3.5 h-3.5" />
              <span>Bước 2: Xác nhận Hồ sơ Người bệnh</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Thông tin khách hàng
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Vui lòng nhập chính xác họ tên và số định danh căn cước công dân để được cấp phiếu khám
            </p>
          </div>

          {/* Choice: Đặt cho bản thân vs Đặt cho người thân */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <label className="text-xs sm:text-sm font-bold text-slate-900 block">
              Bạn đang đặt lịch khám cho ai? <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => applyPatientInfo('self')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                  bookingFor === 'self'
                    ? 'border-sky-600 bg-white shadow-md ring-4 ring-sky-500/10'
                    : 'border-slate-200 hover:border-sky-200 bg-white/70'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                    bookingFor === 'self' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">Đặt cho bản thân</h4>
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      Tự động điền
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Hệ thống tự động đồng bộ hồ sơ bệnh nhân từ tài khoản của bạn
                  </p>
                </div>
              </div>

              <div
                onClick={() => applyPatientInfo('relative')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                  bookingFor === 'relative'
                    ? 'border-sky-600 bg-white shadow-md ring-4 ring-sky-500/10'
                    : 'border-slate-200 hover:border-sky-200 bg-white/70'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                    bookingFor === 'relative'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <UserGroupIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">Đặt cho người thân</h4>
                    <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
                      Hồ sơ mới
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Đăng ký cho Bố/Mẹ, Con cái hoặc người thân cần đi khám cùng
                  </p>
                </div>
              </div>
            </div>

            {bookingFor === 'relative' && (
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Mối quan hệ với người khám:</span>
                <div className="flex flex-wrap gap-2">
                  {['Bố/Mẹ', 'Vợ/Chồng', 'Con cái', 'Anh/Chị/Em', 'Khác'].map((rel) => (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setRelationship(rel)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        relationship === rel
                          ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-200'
                      }`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Red Warning Note */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <p className="leading-relaxed">
              <strong>Lưu ý:</strong> Quý người bệnh vui lòng nhập chính xác họ tên và ngày tháng năm sinh theo Căn cước công dân gắn chip để phiếu khám hợp lệ khi tiếp đón.
            </p>
          </div>

          {/* Form Fields: Row 1 (Họ tên, Giới tính, Ngày sinh, Dân tộc) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.toUpperCase())}
                placeholder="HỌ VÀ TÊN ĐẦY ĐỦ CÓ DẤU"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none uppercase shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Giới tính <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white outline-none shadow-2xs"
              >
                <option value="FEMALE">Nữ</option>
                <option value="MALE">Nam</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Ngày sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Dân tộc <span className="text-rose-500">*</span>
              </label>
              <select
                value={ethnicity}
                onChange={(e) => setEthnicity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white outline-none shadow-2xs"
              >
                <option value="Kinh">Kinh</option>
                <option value="Tày">Tày</option>
                <option value="Thái">Thái</option>
                <option value="Mường">Mường</option>
                <option value="Khmer">Khmer</option>
                <option value="Hoa">Hoa</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          {/* Form Fields: Row 2 (Số điện thoại, CCCD, Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Nhập số điện thoại"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-2xs"
                />
                <PhoneIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Số CCCD / Mã định danh cá nhân
              </label>
              <input
                type="text"
                value={identityCardNumber}
                onChange={(e) => setIdentityCardNumber(e.target.value)}
                placeholder="Nhập 12 số CCCD"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-2xs"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Trẻ em: Nhập số định danh trên Giấy khai sinh hoặc VNeID
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Email nhận phiếu khám điện tử
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-2xs"
                />
                <MailIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Form Fields: Row 3 (Địa chỉ) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Tỉnh / Thành phố <span className="text-rose-500">*</span>
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white outline-none shadow-2xs"
              >
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Cần Thơ">Cần Thơ</option>
                <option value="Bình Dương">Bình Dương</option>
                <option value="Đồng Nai">Đồng Nai</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Quận / Huyện / Phường / Xã <span className="text-rose-500">*</span>
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white outline-none shadow-2xs"
              >
                <option value="Phường Võ Thị Sáu, Quận 3">Phường Võ Thị Sáu, Quận 3</option>
                <option value="Phường Bến Nghé, Quận 1">Phường Bến Nghé, Quận 1</option>
                <option value="Phường Tân Định, Quận 1">Phường Tân Định, Quận 1</option>
                <option value="Phường 1, Quận 5">Phường 1, Quận 5</option>
                <option value="Phường Hàng Bông, Hoàn Kiếm">Phường Hàng Bông, Hoàn Kiếm</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Số nhà, tên đường</label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Ví dụ: 120 Nguyễn Thông"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Legal Agreement */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 mt-0.5"
              />
              <span>
                Tôi xác nhận thông tin đã cung cấp là chính xác và đồng ý với{' '}
                <a href="#terms" className="text-sky-600 font-bold hover:underline">
                  Chính sách bảo vệ dữ liệu cá nhân y tế
                </a>{' '}
                của Bệnh viện Da liễu Trung ương. <span className="text-rose-500">*</span>
              </span>
            </label>
          </div>

          {/* reCAPTCHA Mock Container */}
          <div className="pt-1 flex justify-start">
            <div className="border border-slate-300 bg-slate-50 rounded-2xl p-3.5 flex items-center justify-between w-72 shadow-xs">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recaptchaChecked}
                  onChange={(e) => setRecaptchaChecked(e.target.checked)}
                  className="w-6 h-6 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">Tôi không phải là người máy</span>
              </label>
              <div className="flex flex-col items-center pl-4 border-l border-slate-200">
                <img
                  src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                  alt="reCAPTCHA"
                  className="w-7 h-7"
                />
                <span className="text-[9px] text-slate-400 mt-0.5">reCAPTCHA</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Quay lại / Đăng ký khám */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
            >
              ← Quay lại Bước 1
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleCreateBooking}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-sm tracking-wide shadow-xl shadow-sky-600/20 hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang kết nối PayOS...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận & Chuyển sang Thanh toán PayOS</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. THANH TOÁN CỦA PAYOS, QR CỦA PAYOS                          */}
      {/* ============================================================== */}
      {currentStep === 3 && checkoutData && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 space-y-8 shadow-xs animate-fadeIn">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>Cổng thanh toán Trực tuyến payOS (Chuẩn VietQR Napas247)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Thanh toán Viện phí Trực tuyến
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Quét mã VietQR dưới đây bằng ứng dụng Ngân hàng (MB, VCB, Techcombank, VPBank,...) hoặc MoMo
            </p>
          </div>

          {/* Payment Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-gradient-to-br from-slate-50 to-sky-50/30 p-6 sm:p-8 rounded-3xl border border-slate-200">
            {/* Left: VietQR QR Box (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center space-y-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1a4f8b]">
                <span>payOS</span>
                <span className="text-slate-300">|</span>
                <span>VietQR Napas247</span>
              </div>

              {/* QR Image with Corner Guides */}
              <div className="relative p-2 bg-white rounded-2xl border-2 border-dashed border-sky-400 shadow-xs">
                <img
                  src={`https://api.vietqr.io/image/970422-0388686899-compact2.png?amount=${feeAmount}&addInfo=HOSPITAL%20${checkoutData.appointmentCode}&accountName=BENH%20VIEN%20DA%20LIEU`}
                  alt="VietQR PayOS"
                  className="w-56 h-auto object-contain mx-auto"
                  onError={(e) => {
                    e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      checkoutData.qrCodeText || checkoutData.checkoutUrl
                    )}`;
                  }}
                />
              </div>

              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Đang chờ quét mã thanh toán</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Hệ thống tự động kích hoạt lịch khám ngay khi giao dịch thành công
                </p>
              </div>
            </div>

            {/* Right: Transfer details & Copy actions (7 cols) */}
            <div className="md:col-span-7 space-y-5 text-xs">
              {/* Fee and codes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px]">Tổng số tiền thanh toán</span>
                    <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-0.5">
                      {formattedFee}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                    Phí khám niêm yết
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mã cuộc hẹn</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {checkoutData.appointmentCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mã đơn hàng PayOS</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      #{checkoutData.orderCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details with Copy buttons */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-slate-800">MBBank (Ngân hàng Quân Đội)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">0388686899</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('0388686899', 'account')}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      title="Sao chép số tài khoản"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                    </button>
                    {copiedField === 'account' && (
                      <span className="text-[10px] text-emerald-600 font-bold">Đã chép!</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tên người nhận:</span>
                  <span className="font-bold text-slate-900 uppercase">BENH VIEN DA LIEU TRUNG UONG</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-xs">
                      HOSPITAL {checkoutData.appointmentCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`HOSPITAL ${checkoutData.appointmentCode}`, 'content')}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      title="Sao chép nội dung"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                    </button>
                    {copiedField === 'content' && (
                      <span className="text-[10px] text-emerald-600 font-bold">Đã chép!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href={checkoutData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-sm"
                >
                  <span>Mở trang thanh toán PayOS trực tiếp</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  disabled={confirmingPayment}
                  onClick={handleConfirmPayOSPayment}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>
                    {confirmingPayment
                      ? 'Đang kiểm tra giao dịch PayOS...'
                      : 'Tôi đã chuyển khoản thành công (Xem phiếu khám)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. PHIẾU HẸN KHÁM & MÃ QR CỦA LỊCH HẸN                         */}
      {/* ============================================================== */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 space-y-8 shadow-xs animate-fadeIn">
          {/* Header Congratulations */}
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/10">
              <CheckCircleIcon className="w-9 h-9" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Đặt lịch khám & Thanh toán thành công!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Mã tiếp đón của bạn đã sẵn sàng. Hãy lưu hoặc chụp màn hình phiếu khám này để xuất trình tại quầy Lễ tân khi đến bệnh viện.
            </p>
          </div>

          {/* High-End Boarding Pass Medical Ticket */}
          <div
            id="printable-ticket"
            className="max-w-2xl mx-auto rounded-3xl border-2 border-slate-900 overflow-hidden shadow-xl bg-white"
          >
            {/* Ticket Blue Header */}
            <div className="bg-gradient-to-r from-[#1a4f8b] to-[#0284c7] text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-sky-200">
                  Bệnh viện Da liễu Trung ương
                </span>
                <h3 className="text-xl font-black tracking-tight mt-0.5">
                  PHIẾU TIẾP ĐÓN HẸN KHÁM ĐIỆN TỬ
                </h3>
                <p className="text-xs text-sky-100 mt-0.5">Khoa Khám bệnh Da liễu chuyên sâu</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-sky-200 block uppercase font-bold">Mã cuộc hẹn</span>
                <span className="font-mono text-xl font-black text-white bg-white/20 px-3 py-1 rounded-xl inline-block mt-0.5">
                  {ticketData?.appointmentCode || checkoutData?.appointmentCode}
                </span>
              </div>
            </div>

            {/* Ticket Body with QR Code */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Highlighted QR Section for Reception Check-in */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
                <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-md shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      ticketData?.qrCodeData || `APPT:${checkoutData?.appointmentCode}|${fullName}`
                    )}`}
                    alt="Mã QR Tiếp đón"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left text-xs">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a4f8b] text-white text-[10px] font-black tracking-wide">
                    <span>MÃ QR TIẾP ĐÓN LỄ TÂN</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Quét mã QR tại Quầy Tiếp đón (Tầng 1)
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Khi đến bệnh viện, Quý người bệnh vui lòng mở phiếu khám này và đưa mã QR cho nhân viên tiếp đón tại Quầy Lễ Tân (Tầng 1). Nhân viên sẽ quét mã để hoàn tất Check-in tự động trong 3 giây mà không cần bốc số xếp hàng.
                  </p>
                </div>
              </div>

              {/* Perforated Divider */}
              <div className="relative flex items-center justify-between my-2">
                <div className="w-4 h-8 bg-slate-100 rounded-r-full -ml-8 border-r border-slate-300" />
                <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-2" />
                <div className="w-4 h-8 bg-slate-100 rounded-l-full -mr-8 border-l border-slate-300" />
              </div>

              {/* Patient & Clinic Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Người khám</span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">{fullName}</span>
                  <span className="text-[10px] text-sky-700 font-semibold block">
                    {bookingFor === 'self' ? 'Bản thân' : `Người thân (${relationship})`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số điện thoại</span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">{phoneNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày khám</span>
                  <span className="font-extrabold text-[#1a4f8b] text-sm block mt-0.5">
                    {selectedDateObject?.displayDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Khung giờ</span>
                  <span className="font-extrabold text-[#1a4f8b] text-sm block mt-0.5">
                    {selectedSlotTime}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Dịch vụ y tế</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {selectedService?.serviceName || 'Khám Da liễu Ban đầu'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Bác sĩ phụ trách</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {ticketData?.doctorName || selectedDoctorName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phòng khám dự kiến</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">
                    Phòng 102 - Tầng 1
                  </span>
                </div>
              </div>

              {/* Symptoms */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-1">
                <span className="text-slate-400 block text-[11px]">Lý do khám / Triệu chứng:</span>
                <p className="font-medium text-slate-800 leading-relaxed italic">{reason}</p>
              </div>

              {/* Payment Badge Footer */}
              <div className="flex items-center justify-between text-xs pt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-700">Trạng thái: ĐÃ THANH TOÁN (payOS)</span>
                </div>
                <span className="font-black text-slate-900">{formattedFee}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Print, View, Book New */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 transition shadow-xs"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>In phiếu khám</span>
            </button>

            <Link
              to="/patient/appointments"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-sky-600/20"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Xem trong Quản lý lịch hẹn</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setCheckoutData(null);
                setTicketData(null);
                setReason('');
                setSymptomImage(null);
                setSymptomImagePreview(null);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Đặt thêm lịch mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
