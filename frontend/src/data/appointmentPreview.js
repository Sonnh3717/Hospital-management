// Local fixtures only. These identifiers do not represent database records.
export const doctors = [
  {
    id: 'preview-doctor-1',
    name: 'BS. Nguyễn Minh Anh',
    specialization: 'Nội tổng quát',
  },
  {
    id: 'preview-doctor-2',
    name: 'BS. Trần Hoàng Nam',
    specialization: 'Nội tổng quát',
  },
  { id: 'preview-doctor-3', name: 'BS. Lê Thu Hà', specialization: 'Tim mạch' },
  {
    id: 'preview-doctor-4',
    name: 'BS. Phạm Ngọc Mai',
    specialization: 'Nhi khoa',
  },
  {
    id: 'preview-doctor-5',
    name: 'BS. Vũ Thanh Bình',
    specialization: 'Da liễu',
  },
];

export const specialties = [
  ...new Set(doctors.map((doctor) => doctor.specialization)),
];

export function getVietnamDate() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getBookingDays() {
  const today = new Date(`${getVietnamDate()}T00:00:00+07:00`);
  return [1, 2, 3].map((offset) => {
    const date = new Date(today.getTime() + offset * 86400000);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const part = (type) => parts.find((item) => item.type === type).value;
    return {
      value: `${part('year')}-${part('month')}-${part('day')}`,
      label: `${part('day')}/${part('month')}`,
      weekday: new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        weekday: 'short',
      }).format(date),
    };
  });
}

export function formatAppointmentDate(value) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00+07:00`));
}

export function getPreviewSlots(doctorId, date) {
  if (!doctors.some((doctor) => doctor.id === doctorId) || !date) return [];
  return ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'].map(
    (time, index) => ({
      id: `preview-slot:${doctorId}:${date}:${time}`,
      time,
      available: index !== 3,
    }),
  );
}
