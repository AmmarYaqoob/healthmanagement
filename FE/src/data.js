const MONTHS = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Sept: '09', Oct: '10', Nov: '11', Dec: '12',
};

export function toInputDate(value) {
  if (!value || value === '—') return '';
  const text = String(value).replace(/[\u00a0\u202f]/g, ' ').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/^(\d{1,2}) ([A-Za-z]{3,4}) (\d{4})$/);
  if (!match || !MONTHS[match[2]]) return '';
  return `${match[3]}-${MONTHS[match[2]]}-${match[1].padStart(2, '0')}`;
}

export function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function matches(query, ...parts) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts.join(' ').toLowerCase().includes(needle);
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export const APPOINTMENT_NOTICE_MS = 60 * 60 * 1000;

export function appointmentInNoticeWindow(item, now = Date.now()) {
  if (!item || item.status !== 'Upcoming') return false;
  const start = new Date(item.startsAt).getTime();
  const end = new Date(item.endsAt).getTime();
  if (Number.isNaN(start)) return false;
  const until = Number.isNaN(end) ? start : end;
  return now >= start - APPOINTMENT_NOTICE_MS && now <= until;
}

export function appointmentNoticeDue(item, now = Date.now()) {
  return Boolean(item) && !item.notifiedAt && appointmentInNoticeWindow(item, now);
}

export function appointmentLead(startsAt, now = Date.now()) {
  const mins = Math.max(0, Math.round((new Date(startsAt).getTime() - now) / 60000));
  if (mins <= 1) return 'starting now';
  if (mins >= 60) return 'in 1 hour';
  return `in ${mins} minutes`;
}

export const reminders = [
  { id: 'r1', title: 'Blood test (fasting)', date: '15 Apr 2025', tone: 'red', icon: 'vial' },
  { id: 'r2', title: 'Vaccination - Influenza', date: '20 Jun 2025', tone: 'teal', icon: 'syringe' },
  { id: 'r3', title: 'Medication refill - Atorvastatin', date: '28 Apr 2025', tone: 'blue', icon: 'pills' },
];

export const recentDocuments = [
  { id: 'rd1', title: 'Lab Report - Blood Count', date: '17 Apr 2025', tone: 'red', icon: 'pdf' },
  { id: 'rd2', title: 'Prescription - Amoxicillin', date: '15 Apr 2025', tone: 'blue', icon: 'file' },
  { id: 'rd3', title: 'Radiology Report - Chest X-ray', date: '05 Apr 2025', tone: 'purple', icon: 'image' },
  { id: 'rd4', title: 'Vaccination certificate - COVID-19', date: '28 Mar 2025', tone: 'green', icon: 'syringe' },
];

export const medications = [
  {
    id: 'm1',
    name: 'Metformin',
    dosage: '500 mg',
    schedule: '1-0-1 (morning & evening)',
    start: '01 Jan 2024',
    status: 'Active',
    tone: 'blue',
  },
  {
    id: 'm2',
    name: 'Lisinopril',
    dosage: '10 mg',
    schedule: '1-0-0 (morning)',
    start: '15 Feb 2024',
    status: 'Active',
    tone: 'green',
  },
  {
    id: 'm3',
    name: 'Atorvastatin',
    dosage: '20 mg',
    schedule: '0-0-1 (evening)',
    start: '10 Mar 2024',
    status: 'Active',
    tone: 'orange',
  },
  {
    id: 'm4',
    name: 'Omeprazole',
    dosage: '20 mg',
    schedule: '1-0-0 (morning)',
    start: '01 Nov 2023',
    status: 'Past',
    tone: 'purple',
  },
  {
    id: 'm5',
    name: 'Ibuprofen',
    dosage: '400 mg',
    schedule: '1-0-1 (as needed)',
    start: '12 Aug 2023',
    status: 'Past',
    tone: 'red',
  },
];

