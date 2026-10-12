import { ageFromDateOfBirth, formatDate } from '../../utils/dateTime.js';

export default function PatientSummary({ patient, compact = false }) {
  const age = ageFromDateOfBirth(patient?.dateOfBirth);
  return (
    <div
      className={`clinical-patient ${compact ? 'clinical-patient--compact' : ''}`}
    >
      <span className="clinical-patient-avatar" aria-hidden="true">
        {patient?.fullName?.split(/\s+/).slice(-1)[0]?.slice(0, 1) || '?'}
      </span>
      <div>
        <span className="clinical-overline">
          {patient?.patientCode || 'Người bệnh'}
        </span>
        <h2>{patient?.fullName || '—'}</h2>
        <p>
          {patient?.dateOfBirth
            ? `Ngày sinh: ${formatDate(patient.dateOfBirth)}${age !== null ? ` · ${age} tuổi` : ''}`
            : 'Chưa có ngày sinh'}
          {!compact && patient?.phone ? ` · ${patient.phone}` : ''}
        </p>
      </div>
    </div>
  );
}
