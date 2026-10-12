const timeZone = 'Asia/Ho_Chi_Minh';

export function todayInVietnam() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function dateValue(value) {
  if (!value) return null;
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+07:00` : value,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = dateValue(value);
  return date
    ? new Intl.DateTimeFormat('vi-VN', { timeZone }).format(date)
    : '—';
}

export function formatTime(value) {
  const date = dateValue(value);
  return date
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date)
    : '—';
}

export function formatDateTime(value) {
  const date = dateValue(value);
  return date
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date)
    : '—';
}

export function ageFromDateOfBirth(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const [currentYear, currentMonth, currentDay] = todayInVietnam()
    .split('-')
    .map(Number);
  if (!dateValue(value) || value > todayInVietnam()) return null;
  return (
    currentYear -
    year -
    (currentMonth < month || (currentMonth === month && currentDay < day)
      ? 1
      : 0)
  );
}
