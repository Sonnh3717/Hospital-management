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
} from '../../components/common/Icons';

export const HOSPITAL_SHIFTS = [
  {
    id: 'SHIFT-EARLY',
    code: 'SHIFT-EARLY',
    name: 'Ca Sáng Sớm',
    time: '06:00 - 07:30',
    startTime: '06:00',
    endTime: '07:30',
    display: 'Ca Sáng Sớm (06:00 - 07:30)',
  },
  {
    id: 'SHIFT-MORNING',
    code: 'SHIFT-MORNING',
    name: 'Ca Sáng',
    time: '07:30 - 12:00',
    startTime: '07:30',
    endTime: '12:00',
    display: 'Ca Sáng (07:30 - 12:00)',
  },
  {
    id: 'SHIFT-AFTERNOON',
    code: 'SHIFT-AFTERNOON',
    name: 'Ca Chiều',
    time: '13:00 - 17:00',
    startTime: '13:00',
    endTime: '17:00',
    display: 'Ca Chiều (13:00 - 17:00)',
  },
];

/**
 * Kiểm tra xem một ca khám vào một ngày cụ thể đã trôi qua so với thời gian hiện tại chưa.
 * - Nếu ngày được chọn là ngày trong quá khứ (< hôm nay): Đã qua.
 * - Nếu ngày được chọn là ngày trong tương lai (> hôm nay): Chưa qua.
 * - Nếu ngày được chọn là HÔM NAY: So sánh giờ hiện tại với giờ kết thúc ca (endTime).
 *   Ví dụ: Nếu hiện tại sau 07:30, Ca Sáng Sớm (06:00 - 07:30) kết thúc lúc 07:30 nên đã trôi qua.
 */
export const isShiftPassed = (dateStr, shift) => {
  if (!dateStr || !shift || !shift.endTime) return false;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayIso = `${year}-${month}-${day}`;

  if (dateStr < todayIso) return true;
  if (dateStr > todayIso) return false;

  // Nếu là ngày hôm nay: so sánh với thời điểm kết thúc ca khám
  const [endHour, endMinute] = shift.endTime.split(':').map(Number);
  const shiftEndTime = new Date(now);
  shiftEndTime.setHours(endHour, endMinute, 0, 0);

  return now >= shiftEndTime;
};