export const labs = [
  { id: 'l1', test: 'Hemoglobin', result: '13.8', unit: 'g/dL', range: '12.0 - 16.0', date: '12 Apr 2025', source: 'Lab Berlin', category: 'Blood' },
  { id: 'l2', test: 'White Blood Cells', result: '6.2', unit: '10⁹/L', range: '4.0 - 10.0', date: '12 Apr 2025', source: 'Lab Berlin', category: 'Blood' },
  { id: 'l3', test: 'CRP', result: '2.3', unit: 'mg/L', range: '< 5.0', date: '10 Mar 2025', source: 'MVZ Mitte', category: 'Blood' },
  { id: 'l4', test: 'Vitamin D (25-OH)', result: '28.5', unit: 'ng/mL', range: '30.0 - 100.0', date: '10 Mar 2025', source: 'Lab Berlin', category: 'Blood' },
  { id: 'l5', test: 'Cholesterol (total)', result: '198', unit: 'mg/dL', range: '< 200', date: '05 Feb 2025', source: 'MVZ Mitte', category: 'Blood' },
];

export const vaccines = [
  { id: 'v1', name: 'COVID-19 (Booster)', date: '15 Mar 2021', next: '—', status: 'Completed', tone: 'green', category: 'COVID-19' },
  { id: 'v2', name: 'Influenza', date: '22 Oct 2024', next: 'Oct 2025', status: 'Due soon', tone: 'orange', category: 'Influenza' },
  { id: 'v3', name: 'Tetanus', date: '12 Jan 2019', next: 'Jan 2029', status: 'Up to date', tone: 'green', category: 'Tetanus' },
  { id: 'v4', name: 'Hepatitis B', date: '10 Sep 2018', next: '—', status: 'Completed', tone: 'green', category: 'Other' },
  { id: 'v5', name: 'HPV', date: '05 Sep 2015', next: '—', status: 'Completed', tone: 'green', category: 'HPV' },
];

export const folderSeed = [
  { id: 'all', name: 'All documents', tone: 'blue', icon: 'folder', base: 12 },
  { id: 'laboratory', name: 'Laboratory reports', tone: 'red', icon: 'flask', base: 4 },
  { id: 'radiology', name: 'Radiology reports', tone: 'purple', icon: 'image', base: 2 },
  { id: 'prescriptions', name: 'Prescriptions', tone: 'red', icon: 'file', base: 3 },
  { id: 'letters', name: 'Medical letters', tone: 'blue', icon: 'file', base: 2 },
  { id: 'discharge', name: 'Discharge summaries', tone: 'teal', icon: 'file', base: 1 },
  { id: 'other', name: 'Other', tone: 'gray', icon: 'folder', base: 0 },
];

export const documents = [
  { id: 'f1', name: 'Blood test report.pdf', type: 'Lab report', date: '12 Apr 2025', folder: 'laboratory', tone: 'red', icon: 'pdf' },
  { id: 'f2', name: 'Chest X-ray.jpg', type: 'Radiology', date: '05 Apr 2025', folder: 'radiology', tone: 'blue', icon: 'image' },
  { id: 'f3', name: 'Prescription - Amoxicillin.pdf', type: 'Prescription', date: '15 Apr 2025', folder: 'prescriptions', tone: 'red', icon: 'pdf' },
  { id: 'f4', name: 'Discharge summary.pdf', type: 'Medical letter', date: '20 Feb 2025', folder: 'discharge', tone: 'blue', icon: 'file' },
  { id: 'f5', name: 'Vaccination certificate.pdf', type: 'Vaccination', date: '28 Mar 2025', folder: 'vaccination', tone: 'green', icon: 'file' },
  { id: 'f6', name: 'MRI report.pdf', type: 'Radiology', date: '10 Jan 2025', folder: 'radiology', tone: 'purple', icon: 'pdf' },
];

export const shares = [
  { id: 's1', name: 'Dr. Julia Schneider', role: 'General Practitioner', until: '14 Apr 2025', tone: 'blue' },
  { id: 's2', name: 'Klinikum Berlin', role: 'Hospital · Specialist', until: '30 Apr 2025', tone: 'teal' },
];

export const directory = [
  { name: 'Dr. Julia Schneider', role: 'General Practitioner' },
  { name: 'Dr. Markus Weber', role: 'Cardiologist' },
  { name: 'Klinikum Berlin', role: 'Hospital · Specialist' },
  { name: 'Dr. Lena Vogel', role: 'Dermatologist' },
  { name: 'MVZ Mitte', role: 'Laboratory' },
];

export const pageMeta = {
  dashboard: 'Dashboard',
  medication: 'Medication History',
  laboratory: 'Laboratory History',
  vaccination: 'Vaccination History',
  documents: 'Medical Document Storage',
  sharing: 'Sharing',
  appointment: 'Appointments',
  settings: 'Settings',
  admin: 'Admin',
};
