export function appointmentDateInVietnam(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function errorStatus(error) {
  return error?.status || error?.response?.status;
}

export function errorFields(error) {
  return error?.fieldErrors || error?.response?.data?.fieldErrors || {};
}

export function errorMessage(error) {
  return error?.message || 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
}