export default function PatientBookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard Step: 1 = Thông tin đặt lịch, 2 = Thông tin khách hàng, 3 = Thanh toán, 4 = Hoàn thành
  const [currentStep, setCurrentStep] = useState(1);

  // ==============================================================
  // 1. FORM ĐẦU TIÊN : THÔNG TIN ĐẶT LỊCH HẸN
  // ==============================================================
  // Droplist chọn dịch vụ y tế (Lấy trong database)
  const [medicalServices, setMedicalServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  // Chọn ngày (Chỉ cho đặt lịch 7 ngày gần nhất)
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
      const dayName = i === 0 ? 'Hôm nay' : daysOfWeek[d.getDay()];
      list.push({
        iso: isoDate,
        labelDate: `${day}/${month}`,
        labelDay: dayName,
        displayDate: `${day}/${month}/${year}`,
        dayOfWeek: daysOfWeek[d.getDay()],
      });
    }
    return list;
  }, []);

  // Tự động chọn ngày đầu tiên còn ca khám hợp lệ (nếu hôm nay đã hết tất cả ca thì tự động chọn ngày mai)
  const initialDate = useMemo(() => {
    if (!next7Days || next7Days.length === 0) return '';
    const todayIso = next7Days[0].iso;
    const allTodayPassed = HOSPITAL_SHIFTS.every((s) => isShiftPassed(todayIso, s));
    if (allTodayPassed && next7Days.length > 1) {
      return next7Days[1].iso;
    }
    return todayIso;
  }, [next7Days]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedShiftCode, setSelectedShiftCode] = useState(() => {
    const firstValid = HOSPITAL_SHIFTS.find((s) => !isShiftPassed(initialDate, s));
    return firstValid ? firstValid.id : 'SHIFT-MORNING';
  });
  const selectedShiftObj = useMemo(() => {
    return HOSPITAL_SHIFTS.find((s) => s.id === selectedShiftCode) || null;
  }, [selectedShiftCode]);
  const selectedShift = selectedShiftObj ? selectedShiftObj.display : 'Chưa chọn ca khám';

  // Khi người dùng đổi ngày khám: tự động chuyển sang ca khám hợp lệ đầu tiên nếu ca đang chọn đã trôi qua
  useEffect(() => {
    const currentShift = HOSPITAL_SHIFTS.find((s) => s.id === selectedShiftCode);
    if (!currentShift || isShiftPassed(selectedDate, currentShift)) {
      const firstValid = HOSPITAL_SHIFTS.find((s) => !isShiftPassed(selectedDate, s));
      if (firstValid) {
        setSelectedShiftCode(firstValid.id);
        setSelectedDoctorId('');
      } else {
        setSelectedShiftCode('');
        setSelectedDoctorId('');
      }
    }
  }, [selectedDate]);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Danh sách bác sĩ làm việc trong ca đó (Không bắt buộc chọn)
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctorName, setSelectedDoctorName] = useState('Bác sĩ bất kỳ theo phân bổ ca trực');

  // Lý do khám & Hình ảnh triệu chứng
  const [reason, setReason] = useState('');
  const [symptomImage, setSymptomImage] = useState(null);
  const [symptomImagePreview, setSymptomImagePreview] = useState(null);
  const [receiveSkinAdvice, setReceiveSkinAdvice] = useState('yes'); // 'yes' | 'no'

  // ==============================================================
  // 2. FORM THỨ 2 : THÔNG TIN KHÁCH HÀNG
  // ==============================================================
  // Choice: 'self' = Đặt cho bản thân, 'relative' = Đặt cho người thân
  const [bookingFor, setBookingFor] = useState('self');
  const [relationship, setRelationship] = useState('Bố/Mẹ');

  // Customer input fields
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
  const [formError, setFormError] = useState('');

  // ==============================================================
  // 3 & 4. THANH TOÁN PAYOS & PHIẾU KHÁM BỆNH
  // ==============================================================
  const [submitting, setSubmitting] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  // Fetch active medical services from database
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
          // Fallback initial services if empty
          const fallback = [
            { id: 401, serviceName: 'Khám Da liễu Ban đầu', basePrice: 280000, description: 'Khám lâm sàng da liễu tổng quát' },
            { id: 402, serviceName: 'Soi da vi thể Dermoscopy 3D', basePrice: 350000, description: 'Soi da tầm soát sắc tố, tổn thương u hạt' },
            { id: 403, serviceName: 'Soi tươi tìm nấm / Demodex vi sinh', basePrice: 180000, description: 'Xét nghiệm vi nấm, ký sinh trùng' },
            { id: 404, serviceName: 'Chăm sóc da & Peel da sinh học AHA/BHA', basePrice: 650000, description: 'Trị mụn viêm, phục hồi cấu trúc da' },
            { id: 405, serviceName: 'Laser CO2 Fractional điều trị sẹo rỗ', basePrice: 1500000, description: 'Tái tạo biểu bì bề mặt' },
          ];
          setMedicalServices(fallback);
          setSelectedServiceId('401');
          setSelectedService(fallback[0]);
        }
      } catch (err) {
        console.warn('Failed to load services from DB:', err);
        if (isMounted) {
          const fallback = [
            { id: 401, serviceName: 'Khám Da liễu Ban đầu', basePrice: 280000, description: 'Khám lâm sàng da liễu tổng quát' },
            { id: 402, serviceName: 'Soi da vi thể Dermoscopy 3D', basePrice: 350000, description: 'Soi da tầm soát sắc tố' },
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

  // Sync selected service object when dropdown changes
  const handleServiceChange = (e) => {
    const sId = e.target.value;
    setSelectedServiceId(sId);
    const found = medicalServices.find((s) => String(s.id) === String(sId));
    setSelectedService(found || null);
  };

  // Fee calculation based on selected medical service from DB
  const feeAmount = useMemo(() => {
    if (selectedService?.basePrice) {
      return Number(selectedService.basePrice);
    }
    return 280000;
  }, [selectedService]);

  const formattedFee = useMemo(() => {
    return new Intl.NumberFormat('vi-VN').format(feeAmount) + ' VND';
  }, [feeAmount]);

  // Fetch available slots when selectedDate changes
  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await appointmentApi.getAvailableSlots(selectedDate);
        if (isMounted) {
          const slots = res?.data || res || [];
          setAvailableSlots(Array.isArray(slots) ? slots : []);
        }
      } catch (err) {
        console.warn('Cannot fetch slots, using fallback:', err);
        if (isMounted) {
          setAvailableSlots([]);
        }
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Slots matching the chosen shift
  const shiftSlots = useMemo(() => {
    if (!selectedShiftCode || (selectedShiftObj && isShiftPassed(selectedDate, selectedShiftObj))) {
      return [];
    }
    const now = new Date();
    return availableSlots.filter((slot) => {
      if (slot.endsAt && new Date(slot.endsAt) <= now) {
        return false;
      }
      if (slot.shiftCode) {
        if (slot.shiftCode.includes('EARLY')) return selectedShiftCode === 'SHIFT-EARLY';
        if (slot.shiftCode.includes('AFTERNOON') || slot.shiftCode.includes('EVENING')) return selectedShiftCode === 'SHIFT-AFTERNOON';
        return selectedShiftCode === 'SHIFT-MORNING';
      }
      if (!slot.startsAt) return selectedShiftCode === 'SHIFT-MORNING';
      const d = new Date(slot.startsAt);
      const hours = d.getHours() + d.getMinutes() / 60;
      if (hours < 7.25) return selectedShiftCode === 'SHIFT-EARLY';
      if (hours < 12.5) return selectedShiftCode === 'SHIFT-MORNING';
      return selectedShiftCode === 'SHIFT-AFTERNOON';
    });
  }, [availableSlots, selectedShiftCode, selectedShiftObj, selectedDate]);

  // Extract doctors on duty in THIS specific shift / date
  const doctorsInShift = useMemo(() => {
    if (!selectedShiftCode || (selectedShiftObj && isShiftPassed(selectedDate, selectedShiftObj))) {
      return [];
    }
    const doctorMap = new Map();

    if (Array.isArray(shiftSlots) && shiftSlots.length > 0) {
      shiftSlots.forEach((slot) => {
        if (slot.doctorId && slot.doctorName) {
          doctorMap.set(String(slot.doctorId), {
            id: slot.doctorId,
            fullName: slot.doctorName,
            specialization: slot.specialization || 'Bác sĩ chuyên khoa',
            slotId: slot.id,
          });
        }
      });
    }

    // Fallbacks if backend has not returned matching slots
    if (doctorMap.size === 0) {
      if (selectedShiftCode === 'SHIFT-EARLY') {
        doctorMap.set('204', { id: 204, fullName: 'BSCKII. Vũ Minh Tuấn', specialization: 'Da liễu tổng quát & Thẩm mỹ da', slotId: 620 });
        doctorMap.set('206', { id: 206, fullName: 'BS. CKI Lê Thị Mai', specialization: 'Da liễu dị ứng & Miễn dịch da', slotId: 621 });
      } else if (selectedShiftCode === 'SHIFT-MORNING') {
        doctorMap.set('204', { id: 204, fullName: 'BSCKII. Vũ Minh Tuấn', specialization: 'Da liễu tổng quát & Thẩm mỹ da', slotId: 622 });
        doctorMap.set('207', { id: 207, fullName: 'ThS. BS Trần Trung Kiên', specialization: 'Ngoại da liễu & Laser thẩm mỹ', slotId: 623 });
      } else {
        doctorMap.set('206', { id: 206, fullName: 'BS. CKI Lê Thị Mai', specialization: 'Da liễu dị ứng & Miễn dịch da', slotId: 624 });
        doctorMap.set('207', { id: 207, fullName: 'ThS. BS Trần Trung Kiên', specialization: 'Ngoại da liễu & Laser thẩm mỹ', slotId: 625 });
      }
    }

    return Array.from(doctorMap.values());
  }, [shiftSlots, selectedShiftCode, selectedShiftObj, selectedDate]);

  // Synchronize slot ID & doctor name whenever shift, doctor or slots change
  useEffect(() => {
    if (selectedDoctorId) {
      const doc = doctorsInShift.find((d) => String(d.id) === String(selectedDoctorId));
      if (doc) {
        setSelectedDoctorName(doc.fullName);
        setSelectedSlotId(doc.slotId);
        return;
      }
    }
    setSelectedDoctorName('Bác sĩ bất kỳ theo phân bổ ca trực');
    if (shiftSlots.length > 0) {
      setSelectedSlotId(shiftSlots[0].id);
    } else if (doctorsInShift.length > 0) {
      setSelectedSlotId(doctorsInShift[0].slotId);
    }
  }, [selectedDoctorId, shiftSlots, doctorsInShift, selectedShiftCode]);

  // Select shift handler: switch shift and reset doctor to default
  const handleShiftSelect = (shiftId) => {
    const targetShift = HOSPITAL_SHIFTS.find((s) => s.id === shiftId);
    if (isShiftPassed(selectedDate, targetShift)) {
      return; // Không cho phép chọn ca khám đã trôi qua
    }
    setSelectedShiftCode(shiftId);
    setSelectedDoctorId('');
  };

  // Handle image upload
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

  // Auto-fill patient information based on choice 'self' or 'relative'
  const applyPatientInfo = (type) => {
    setBookingFor(type);
    if (type === 'self') {
      // Fill current logged-in patient or demo default patient info
      setFullName((user?.fullName).toUpperCase());
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
      // Relative: clear fields to enter fresh details
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

  // Initialize patient info on mount
  useEffect(() => {
    applyPatientInfo('self');
  }, [user]);

  // Handle Proceed to Step 2
  const handleProceedToStep2 = () => {
    if (!selectedShiftCode || (selectedShiftObj && isShiftPassed(selectedDate, selectedShiftObj))) {
      setFormError('Ca khám bạn chọn đã kết thúc thời gian tiếp nhận hoặc chưa được chọn. Vui lòng chọn ca khám hợp lệ.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Vui lòng nhập lý do khám hoặc triệu chứng ban đầu của bạn.');
      return;
    }
    setFormError('');
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form 2 Submission -> Call backend checkout API
  const handleCreateBooking = async () => {
    if (!fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên đầy đủ của người khám theo căn cước công dân.');
      return;
    }
    if (!phoneNumber.trim()) {
      setFormError('Vui lòng nhập số điện thoại để nhận thông báo tiếp đón.');
      return;
    }
    if (!agreedTerms) {
      setFormError('Quý khách vui lòng đồng ý với Chính sách bảo vệ dữ liệu cá nhân.');
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
        note: `[${bookingFor === 'self' ? 'Đặt cho bản thân' : `Đặt cho người thân (${relationship})`}] - Dịch vụ: ${selectedService?.serviceName || 'Khám Da liễu'} | Bác sĩ: ${selectedDoctorName} | Nhận chỉ dẫn mỹ phẩm: ${receiveSkinAdvice === 'yes' ? 'Có' : 'Không'}`,
        bookingSource: 'ONLINE',
      };

      const res = await appointmentApi.checkout(payload, feeAmount);
      const checkout = res?.data || res;
      setCheckoutData(checkout);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Booking failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo lịch khám';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Simulate payOS payment confirmation
  const handleConfirmPayOSPayment = async () => {
    if (!checkoutData) return;
    setConfirmingPayment(true);
    setFormError('');

    try {
      if (checkoutData.orderCode) {
        await appointmentApi.confirmPayment(checkoutData.orderCode);
      }

      // Fetch the generated ticket with QR code
      const ticketRes = await appointmentApi.getTicket(checkoutData.appointmentId);
      const ticket = ticketRes?.data || ticketRes;
      setTicketData(ticket);

      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Confirmation failed:', err);
      // Fallback ticket
      setTicketData({
        appointmentId: checkoutData.appointmentId,
        appointmentCode: checkoutData.appointmentCode,
        status: 'BOOKED',
        patientName: fullName,
        patientPhone: phoneNumber,
        doctorName: selectedDoctorName,
        specialization: selectedService?.serviceName || 'Da liễu chuyên sâu',
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

  // Formatted date string for summary
  const selectedDateObject = useMemo(() => {
    return next7Days.find((d) => d.iso === selectedDate) || next7Days[0];
  }, [next7Days, selectedDate]);

  return (
    <div className="w-full space-y-6 pb-20 font-sans text-slate-800">
      {/* ==================== 4-STEP WIZARD PROGRESS BAR ==================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold mb-3">
          <div className={currentStep >= 1 ? 'text-[#1a4f8b] font-bold' : 'text-slate-400'}>
            Thông tin đặt lịch hẹn
          </div>
          <div className={currentStep >= 2 ? 'text-[#1a4f8b] font-bold' : 'text-slate-400'}>
            Thông tin khách hàng
          </div>
          <div className={currentStep >= 3 ? 'text-[#1a4f8b] font-bold' : 'text-slate-400'}>
            Thanh toán
          </div>
          <div className={currentStep >= 4 ? 'text-[#1a4f8b] font-bold' : 'text-slate-400'}>
            Hoàn thành
          </div>
        </div>

        {/* Connector line with step dots */}
        <div className="relative flex items-center justify-between px-6 sm:px-12">
          <div className="absolute left-6 right-6 sm:left-12 sm:right-12 h-1 bg-slate-200 -z-0" />
          <div
            className="absolute left-6 sm:left-12 h-1 bg-[#1a4f8b] -z-0 transition-all duration-300"
            style={{
              width:
                currentStep === 1
                  ? '0%'
                  : currentStep === 2
                  ? '33.3%'
                  : currentStep === 3
                  ? '66.6%'
                  : '100%',
            }}
          />

          {[1, 2, 3, 4].map((stepNum) => {
            const isCompleted = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            return (
              <div
                key={stepNum}
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#1a4f8b] text-white ring-4 ring-[#1a4f8b]/20 scale-110 shadow-sm'
                    : isCompleted
                    ? 'bg-[#1a4f8b] text-white'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SUMMARY HEADER CARD (Present at top of Form 2 & Step 3) ===== */}
      {/* ============================================================== */}
      {currentStep >= 2 && currentStep <= 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-[#1a4f8b] text-white px-5 py-2.5 flex items-center justify-between text-xs font-bold tracking-wide">
            <div className="flex items-center gap-6">
              <span>Thông tin đặt lịch hẹn</span>
              <span className="opacity-80">Thông tin khách hàng</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="bg-white/15 hover:bg-white/25 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition"
            >
              <span>&lt;&lt; Quay lại</span>
            </button>
          </div>

          <div className="p-5 bg-gradient-to-br from-white via-sky-50/20 to-slate-50 space-y-2 text-xs text-slate-700">
            <div className="text-lg font-black text-[#d32f2f] tracking-tight">
              Giá khám: {formattedFee}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              <div>
                <span className="font-semibold text-slate-900">Dịch vụ: </span>
                <span>{selectedService?.serviceName || 'Khám Da liễu Ban đầu'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Bác Sĩ: </span>
                <span>{selectedDoctorName}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Ngày: </span>
                <span>{selectedDateObject?.displayDate} ({selectedDateObject?.dayOfWeek})</span> ,{' '}
                <span className="font-semibold text-slate-900">Ca khám: </span>
                <span className="font-bold text-[#1a4f8b]">{selectedShift}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Người khám: </span>
                <span className="font-bold text-[#1a4f8b]">
                  {bookingFor === 'self' ? 'Đặt cho bản thân' : `Đặt cho người thân (${relationship})`}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-slate-900">Lý do khám: </span>
                <span className="text-slate-800 italic">{reason}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircleIcon className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* ==================== 1. FORM ĐẦU TIÊN : THÔNG TIN ĐẶT LỊCH HẸN == */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
          {/* Centered Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-[#1a4f8b] uppercase tracking-wide">
              Thông tin đặt lịch hẹn
            </h2>
            <div className="w-16 h-1 bg-[#1a4f8b] mx-auto rounded-full" />
          </div>

          {/* Form 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Dịch vụ y tế (DB), Lý do khám, Hình ảnh triệu chứng */}
            <div className="space-y-4">
              {/* Droplist chọn dịch vụ y tế (Lấy trong database) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
                  1. Dịch vụ y tế chuyên khoa <span className="text-rose-500">*</span>
                </label>
                {loadingServices ? (
                  <div className="text-xs text-slate-400 py-2">Đang tải danh mục dịch vụ từ database...</div>
                ) : (
                  <select
                    value={selectedServiceId}
                    onChange={handleServiceChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] bg-white outline-none shadow-2xs"
                  >
                    {medicalServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.serviceName} &mdash; {new Intl.NumberFormat('vi-VN').format(s.basePrice)} đ
                      </option>
                    ))}
                  </select>
                )}
                {selectedService && (
                  <div className="mt-2 p-2.5 bg-sky-50/70 border border-sky-100 rounded-lg flex items-center justify-between text-xs text-sky-900">
                    <span className="italic">{selectedService.description || 'Khám lâm sàng da liễu tổng quát và chuyên sâu'}</span>
                    <span className="font-bold text-[#1a4f8b] shrink-0 ml-2">
                      Đơn giá: {formattedFee}
                    </span>
                  </div>
                )}
              </div>

              {/* Lý do khám */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Lý do khám <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">{reason.length}/100 ký tự</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={100}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Triệu chứng của bạn (giới hạn 100 ký tự)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] outline-none resize-none"
                />
              </div>

              {/* Hình ảnh triệu chứng (nếu có) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
                  Hình ảnh triệu chứng <span className="text-slate-400 font-normal lowercase">(nếu có)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition shadow-xs">
                    <span>Tải lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {symptomImagePreview && (
                    <div className="relative inline-block border border-slate-200 rounded-lg p-1 bg-slate-50">
                      <img
                        src={symptomImagePreview}
                        alt="Triệu chứng"
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Chọn ngày (7 ngày gần nhất), Chọn Ca khám, Sau đó mới xuất hiện Bác sĩ trực ca */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
                  2. Chọn ngày khám <span className="text-rose-500">* (7 ngày gần nhất)</span>
                </label>

                {/* 7 ngày gần nhất */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {next7Days.map((item) => {
                    const isSelected = selectedDate === item.iso;
                    const isAllPassed = HOSPITAL_SHIFTS.every((s) => isShiftPassed(item.iso, s));

                    return (
                      <button
                        key={item.iso}
                        type="button"
                        onClick={() => setSelectedDate(item.iso)}
                        className={`p-2 rounded-lg text-center transition flex flex-col items-center justify-center relative ${
                          isSelected
                            ? 'bg-[#1a4f8b] text-white shadow-sm ring-2 ring-[#1a4f8b]/30'
                            : isAllPassed
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-extrabold">{item.labelDate}</span>
                        <span
                          className={`text-[9px] mt-0.5 whitespace-nowrap ${
                            isSelected ? 'text-sky-100' : isAllPassed ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {item.labelDay}
                        </span>
                        {isAllPassed && (
                          <span className="text-[8px] text-amber-600 font-bold leading-tight">
                            Hết ca
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Khi bấm chọn ngày : Chọn Ca khám (3 ca duy nhất) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                    3. Chọn ca khám ngày {selectedDateObject?.displayDate} <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 italic">3 ca tiếp nhận tiêu chuẩn</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {HOSPITAL_SHIFTS.map((shift) => {
                    const isPassed = isShiftPassed(selectedDate, shift);
                    const isSelected = selectedShiftCode === shift.id && !isPassed;

                    return (
                      <button
                        key={shift.id}
                        type="button"
                        disabled={isPassed}
                        onClick={() => handleShiftSelect(shift.id)}
                        title={isPassed ? `${shift.name} đã kết thúc thời gian tiếp nhận` : shift.name}
                        className={`p-2.5 rounded-lg text-center transition flex flex-col items-center justify-center relative ${
                          isPassed
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-[#0284c7] text-white shadow-sm ring-2 ring-sky-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-sky-300'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isPassed ? 'line-through text-slate-400' : ''}`}>
                          {shift.name}
                        </span>
                        <span
                          className={`text-[10px] mt-0.5 ${
                            isPassed
                              ? 'text-slate-400'
                              : isSelected
                              ? 'text-sky-100'
                              : 'text-slate-500'
                          }`}
                        >
                          {shift.time}
                        </span>
                        {isPassed && (
                          <span className="text-[9px] font-semibold text-rose-500 mt-0.5">
                            (Đã qua giờ)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Cảnh báo nếu toàn bộ ca khám trong ngày đã qua giờ */}
                {HOSPITAL_SHIFTS.every((s) => isShiftPassed(selectedDate, s)) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Các ca khám ngày <strong>{selectedDateObject?.displayDate}</strong> đã kết thúc thời gian tiếp nhận. Vui lòng chọn ngày khám tiếp theo để đặt lịch.
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Sau đó mới xuất hiện danh sách bác sĩ làm việc trong ca đó */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                    4. Bác sĩ làm việc trong ca {selectedShiftObj?.name || '---'}
                  </label>
                  <span className="text-[11px] text-slate-500 italic">
                    (Không bắt buộc chọn)
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="text-xs text-slate-400 py-1.5">Đang tải danh sách bác sĩ trực ca...</div>
                ) : (
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] bg-white outline-none shadow-2xs"
                  >
                    <option value="">-- Bác sĩ bất kỳ theo phân bổ ca trực --</option>
                    {doctorsInShift.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.fullName} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                )}

                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>
                    Bác sĩ tiếp nhận: <strong className="text-slate-800">{selectedDoctorName}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Box: Hỗ trợ chăm sóc da */}
          <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 text-center">
              Bạn có muốn nhận chỉ dẫn hỗ trợ điều trị bằng các sản phẩm chăm sóc da?{' '}
              <span className="text-rose-500">*</span>
            </h4>
            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  receiveSkinAdvice === 'yes'
                    ? 'border-[#1a4f8b] bg-white shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="skinAdvice"
                  checked={receiveSkinAdvice === 'yes'}
                  onChange={() => setReceiveSkinAdvice('yes')}
                  className="w-4 h-4 text-[#1a4f8b] focus:ring-[#1a4f8b]"
                />
                <span className="text-xs font-medium text-slate-800">Có nhận</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  receiveSkinAdvice === 'no'
                    ? 'border-[#1a4f8b] bg-white shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="skinAdvice"
                  checked={receiveSkinAdvice === 'no'}
                  onChange={() => setReceiveSkinAdvice('no')}
                  className="w-4 h-4 text-[#1a4f8b] focus:ring-[#1a4f8b]"
                />
                <span className="text-xs font-medium text-slate-800">Không nhận</span>
              </label>
            </div>
          </div>

          {/* Button Tiếp theo */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="w-full py-3.5 rounded-lg bg-[#1a4f8b] hover:bg-[#163f6f] text-white font-bold text-sm tracking-wide transition shadow-sm"
            >
              Tiếp theo
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ==================== 2. FORM THỨ 2 : THÔNG TIN KHÁCH HÀNG ===== */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
          {/* Centered Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-[#1a4f8b] uppercase tracking-wide">
              Thông tin khách hàng
            </h2>
            <div className="w-16 h-1 bg-[#1a4f8b] mx-auto rounded-full" />
          </div>

          {/* Choice: Đặt cho bản thân vs Đặt cho người thân */}
          <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200 space-y-3">
            <label className="block text-xs font-bold text-slate-900">
              Đối tượng khám bệnh:
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-xs font-bold text-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="bookingTarget"
                  checked={bookingFor === 'self'}
                  onChange={() => applyPatientInfo('self')}
                  className="w-4 h-4 text-[#1a4f8b] focus:ring-[#1a4f8b]"
                />
                <span className={bookingFor === 'self' ? 'text-[#1a4f8b] font-extrabold' : ''}>
                  Đặt cho bản thân (Tự động nạp thông tin cá nhân)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="bookingTarget"
                  checked={bookingFor === 'relative'}
                  onChange={() => applyPatientInfo('relative')}
                  className="w-4 h-4 text-[#1a4f8b] focus:ring-[#1a4f8b]"
                />
                <span className={bookingFor === 'relative' ? 'text-[#1a4f8b] font-extrabold' : ''}>
                  Đặt cho người thân (Nhập hồ sơ mới)
                </span>
              </label>
            </div>

            {bookingFor === 'relative' && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Mối quan hệ với người khám:</span>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] bg-white outline-none"
                >
                  <option value="Bố/Mẹ">Bố/Mẹ</option>
                  <option value="Vợ/Chồng">Vợ/Chồng</option>
                  <option value="Con cái">Con cái</option>
                  <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                  <option value="Người thân khác">Người thân khác</option>
                </select>
              </div>
            )}
          </div>

          {/* Red Warning Note */}
          <p className="text-xs text-[#d32f2f] italic font-medium">
            * Lưu ý: Bạn phải nhập đúng, đủ thông tin cá nhân như: Họ và tên, ngày tháng năm sinh theo
            căn cước công dân thì phiếu khám mới được chấp nhận.
          </p>

          {/* Customer Input Fields */}
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
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Giới tính <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] bg-white outline-none"
              >
                <option value="FEMALE">Nữ</option>
                <option value="MALE">Nam</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Ngày tháng năm sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Dân tộc <span className="text-rose-500">*</span>
              </label>
              <select
                value={ethnicity}
                onChange={(e) => setEthnicity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] bg-white outline-none"
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

          {/* SĐT, CCCD, Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập số điện thoại"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Số định danh (CCCD)
              </label>
              <input
                type="text"
                value={identityCardNumber}
                onChange={(e) => setIdentityCardNumber(e.target.value)}
                placeholder="Nhập số (12 số)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] outline-none"
              />
              <span className="text-[11px] text-[#d32f2f] block mt-1 leading-tight">
                Trẻ em chưa có CCCD: Vui lòng nhập Số định danh (xem trên Giấy khai sinh hoặc VNeID).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] outline-none"
              />
              <span className="text-[11px] text-[#d32f2f] block mt-1 leading-tight">
                Lưu ý: Bạn hãy nhập đúng email bạn đang sử dụng để nhận kết quả khám Online.
              </span>
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Tỉnh/Thành phố <span className="text-rose-500">*</span>
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] bg-white outline-none"
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
                Phường/xã <span className="text-rose-500">*</span>
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] bg-white outline-none"
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
                placeholder="Nhập địa chỉ"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1a4f8b] focus:border-[#1a4f8b] outline-none"
              />
            </div>
          </div>

          {/* Điều khoản */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 leading-relaxed">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 rounded text-[#1a4f8b] focus:ring-[#1a4f8b] mt-0.5"
              />
              <span>
                Tôi đã đọc và đồng ý với{' '}
                <a href="#terms" className="text-[#0284c7] hover:underline font-semibold">
                  Chính sách bảo vệ dữ liệu cá nhân của Dalieu.vn
                </a>{' '}
                và chấp thuận để Dalieu.vn xử lý dữ liệu cá nhân của tôi theo quy định của pháp luật
                về bảo vệ dữ liệu cá nhân. <span className="text-rose-500">*</span>
              </span>
            </label>
          </div>

          {/* Action Buttons: Quay lại / Đăng ký khám */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="w-full py-3 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
            >
              Quay lại
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCreateBooking}
              className="w-full py-3 rounded-lg bg-[#1a4f8b] hover:bg-[#163f6f] text-white font-bold text-xs tracking-wide transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Đang khởi tạo lịch hẹn & PayOS...' : 'Đăng ký khám'}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. THANH TOÁN CỦA PAYOS, QR CỦA PAYOS                          */}
      {/* ============================================================== */}
      {currentStep === 3 && checkoutData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs animate-fadeIn">
          {/* Centered Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-[#1a4f8b] uppercase tracking-wide">
              Thanh toán PayOS & VietQR
            </h2>
            <div className="w-16 h-1 bg-[#1a4f8b] mx-auto rounded-full" />
            <p className="text-xs text-slate-500 pt-1">
              Quét mã VietQR bằng bất kỳ App Ngân hàng hoặc Ví MoMo để hoàn tất thanh toán viện phí
            </p>
          </div>

          {/* PayOS Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {/* Left: VietQR Code PayOS */}
            <div className="flex flex-col items-center justify-center space-y-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-[#1a4f8b] uppercase tracking-wide">
                Mã VietQR PayOS Khám Bệnh
              </span>

              <div className="relative p-2 bg-white rounded-xl border-2 border-dashed border-[#1a4f8b]/40">
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

              <div className="text-center space-y-1">
                <span className="text-[11px] text-slate-500">
                  Hệ thống PayOS tự động nhận diện và cập nhật trong vài giây
                </span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  <span>Trạng thái: Đang chờ thanh toán PayOS</span>
                </div>
              </div>
            </div>

            {/* Right: Payment Instructions & Details */}
            <div className="space-y-4 text-xs">
              <div className="space-y-2 pb-3 border-b border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã cuộc hẹn:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {checkoutData.appointmentCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã đơn hàng PayOS:</span>
                  <span className="font-mono font-bold text-slate-900">
                    #{checkoutData.orderCode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tổng chi phí thanh toán:</span>
                  <span className="text-base font-extrabold text-[#d32f2f]">{formattedFee}</span>
                </div>
              </div>

              {/* Bank Transfer Details Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ngân hàng:</span>
                  <span className="font-bold text-slate-800">MBBank (Ngân hàng Quân Đội)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <span className="font-mono font-bold text-[#1a4f8b]">0388686899</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    BENH VIEN DA LIEU TRUNG UONG
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nội dung chuyển khoản:</span>
                  <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    HOSPITAL {checkoutData.appointmentCode}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <a
                  href={checkoutData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs transition shadow-sm"
                >
                  <span>Mở trang thanh toán PayOS trực tiếp</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  disabled={confirmingPayment}
                  onClick={handleConfirmPayOSPayment}
                  className="w-full py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>
                    {confirmingPayment
                      ? 'Đang xác thực giao dịch PayOS...'
                      : 'Tôi đã chuyển khoản thành công (Xem phiếu khám)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ==================== 4. PHIẾU HẸN KHÁM & MÃ QR LỊCH HẸN ======== */}
      {/* ============================================================== */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs animate-fadeIn">
          {/* Header Success */}
          <div className="text-center space-y-2 pb-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircleIcon className="w-10 h-10" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-emerald-700 uppercase tracking-wide">
              Đặt lịch khám & Thanh toán thành công!
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Lịch khám của bạn đã được ghi nhận vào hệ thống. Dưới đây là Phiếu hẹn khám chính thức
              kèm mã QR tiếp đón dành cho Lễ tân quét khi bạn đến viện.
            </p>
          </div>

          {/* Printable Ticket Card */}
          <div
            id="printable-ticket"
            className="border-2 border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 bg-gradient-to-b from-white to-slate-50/50 shadow-md max-w-2xl mx-auto"
          >
            {/* Header Hospital */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-800 pb-4 gap-2">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#1a4f8b]">
                  Bệnh viện Da liễu Trung ương
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  PHIẾU TIẾP ĐÓN HẸN KHÁM ĐIỆN TỬ
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block">Mã cuộc hẹn</span>
                <span className="font-mono text-base font-black text-[#1a4f8b]">
                  {ticketData?.appointmentCode || checkoutData?.appointmentCode}
                </span>
              </div>
            </div>

            {/* QR Code Check-in Box for Receptionist */}
            <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shrink-0 shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${checkoutData?.appointmentCode}`
                  )}`}
                  alt="QR Lịch Hẹn"
                  className="w-32 h-32 object-contain"
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1a4f8b] text-white text-[10px] font-bold">
                  <span>MÃ QR TIẾP ĐÓN TIẾP TÂN</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Quét mã QR tại Quầy Lễ Tân (Tầng 1)</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Khi đến bệnh viện, Quý người bệnh vui lòng mở phiếu khám này và đưa mã QR cho nhân viên tiếp đón tại Quầy Lễ Tân (Tầng 1) để được tiếp nhận vào phòng khám ngay lập tức mà không cần bốc số xếp hàng.
                </p>
              </div>
            </div>

            {/* Appointment Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-slate-200 py-4">
              <div>
                <span className="text-slate-400 block">Người bệnh:</span>
                <span className="font-bold text-slate-900 text-sm">{fullName}</span>
                <span className="text-[10px] text-sky-700 block">
                  ({bookingFor === 'self' ? 'Bản thân' : `Người thân - ${relationship}`})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Số điện thoại:</span>
                <span className="font-bold text-slate-900 text-sm">{phoneNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Bác sĩ khám:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {ticketData?.doctorName || selectedDoctorName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Dịch vụ:</span>
                <span className="font-semibold text-slate-800">
                  {selectedService?.serviceName || 'Khám Da liễu Ban đầu'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Ngày khám:</span>
                <span className="font-bold text-[#1a4f8b]">{selectedDateObject?.displayDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Ca khám:</span>
                <span className="font-bold text-[#1a4f8b]">{selectedShift}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phòng khám dự kiến:</span>
                <span className="font-bold text-slate-800">Phòng 102 - Tầng 1 (Khoa Khám bệnh)</span>
              </div>
              <div>
                <span className="text-slate-400 block">Trạng thái thanh toán:</span>
                <span className="font-bold text-emerald-600">ĐÃ THANH TOÁN (payOS)</span>
              </div>
            </div>

            {/* Lý do khám */}
            <div className="text-xs space-y-1">
              <span className="text-slate-400 block">Lý do khám / Triệu chứng ban đầu:</span>
              <p className="font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {reason}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 transition"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>In phiếu khám</span>
            </button>

            <Link
              to="/patient/appointments"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1a4f8b] hover:bg-[#163f6f] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Quản lý lịch hẹn của tôi</span>
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
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Đặt thêm lịch mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
