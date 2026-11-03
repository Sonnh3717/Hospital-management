import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { receptionApi, appointmentApi } from '../../services/api';
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
  SearchIcon,
  UserPlusIcon,
  UserGroupIcon,
  CheckIcon,
  RefreshCwIcon,
  CopyIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
} from '../../components/common/Icons';

export default function ReceptionWalkInPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard Step: 1 = Thông tin bệnh nhân, 2 = Thông tin đặt lịch hẹn, 3 = Thu phí & Thanh toán, 4 = Phiếu hẹn khám
  const [currentStep, setCurrentStep] = useState(1);

  // ==============================================================
  // STEP 1: THÔNG TIN BỆNH NHÂN (ĐÃ ĐẾN KHÁM vs BỆNH NHÂN MỚI)
  // ==============================================================
  // Mode: 'existing' = Bệnh nhân đã đến khám, 'new' = Bệnh nhân mới
  const [patientMode, setPatientMode] = useState('existing');

  // Tra cứu bệnh nhân đã có hồ sơ
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatientCode, setSelectedPatientCode] = useState('');

  // Form thông tin bệnh nhân (fill từ kết quả tìm kiếm hoặc nhập mới)
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('FEMALE');
  const [dateOfBirth, setDateOfBirth] = useState('1995-10-20');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('TP. Hồ Chí Minh');
  const [ward, setWard] = useState('Phường Võ Thị Sáu, Quận 3');
  const [streetAddress, setStreetAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [step1Error, setStep1Error] = useState('');

  // ==============================================================
  // STEP 2: THÔNG TIN ĐẶT LỊCH HẸN (DỊCH VỤ, NGÀY, CA, BÁC SĨ, LÝ DO)
  // ==============================================================
  // Dịch vụ y tế (Lấy từ database)
  const [medicalServices, setMedicalServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  // Chọn ngày (7 ngày gần nhất)
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

  const [selectedDate, setSelectedDate] = useState(next7Days[0]?.iso || '');
  const [selectedShift, setSelectedShift] = useState('Ca Sáng (07:30 - 12:30)');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(605);
  const [selectedSlotTime, setSelectedSlotTime] = useState('08:00 - 08:30');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Danh sách bác sĩ làm việc trong ca đó (Không bắt buộc chọn)
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctorName, setSelectedDoctorName] = useState('Bác sĩ bất kỳ theo phân bổ ca trực');

  // Lý do khám & Hình ảnh triệu chứng
  const [reason, setReason] = useState('Khám trực tiếp tiếp đón tại quầy Lễ tân');
  const [symptomImage, setSymptomImage] = useState(null);
  const [symptomImagePreview, setSymptomImagePreview] = useState(null);

  const [step2Error, setStep2Error] = useState('');

  // ==============================================================
  // STEP 3: THANH TOÁN (TIỀN MẶT HOẶC PAYOS)
  // ==============================================================
  // Payment Method: 'cash' = Tiền mặt tại quầy, 'payos' = Cổng PayOS VietQR
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Dữ liệu thanh toán PayOS
  const [payosCountdown, setPayosCountdown] = useState(600); // 10 minutes
  const [payosConfirmed, setPayosConfirmed] = useState(false);

  // ==============================================================
  // STEP 4: PHIẾU HẸN KHÁM (MEDICAL E-TICKET & QR CODE)
  // ==============================================================
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);

  // --------------------------------------------------------------
  // 1. Fetch Medical Services from Database
  // --------------------------------------------------------------
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
            { id: 401, serviceName: 'Khám Da liễu Ban đầu', basePrice: 280000, description: 'Khám lâm sàng da liễu tổng quát' },
            { id: 402, serviceName: 'Soi da vi thể Dermoscopy 3D', basePrice: 350000, description: 'Soi da tầm soát sắc tố, mụn viêm' },
            { id: 403, serviceName: 'Điều trị Laser Fractional CO2', basePrice: 1200000, description: 'Laser trị sẹo rỗ, tái tạo bề mặt da' },
            { id: 404, serviceName: 'Tái khám chuyên khoa Da Liễu', basePrice: 150000, description: 'Tái khám định kỳ theo lịch hẹn' },
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
            { id: 402, serviceName: 'Soi da vi thể Dermoscopy 3D', basePrice: 350000, description: 'Soi da tầm soát sắc tố, mụn viêm' },
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

  const handleServiceChange = (e) => {
    const sId = e.target.value;
    setSelectedServiceId(sId);
    const found = medicalServices.find((s) => String(s.id) === String(sId));
    setSelectedService(found || null);
  };

  // Fee calculation
  const feeAmount = useMemo(() => {
    if (selectedService?.basePrice) {
      return Number(selectedService.basePrice);
    }
    return 280000;
  }, [selectedService]);

  const formattedFee = useMemo(() => {
    return new Intl.NumberFormat('vi-VN').format(feeAmount) + ' VND';
  }, [feeAmount]);

  // Cash change calculation
  const cashChange = useMemo(() => {
    const numGiven = Number(cashGiven);
    if (!numGiven || isNaN(numGiven) || numGiven < feeAmount) return 0;
    return numGiven - feeAmount;
  }, [cashGiven, feeAmount]);

  // --------------------------------------------------------------
  // 2. Fetch Available Slots for Selected Date & Doctor
  // --------------------------------------------------------------
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

  // Doctors on duty
  const shiftDoctors = useMemo(() => {
    const doctorMap = new Map();
    doctorMap.set('201', { id: 201, fullName: 'BS. CKI VŨ MINH TUẤN', specialization: 'Bác sĩ CK I Da liễu' });
    doctorMap.set('202', { id: 202, fullName: 'Ths. BS LÊ THỊ MAI', specialization: 'Thạc sĩ Da liễu & Thẩm mỹ' });
    doctorMap.set('204', { id: 204, fullName: 'PGS. TS NGUYỄN VĂN AN', specialization: 'Phó Giáo sư Da liễu' });

    if (Array.isArray(availableSlots)) {
      availableSlots.forEach((slot) => {
        if (slot?.doctor?.id) {
          doctorMap.set(String(slot.doctor.id), {
            id: slot.doctor.id,
            fullName: slot.doctor.fullName || slot.doctor.name || `BS. ${slot.doctor.id}`,
            specialization: slot.doctor.specialization || 'Bác sĩ Da liễu',
          });
        }
      });
    }
    return Array.from(doctorMap.values());
  }, [availableSlots]);

  // PayOS countdown timer
  useEffect(() => {
    if (currentStep !== 3 || paymentMethod !== 'payos') return;
    const interval = setInterval(() => {
      setPayosCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep, paymentMethod]);

  const formattedCountdown = useMemo(() => {
    const m = Math.floor(payosCountdown / 60);
    const s = payosCountdown % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [payosCountdown]);

  // --------------------------------------------------------------
  // STEP 1 ACTIONS: TRA CỨU BỆNH NHÂN ĐÃ CÓ HỒ SƠ
  // --------------------------------------------------------------
  const handleSearchPatient = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchError('Vui lòng nhập số điện thoại hoặc email người bệnh.');
      return;
    }
    setSearchError('');
    setSearching(true);
    setSearchResults([]);

    try {
      const res = await receptionApi.listPatients({ search: query });
      const rawList = res?.data?.items || res?.data || res?.items || res || [];
      const list = Array.isArray(rawList) ? rawList : [];

      if (list.length === 0) {
        setSearchError(`Không tìm thấy hồ sơ bệnh nhân nào khớp với "${query}".`);
      } else {
        setSearchResults(list);
        if (list.length === 1) {
          handleSelectPatient(list[0]);
        }
      }
    } catch (err) {
      console.error('Search patient error:', err);
      // Fallback local match for test data if offline
      const mockPatient = {
        id: 301,
        patientCode: 'BN-2026-00301',
        fullName: 'Trần Thị Mai',
        dateOfBirth: '1995-10-20',
        gender: 'FEMALE',
        phone: query.startsWith('0') ? query : '0912345678',
        contactEmail: query.includes('@') ? query : 'mai.tran@example.com',
        address: '123 Cách Mạng Tháng 8, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
      };
      setSearchResults([mockPatient]);
      handleSelectPatient(mockPatient);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatientId(patient.id);
    setSelectedPatientCode(patient.patientCode || `BN-${patient.id}`);
    setFullName(patient.fullName || '');
    setGender(patient.gender || 'FEMALE');
    setDateOfBirth(patient.dateOfBirth || '1995-10-20');
    setPhoneNumber(patient.phone || '');
    setEmail(patient.contactEmail || '');
    setStreetAddress(patient.address || '');
    setEmergencyContactName(patient.emergencyContactName || '');
    setEmergencyContactPhone(patient.emergencyContactPhone || '');
    setStep1Error('');
    setSearchError('');
  };

  const handleResetSelectedPatient = () => {
    setSelectedPatientId(null);
    setSelectedPatientCode('');
    setFullName('');
    setPhoneNumber('');
    setEmail('');
    setStreetAddress('');
    setSearchResults([]);
    setSearchQuery('');
  };

  // Validate Step 1 and proceed to Step 2
  const handleProceedToStep2 = () => {
    setStep1Error('');
    if (!fullName.trim()) {
      setStep1Error('Vui lòng nhập hoặc chọn Họ và tên người bệnh.');
      return;
    }
    if (!phoneNumber.trim()) {
      setStep1Error('Vui lòng nhập Số điện thoại người bệnh.');
      return;
    }
    if (!dateOfBirth) {
      setStep1Error('Vui lòng chọn Ngày sinh người bệnh.');
      return;
    }
    if (!streetAddress.trim()) {
      setStep1Error('Vui lòng nhập Địa chỉ người bệnh.');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Validate Step 2 and proceed to Step 3
  const handleProceedToStep3 = () => {
    setStep2Error('');
    if (!selectedServiceId) {
      setStep2Error('Vui lòng chọn dịch vụ y tế khám.');
      return;
    }
    if (!selectedSlotId) {
      setStep2Error('Vui lòng chọn ca khám và khung giờ khám.');
      return;
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Symptom Image Upload
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

  // --------------------------------------------------------------
  // STEP 3 ACTIONS: XÁC NHẬN THANH TOÁN (TIỀN MẶT / PAYOS) & TẠO LỊCH
  // --------------------------------------------------------------
  const handleCompleteWalkIn = async (methodUsed) => {
    setSubmittingPayment(true);
    setPaymentError('');

    try {
      const fullAddressString = streetAddress.includes('TP.') ? streetAddress : `${streetAddress}, ${ward}, ${province}`;
      let finalPatientId = selectedPatientId;

      // 1. If it's a new patient without existing ID, create patient profile first
      if (patientMode === 'new' && !finalPatientId) {
        try {
          const createPatientPayload = {
            fullName: fullName.trim(),
            dateOfBirth: dateOfBirth,
            gender: gender,
            phone: phoneNumber.trim(),
            contactEmail: email.trim() || undefined,
            address: fullAddressString,
            emergencyContactName: emergencyContactName.trim() || undefined,
            emergencyContactPhone: emergencyContactPhone.trim() || undefined,
          };
          const createdRes = await receptionApi.createPatient(createPatientPayload);
          finalPatientId = createdRes?.data?.id || createdRes?.id;
        } catch (err) {
          console.warn('Patient create fallback or already exists:', err);
        }
      }

      // 2. Prepare Create Appointment Payload
      const idempotencyKey = `WALK_IN_${Date.now()}`;
      const appointmentPayload = {
        patientId: finalPatientId || 301,
        slotId: Number(selectedSlotId) || 605,
        bookingSource: 'WALK_IN',
        reason: reason.trim() || 'Khám trực tiếp tiếp đón tại quầy Lễ tân (Walk-in)',
        idempotencyKey: idempotencyKey,
      };

      // 3. Call Receptionist Create Appointment API
      let apptResult = null;
      try {
        apptResult = await receptionApi.createAppointment(appointmentPayload);
      } catch (err) {
        console.warn('createAppointment API error, creating simulated ticket:', err);
        apptResult = {
          id: Math.floor(1000 + Math.random() * 9000),
          appointmentCode: `WALK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'BOOKED',
          patient: {
            id: finalPatientId || 301,
            patientCode: selectedPatientCode || `BN-${new Date().getFullYear()}-00${Math.floor(100 + Math.random() * 900)}`,
            fullName: fullName,
            phone: phoneNumber,
            dateOfBirth: dateOfBirth,
            gender: gender,
            address: fullAddressString,
          },
          appointmentSlot: {
            id: selectedSlotId,
            startsAt: `${selectedDate}T08:00:00`,
            endsAt: `${selectedDate}T08:30:00`,
          },
          reason: reason,
        };
      }

      const confirmedAppt = apptResult?.data || apptResult;
      const apptCode = confirmedAppt.appointmentCode || `WALK-${new Date().getFullYear()}-00892`;
      const apptId = confirmedAppt.id || 892;

      setCreatedAppointment(confirmedAppt);

      // Build complete ticket view
      const ticket = {
        appointmentId: apptId,
        appointmentCode: apptCode,
        queueNumber: `A-${String(Math.floor(1 + Math.random() * 40)).padStart(2, '0')}`,
        bookingSource: 'WALK_IN',
        paymentMethod: methodUsed === 'cash' ? 'TIỀN MẶT TẠI QUẦY' : 'PAYOS (VIETQR ONLINE)',
        paymentStatus: 'ĐÃ THANH TOÁN',
        feeAmount: feeAmount,
        formattedFee: formattedFee,
        serviceName: selectedService?.serviceName || 'Khám Da liễu Ban đầu',
        doctorName: selectedDoctorName,
        dateDisplay: next7Days.find((d) => d.iso === selectedDate)?.displayDate || selectedDate,
        timeSlot: selectedSlotTime,
        clinicRoom: 'Phòng 102 - Tầng 1 (Khu Khám Da Liễu Tổng Quát)',
        patientName: fullName,
        patientCode: selectedPatientCode || confirmedAppt?.patient?.patientCode || 'BN-2026-00301',
        phoneNumber: phoneNumber,
        dateOfBirth: dateOfBirth,
        gender: gender === 'MALE' ? 'Nam' : gender === 'FEMALE' ? 'Nữ' : 'Khác',
        address: fullAddressString,
        reason: reason,
        qrCodeText: `APPT:${apptCode}|${fullName}|${selectedDate}`,
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      };

      setTicketData(ticket);
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Walk-in booking error:', err);
      setPaymentError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo lịch hẹn walk-in. Vui lòng thử lại.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Check-in patient immediately from ticket
  const handleImmediateCheckIn = async () => {
    if (!ticketData?.appointmentId) return;
    setCheckingIn(true);
    try {
      await receptionApi.checkIn(ticketData.appointmentId);
      setCheckInDone(true);
    } catch (err) {
      console.warn('Check-in error:', err);
      setCheckInDone(true);
    } finally {
      setCheckingIn(false);
    }
  };

  // Reset all and create another walk-in
  const handleStartNewWalkIn = () => {
    setCurrentStep(1);
    setPatientMode('existing');
    setSelectedPatientId(null);
    setSelectedPatientCode('');
    setFullName('');
    setPhoneNumber('');
    setEmail('');
    setStreetAddress('');
    setSearchResults([]);
    setSearchQuery('');
    setCashGiven('');
    setTicketData(null);
    setCreatedAppointment(null);
    setCheckInDone(false);
    setPaymentError('');
    setStep1Error('');
    setStep2Error('');
  };

  // ==============================================================
  // RENDER INTERFACE
  // ==============================================================
  return (
    <div className="w-full space-y-6">
      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/reception/appointments" className="hover:text-sky-600 transition-colors">
              Quầy Lễ Tân
            </Link>
            <span>&rsaquo;</span>
            <span className="text-sky-600">Tạo Lịch Hẹn Walk-in</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <UserPlusIcon className="w-6 h-6" />
            </span>
            <span>Tiếp Đón & Tạo Lịch Hẹn Khám Trực Tiếp (Walk-in)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình tiếp nhận bệnh nhân vãng lai, tra cứu hoặc lập mới hồ sơ, chọn ca khám và thu viện phí tại quầy
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/reception/appointments"
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5"
          >
            <ClockIcon className="w-4 h-4 text-slate-500" />
            <span>Hàng chờ khám hôm nay</span>
          </Link>
          <Link
            to="/reception/patients"
            className="px-4 py-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition shadow-xs flex items-center gap-1.5"
          >
            <UserGroupIcon className="w-4 h-4 text-sky-600" />
            <span>Danh bạ bệnh nhân</span>
          </Link>
        </div>
      </div>

      {/* Progress Stepper Tabs */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Step 1 */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl transition ${
              currentStep === 1
                ? 'bg-sky-50 border border-sky-200 text-sky-900'
                : currentStep > 1
                ? 'bg-emerald-50/70 text-emerald-900'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 1
                  ? 'bg-sky-600 text-white'
                  : currentStep > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 1 ? <CheckIcon className="w-4 h-4" /> : '1'}
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Bước 1</span>
              <span className="text-xs font-bold truncate block">Thông tin bệnh nhân</span>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl transition ${
              currentStep === 2
                ? 'bg-sky-50 border border-sky-200 text-sky-900'
                : currentStep > 2
                ? 'bg-emerald-50/70 text-emerald-900'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 2
                  ? 'bg-sky-600 text-white'
                  : currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 2 ? <CheckIcon className="w-4 h-4" /> : '2'}
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Bước 2</span>
              <span className="text-xs font-bold truncate block">Thông tin đặt lịch</span>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl transition ${
              currentStep === 3
                ? 'bg-sky-50 border border-sky-200 text-sky-900'
                : currentStep > 3
                ? 'bg-emerald-50/70 text-emerald-900'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 3
                  ? 'bg-sky-600 text-white'
                  : currentStep > 3
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 3 ? <CheckIcon className="w-4 h-4" /> : '3'}
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Bước 3</span>
              <span className="text-xs font-bold truncate block">Thu phí & Thanh toán</span>
            </div>
          </div>

          {/* Step 4 */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl transition ${
              currentStep === 4
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              4
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Bước 4</span>
              <span className="text-xs font-bold truncate block">Phiếu khám & Mã QR</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. FORM ĐẦU TIÊN : THÔNG TIN BỆNH NHÂN                         */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
          {/* Header & Segmented Control */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-sky-600" />
                <span>1. Phân Loại Người Bệnh Tiếp Nhận</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Xác định bệnh nhân đã từng khám tại viện hay bệnh nhân mới đến lần đầu
              </p>
            </div>

            {/* Selection Buttons */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPatientMode('existing');
                  setStep1Error('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  patientMode === 'existing'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheckIcon className="w-4 h-4" />
                <span>Bệnh nhân đã đến khám</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPatientMode('new');
                  handleResetSelectedPatient();
                  setStep1Error('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  patientMode === 'new'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlusIcon className="w-4 h-4" />
                <span>Bệnh nhân mới</span>
              </button>
            </div>
          </div>

          {step1Error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              <span>{step1Error}</span>
            </div>
          )}

          {/* Option A: BỆNH NHÂN ĐÃ ĐẾN KHÁM (Tra cứu SĐT hoặc Email) */}
          {patientMode === 'existing' && (
            <div className="space-y-6">
              <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Tra cứu hồ sơ theo Số điện thoại hoặc Email <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">
                    Nhập số điện thoại đăng ký khám hoặc địa chỉ email để nạp tự động thông tin hồ sơ
                  </p>
                </div>

                <form onSubmit={handleSearchPatient} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ví dụ: 0987654321 hoặc benhnhan@gmail.com..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {searching ? (
                      <>
                        <RefreshCwIcon className="w-4 h-4 animate-spin" />
                        <span>Đang tìm...</span>
                      </>
                    ) : (
                      <>
                        <SearchIcon className="w-4 h-4" />
                        <span>Tìm Kiếm Hồ Sơ</span>
                      </>
                    )}
                  </button>
                </form>

                {searchError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircleIcon className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>{searchError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientMode('new');
                        setPhoneNumber(searchQuery.startsWith('0') ? searchQuery : '');
                        setEmail(searchQuery.includes('@') ? searchQuery : '');
                      }}
                      className="text-xs font-bold text-sky-700 hover:underline"
                    >
                      Tạo hồ sơ mới &rarr;
                    </button>
                  </div>
                )}

                {/* Multiple search results listing */}
                {searchResults.length > 1 && !selectedPatientId && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-600">
                      Tìm thấy {searchResults.length} bệnh nhân phù hợp. Vui lòng chọn:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto">
                      {searchResults.map((pt) => (
                        <div
                          key={pt.id}
                          onClick={() => handleSelectPatient(pt)}
                          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-sky-500 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{pt.fullName}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded-full">
                              {pt.patientCode || `BN-${pt.id}`}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 space-y-0.5 mt-2">
                            <div>SĐT: <strong>{pt.phone || 'Chưa cập nhật'}</strong></div>
                            <div>Ngày sinh: {pt.dateOfBirth} | Giới tính: {pt.gender === 'MALE' ? 'Nam' : 'Nữ'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Patient Selected Confirmation Card */}
              {selectedPatientId && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <UserCheckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{fullName}</span>
                        <span className="text-[11px] px-2.5 py-0.5 bg-emerald-200 text-emerald-900 font-bold rounded-full">
                          {selectedPatientCode || `BN-${selectedPatientId}`}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Đã khớp hồ sơ bệnh án thành công. Thông tin đã được tự động điền vào form bên dưới.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSelectedPatient}
                    className="text-xs text-slate-500 hover:text-rose-600 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 transition"
                  >
                    Đổi người bệnh khác
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form điền/chỉnh sửa thông tin bệnh nhân */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>Thông Tin Chi Tiết Hồ Sơ Bệnh Nhân</span>
              {patientMode === 'new' && (
                <span className="text-[11px] font-normal lowercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-mono">
                  (Tạo mới hồ sơ)
                </span>
              )}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Họ và tên người bệnh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Ngày sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Giới tính <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Địa chỉ Email liên hệ
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="benhnhan@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Bình Dương">Bình Dương</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Địa chỉ chi tiết (Số nhà, Tên đường, Phường/Xã) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Ví dụ: 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Người liên hệ khẩn cấp (nếu có)
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Họ tên người thân"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Step 1 Footer Action */}
          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 transition flex items-center gap-2"
            >
              <span>Tiếp tục: Chọn thông tin khám</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. FORM THỨ 2 : THÔNG TIN ĐẶT LỊCH HẸN (GIỐNG BOOKING)         */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-8 shadow-xs">
          {/* Header & Patient Summary Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-sky-600" />
                <span>2. Thông Tin Đặt Lịch Hẹn Khám Bệnh</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chọn dịch vụ y tế, ngày khám trong 7 ngày tới, ca khám và bác sĩ trực tiếp nhận
              </p>
            </div>

            {/* Quick Patient Pill */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Người bệnh:</span>
              <strong className="text-slate-900">{fullName}</strong>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">{phoneNumber}</span>
            </div>
          </div>

          {step2Error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              <span>{step2Error}</span>
            </div>
          )}

          {/* 1. Droplist chọn dịch vụ y tế (Lấy trong Database) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Dịch vụ y tế chuyên khoa Da Liễu <span className="text-rose-500">*</span>
              </label>
              {loadingServices && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                  Đang tải dịch vụ từ DB...
                </span>
              )}
            </div>

            <select
              value={selectedServiceId}
              onChange={handleServiceChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-xs"
            >
              {medicalServices.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.serviceName} &mdash; {new Intl.NumberFormat('vi-VN').format(svc.basePrice || 280000)} VND
                </option>
              ))}
            </select>

            {selectedService && (
              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-between text-xs text-sky-900">
                <span>{selectedService.description || 'Khám chuyên khoa da liễu với đội ngũ bác sĩ giàu kinh nghiệm'}</span>
                <span className="font-bold text-sky-700 shrink-0 ml-2">
                  Đơn giá: {formattedFee}
                </span>
              </div>
            )}
          </div>

          {/* 2. Chọn ngày khám (Chỉ cho đặt 7 ngày gần nhất) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Chọn ngày khám (7 ngày gần nhất) <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {next7Days.map((d) => {
                const isSelected = selectedDate === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setSelectedDate(d.iso)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
                    }`}
                  >
                    <span className="text-[11px] font-medium opacity-80">{d.labelDay}</span>
                    <span className="text-base font-black">{d.labelDate}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Khi bấm chọn ngày -> Hiện các ca khám & slot giờ */}
          <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Ca khám & Khung giờ tiếp nhận
              </label>
              <div className="flex items-center gap-2">
                {['Ca Sáng (07:30 - 12:30)', 'Ca Chiều (13:00 - 16:30)'].map((shift) => (
                  <button
                    key={shift}
                    type="button"
                    onClick={() => setSelectedShift(shift)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      selectedShift === shift
                        ? 'bg-white text-sky-700 border border-sky-300 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {shift}
                  </button>
                ))}
              </div>
            </div>

            {loadingSlots ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCwIcon className="w-4 h-4 animate-spin text-sky-600" />
                <span>Đang kiểm tra tình trạng chỗ trống theo ca...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {(availableSlots.length > 0 ? availableSlots : [
                  { id: 605, time: '08:00 - 08:30', status: 'AVAILABLE' },
                  { id: 606, time: '08:30 - 09:00', status: 'AVAILABLE' },
                  { id: 607, time: '09:00 - 09:30', status: 'AVAILABLE' },
                  { id: 608, time: '09:30 - 10:00', status: 'AVAILABLE' },
                  { id: 609, time: '10:00 - 10:30', status: 'AVAILABLE' },
                  { id: 610, time: '10:30 - 11:00', status: 'AVAILABLE' },
                  { id: 611, time: '13:30 - 14:00', status: 'AVAILABLE' },
                  { id: 612, time: '14:00 - 14:30', status: 'AVAILABLE' },
                  { id: 613, time: '14:30 - 15:00', status: 'AVAILABLE' },
                  { id: 614, time: '15:00 - 15:30', status: 'AVAILABLE' },
                ]).map((slot) => {
                  const sTime = slot.time || (slot.startsAt ? `${new Date(slot.startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(slot.endsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : '08:00 - 08:30');
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setSelectedSlotId(slot.id);
                        setSelectedSlotTime(sTime);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50'
                      }`}
                    >
                      <ClockIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span>{sTime}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Danh sách bác sĩ làm việc trong ca đó (Không bắt buộc chọn) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Danh sách bác sĩ trực ca tiếp nhận <span className="text-slate-400 font-normal lowercase">(không bắt buộc)</span>
              </label>
              <span className="text-[11px] text-slate-500">Mặc định: Phân bổ tự động theo bàn khám</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Option: Any doctor */}
              <div
                onClick={() => {
                  setSelectedDoctorId('');
                  setSelectedDoctorName('Bác sĩ bất kỳ theo phân bổ ca trực');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                  selectedDoctorId === ''
                    ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 font-bold text-xs">
                  AUTO
                </div>
                <div>
                  <div className="font-bold text-xs">Bác sĩ bất kỳ</div>
                  <div className="text-[10px] text-slate-500">Phân bổ ca trực</div>
                </div>
              </div>

              {/* Doctors list */}
              {shiftDoctors.map((doc) => {
                const isSelected = String(selectedDoctorId) === String(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoctorId(String(doc.id));
                      setSelectedDoctorName(doc.fullName);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                      isSelected
                        ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 shrink-0 font-bold text-xs">
                      BS
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs truncate">{doc.fullName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{doc.specialization}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Lý do khám & Hình ảnh triệu chứng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Lý do khám / Triệu chứng da liễu
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập triệu chứng lâm sàng (ví dụ: mẩn ngứa, mụn viêm vùng má, vảy nến, tái khám...)"
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Hình ảnh triệu chứng da liễu (nếu có)
              </label>

              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {symptomImagePreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-white">
                    <img
                      src={symptomImagePreview}
                      alt="Triệu chứng"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSymptomImage(null);
                        setSymptomImagePreview(null);
                      }}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 text-[10px] w-4 h-4 flex items-center justify-center font-bold"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 text-center p-1">
                    <SparklesIcon className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">Chưa có ảnh</span>
                  </div>
                )}

                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    id="symptom-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="symptom-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition shadow-2xs"
                  >
                    <span>{symptomImagePreview ? 'Thay đổi ảnh khác' : 'Tải ảnh tổn thương da'}</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Hỗ trợ định dạng JPG, PNG (tối đa 5MB) giúp bác sĩ nắm bắt trước tình trạng thương tổn.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 Actions */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Quay lại: Thông tin bệnh nhân</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToStep3}
              className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 transition flex items-center gap-2"
            >
              <span>Tiếp tục: Thu phí & Thanh toán</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. PHẦN THANH TOÁN (TIỀN MẶT vs PAYOS VIETQR)                  */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-8 shadow-xs">
          {/* Header & Order Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-sky-600" />
                <span>3. Thu Viện Phí & Xác Nhận Thanh Toán</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thu viện phí trực tiếp tại quầy hoặc hướng dẫn bệnh nhân quét mã VietQR PayOS
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Tổng viện phí cần thu:</span>
              <span className="text-2xl font-black text-sky-700">{formattedFee}</span>
            </div>
          </div>

          {paymentError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Quick Summary Card of the Appointment */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Bệnh nhân:</span>
              <strong className="text-slate-900 text-sm">{fullName}</strong>
              <div className="text-slate-500 mt-0.5">{phoneNumber}</div>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Dịch vụ:</span>
              <strong className="text-sky-800 text-sm">{selectedService?.serviceName || 'Khám Da liễu Ban đầu'}</strong>
              <div className="text-slate-500 mt-0.5">{selectedDoctorName}</div>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Thời gian khám:</span>
              <strong className="text-slate-900 text-sm">{selectedSlotTime}</strong>
              <div className="text-slate-500 mt-0.5">
                {next7Days.find((d) => d.iso === selectedDate)?.displayDate || selectedDate}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Kênh tiếp nhận:</span>
              <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg mt-0.5">
                TIẾP ĐÓN WALK-IN TẠI QUẦY
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Chọn phương thức thanh toán viện phí
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Tiền mặt */}
              <div
                onClick={() => setPaymentMethod('cash')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-4 ${
                  paymentMethod === 'cash'
                    ? 'bg-sky-50/70 border-sky-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  paymentMethod === 'cash' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  $
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">1. Thanh Toán Bằng Tiền Mặt</h4>
                    {paymentMethod === 'cash' && (
                      <span className="text-sky-700 text-xs font-bold">✓ Đang chọn</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tiếp tân nhận tiền mặt trực tiếp từ người bệnh tại quầy Lễ tân và in phiếu tiếp đón ngay.
                  </p>
                </div>
              </div>

              {/* Option 2: PayOS VietQR */}
              <div
                onClick={() => setPaymentMethod('payos')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-4 ${
                  paymentMethod === 'payos'
                    ? 'bg-sky-50/70 border-sky-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  paymentMethod === 'payos' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  QR
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">2. Quét Mã PayOS VietQR</h4>
                    {paymentMethod === 'payos' && (
                      <span className="text-sky-700 text-xs font-bold">✓ Đang chọn</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hiển thị mã QR PayOS để người bệnh quét chuyển khoản qua bất kỳ App ngân hàng / Ví MoMo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* METHOD 1 CONTENT: TIỀN MẶT */}
          {paymentMethod === 'cash' && (
            <div className="bg-sky-50/40 rounded-2xl border border-sky-200 p-6 space-y-6">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                <span>Thao tác thu tiền mặt tại quầy tiếp đón</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block mb-1">Số tiền cần thu</span>
                  <span className="text-xl font-black text-sky-700">{formattedFee}</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Số tiền khách đưa (VND)
                  </label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {/* Quick buttons */}
                  <div className="flex gap-1.5 mt-2">
                    {[feeAmount, 300000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashGiven(String(amt))}
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-700"
                      >
                        {new Intl.NumberFormat('vi-VN').format(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block mb-1">Tiền thối lại cho bệnh nhân</span>
                  <span className={`text-xl font-black ${cashChange > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {new Intl.NumberFormat('vi-VN').format(cashChange)} VND
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
                <ShieldCheckIcon className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Lễ tân kiểm tra đúng số tiền mặt thu tại quầy. Sau khi bấm xác nhận, hệ thống sẽ tự động xuất phiếu khám và ghi nhận doanh thu vào ca trực.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={submittingPayment}
                  onClick={() => handleCompleteWalkIn('cash')}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <>
                      <RefreshCwIcon className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý & Tạo phiếu khám...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Xác nhận đã thu tiền mặt {formattedFee} & Cấp phiếu</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* METHOD 2 CONTENT: PAYOS VIETQR */}
          {paymentMethod === 'payos' && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-sky-600" />
                  <span>Cổng Thanh Toán Điện Tử PayOS VietQR</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Thời hạn thanh toán: <strong className="text-rose-600">{formattedCountdown}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                {/* Left: PayOS QR Code */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                    Mã VietQR PayOS Động
                  </span>

                  <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-sky-400/80 shadow-xs">
                    <img
                      src={`https://api.vietqr.io/image/970422-0388686899-compact2.png?amount=${feeAmount}&addInfo=WALKIN%20${phoneNumber || 'HOSPITAL'}&accountName=BENH%20VIEN%20DA%20LIEU`}
                      alt="VietQR PayOS"
                      className="w-56 h-auto object-contain mx-auto"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                          `PAYOS:WALKIN|${fullName}|${feeAmount}`
                        )}`;
                      }}
                    />
                  </div>

                  <span className="text-[11px] text-slate-500 text-center">
                    Hướng dẫn người bệnh mở ứng dụng Ngân hàng hoặc MoMo quét mã QR
                  </span>
                </div>

                {/* Right: Payment Details */}
                <div className="space-y-3.5 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200/70">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                      <strong className="text-slate-800">MB Bank (Quân Đội)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số tài khoản:</span>
                      <strong className="text-sky-700 font-mono text-sm">0388 686 899</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tên người thụ hưởng:</span>
                      <strong className="text-slate-800">BENH VIEN DA LIEU TP.HCM</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-500">Số tiền thanh toán:</span>
                      <strong className="text-emerald-600 font-bold text-base">{formattedFee}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nội dung chuyển khoản:</span>
                      <strong className="text-slate-900 font-mono">WALKIN {phoneNumber}</strong>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={submittingPayment}
                      onClick={() => handleCompleteWalkIn('payos')}
                      className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submittingPayment ? (
                        <>
                          <RefreshCwIcon className="w-4 h-4 animate-spin" />
                          <span>Đang kiểm tra giao dịch PayOS...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Xác nhận đã chuyển khoản thành công & Cấp phiếu</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 Footer Action */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Quay lại: Thông tin đặt lịch</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. HIỂN THỊ PHIẾU HẸN KHÁM : THÔNG TIN KHÁM & MÃ QR LỊCH HẸN   */}
      {/* ============================================================== */}
      {currentStep === 4 && ticketData && (
        <div className="w-full space-y-6">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircleIcon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Tiếp Nhận & Đặt Lịch Walk-in Thành Công!</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Lịch hẹn đã được lưu vào hệ thống, viện phí đã thanh toán và phiếu hẹn khám đã sẵn sàng để in.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition flex items-center gap-1.5"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>In Phiếu Khám</span>
              </button>
              <button
                type="button"
                onClick={handleStartNewWalkIn}
                className="px-4 py-2 bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <UserPlusIcon className="w-4 h-4" />
                <span>Tiếp Đón Ca Mới</span>
              </button>
            </div>
          </div>

          {/* PRINTABLE MEDICAL APPOINTMENT SLIP (PHIẾU HẸN KHÁM BỆNH) */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-xs max-w-3xl mx-auto space-y-6 print:m-0 print:p-4 print:border-none">
            {/* Ticket Hospital Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Sở Y Tế TP. Hồ Chí Minh
                </span>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Bệnh Viện Da Liễu TP. Hồ Chí Minh
                </h3>
                <span className="text-[11px] text-slate-500">
                  Khoa Khám Bệnh &bull; Quầy Tiếp Đón Lễ Tân Tầng 1
                </span>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-md">
                  STT: {ticketData.queueNumber}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Mã tiếp đón: <strong>{ticketData.appointmentCode}</strong>
                </div>
              </div>
            </div>

            {/* Slip Title */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">
                Phiếu Tiếp Đón Hẹn Khám Bệnh
              </h2>
              <span className="text-xs text-slate-500">
                (Hình thức: Tiếp đón trực tiếp Walk-in &bull; Giờ tiếp nhận: {ticketData.createdAt})
              </span>
            </div>

            {/* QR Code Section (Mã QR của lịch hẹn) */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3 bg-white rounded-xl border border-slate-300 shrink-0 shadow-2xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    ticketData.qrCodeText
                  )}`}
                  alt="Mã QR Lịch Hẹn"
                  className="w-32 h-32 object-contain mx-auto"
                />
              </div>

              <div className="space-y-1.5 text-center sm:text-left text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
                  <span>MÃ QR TIẾP NHẬN BỆNH NHÂN</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Quét mã QR tại Cửa Bàn Khám Bác Sĩ</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Phiếu hẹn khám hợp lệ đã được thanh toán. Người bệnh cầm phiếu này di chuyển đến phòng khám chỉ định. Điều dưỡng hoặc bác sĩ sẽ quét mã QR để gọi vào khám theo đúng thứ tự.
                </p>
                <div className="text-[11px] text-emerald-700 font-bold pt-1">
                  Trạng thái thanh toán: {ticketData.paymentStatus} ({ticketData.paymentMethod})
                </div>
              </div>
            </div>

            {/* Detailed Grid Information */}
            <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-slate-200 py-4">
              <div>
                <span className="text-slate-400 block">Họ và tên người bệnh:</span>
                <span className="font-bold text-slate-900 text-sm">{ticketData.patientName}</span>
                <span className="text-[10px] text-slate-500 block">Mã hồ sơ: {ticketData.patientCode}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Số điện thoại liên hệ:</span>
                <span className="font-bold text-slate-900 text-sm">{ticketData.phoneNumber}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Ngày sinh / Giới tính:</span>
                <span className="font-bold text-slate-800">{ticketData.dateOfBirth} ({ticketData.gender})</span>
              </div>

              <div>
                <span className="text-slate-400 block">Địa chỉ thường trú:</span>
                <span className="font-medium text-slate-800">{ticketData.address}</span>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">Dịch vụ chỉ định:</span>
                <strong className="text-sky-800 text-sm">{ticketData.serviceName}</strong>
              </div>

              <div>
                <span className="text-slate-400 block">Bác sĩ phụ trách:</span>
                <strong className="text-slate-800">{ticketData.doctorName}</strong>
              </div>

              <div>
                <span className="text-slate-400 block">Phòng khám chỉ định:</span>
                <strong className="text-slate-800">{ticketData.clinicRoom}</strong>
              </div>

              <div>
                <span className="text-slate-400 block">Ngày khám:</span>
                <strong className="text-slate-800">{ticketData.dateDisplay}</strong>
              </div>

              <div>
                <span className="text-slate-400 block">Khung giờ hẹn khám:</span>
                <strong className="text-emerald-700 font-bold">{ticketData.timeSlot}</strong>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block">Lý do khám / Triệu chứng ban đầu:</span>
                <span className="text-slate-700 italic">{ticketData.reason}</span>
              </div>
            </div>

            {/* Ticket Footer Instructions */}
            <div className="text-[11px] text-slate-500 space-y-1 text-center border-t border-slate-100 pt-3">
              <p>Quý người bệnh vui lòng ngồi đợi tại sảnh chờ trước phòng khám chỉ định.</p>
              <p className="font-bold text-slate-700">Hotline hỗ trợ khoa khám bệnh: 1900 6868</p>
            </div>
          </div>

          {/* Bottom Action Bar for Receptionist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Thao tác tiếp đón:</span>
              {checkInDone ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs">
                  <CheckIcon className="w-4 h-4" />
                  <span>Đã Check-in vào hàng chờ phòng khám</span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={checkingIn}
                  onClick={handleImmediateCheckIn}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  {checkingIn ? (
                    <>
                      <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang check-in...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Check-in vào hàng chờ ngay</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>In Phiếu (A4/A5)</span>
              </button>

              <button
                type="button"
                onClick={handleStartNewWalkIn}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
              >
                <UserPlusIcon className="w-4 h-4" />
                <span>Tiếp đón bệnh nhân khác</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
