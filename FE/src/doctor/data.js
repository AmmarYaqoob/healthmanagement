export const doctorProfile = {
  name: 'Dr. Julia Schneider',
  shortName: 'Dr. Schneider',
  role: 'General Practitioner',
  clinic: 'MVZ Mitte',
};

function stamp(dayOffset, hours, minutes) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
}

export const doctorPatients = [
  {
    id: 'dp1',
    name: 'Anna Miller',
    age: 34,
    status: 'Active',
    lastVisit: '12 Sep 2026',
    problems: [
      { name: 'Type 2 diabetes', status: 'Active' },
      { name: 'Vitamin D deficiency', status: 'Active' },
    ],
  },
  {
    id: 'dp2',
    name: 'Lukas Berger',
    age: 58,
    status: 'Active',
    lastVisit: '02 Sep 2026',
    problems: [
      { name: 'Hypertension', status: 'Active' },
    ],
  },
  {
    id: 'dp3',
    name: 'Sofia Keller',
    age: 27,
    status: 'Active',
    lastVisit: '28 Aug 2026',
    problems: [
      { name: 'Migraine', status: 'Active' },
    ],
  },
  {
    id: 'dp4',
    name: 'Thomas Weber',
    age: 46,
    status: 'Active',
    lastVisit: '18 Aug 2026',
    problems: [
      { name: 'Lumbar strain', status: 'Active' },
      { name: 'Sciatica', status: 'Resolved' },
    ],
  },
  {
    id: 'dp5',
    name: 'Jonas Krüger',
    age: 19,
    status: 'Active',
    lastVisit: '22 Sep 2026',
    problems: [
      { name: 'Asthma', status: 'Active' },
    ],
  },
  {
    id: 'dp6',
    name: 'Henrik Vogel',
    age: 51,
    status: 'Active',
    lastVisit: '28 Sep 2026',
    problems: [
      { name: 'High cholesterol', status: 'Active' },
    ],
  },
  {
    id: 'dp7',
    name: 'Elena Novak',
    age: 62,
    status: 'Inactive',
    lastVisit: '11 Jan 2026',
    problems: [
      { name: 'Post-operative wound', status: 'Resolved' },
    ],
  },
  {
    id: 'dp8',
    name: 'Mara Hoffmann',
    age: 41,
    status: 'Inactive',
    lastVisit: '04 Dec 2025',
    problems: [
      { name: 'Anxiety', status: 'Resolved' },
    ],
  },
];

export const doctorAppointments = [
  {
    id: 'da1',
    patientId: 'dp1',
    patientName: 'Anna Miller',
    title: 'Diabetes review',
    startsAt: stamp(0, 9, 30),
    endsAt: stamp(0, 10, 0),
    location: 'Room 2',
    description: 'Review glucose log and metformin dose.',
    status: 'Upcoming',
  },
  {
    id: 'da2',
    patientId: 'dp2',
    patientName: 'Lukas Berger',
    title: 'Blood pressure check',
    startsAt: stamp(0, 10, 15),
    endsAt: stamp(0, 10, 45),
    location: 'Room 2',
    description: 'Home readings look high this week.',
    status: 'Upcoming',
  },
  {
    id: 'da3',
    patientId: 'dp3',
    patientName: 'Sofia Keller',
    title: 'Migraine follow-up',
    startsAt: stamp(0, 11, 0),
    endsAt: stamp(0, 11, 30),
    location: 'Room 1',
    description: 'Check attack frequency since the last visit.',
    status: 'Upcoming',
  },
  {
    id: 'da4',
    patientId: 'dp4',
    patientName: 'Thomas Weber',
    title: 'Back pain review',
    startsAt: stamp(2, 14, 0),
    endsAt: stamp(2, 14, 30),
    location: 'Room 1',
    description: 'Review physiotherapy progress.',
    status: 'Upcoming',
  },
  {
    id: 'da5',
    patientId: 'dp5',
    patientName: 'Jonas Krüger',
    title: 'Asthma check',
    startsAt: stamp(5, 9, 0),
    endsAt: stamp(5, 9, 30),
    location: 'Room 3',
    description: 'Inhaler technique and peak flow.',
    status: 'Upcoming',
  },
  {
    id: 'da6',
    patientId: 'dp6',
    patientName: 'Henrik Vogel',
    title: 'Lipid review',
    startsAt: stamp(-3, 15, 0),
    endsAt: stamp(-3, 15, 30),
    location: 'Room 2',
    description: 'Discuss the latest cholesterol result.',
    status: 'Completed',
  },
  {
    id: 'da7',
    patientId: 'dp8',
    patientName: 'Mara Hoffmann',
    title: 'Therapy review',
    startsAt: stamp(-1, 16, 0),
    endsAt: stamp(-1, 16, 30),
    location: 'Room 1',
    description: 'Patient asked to reschedule.',
    status: 'Cancelled',
  },
].sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));

export function activeProblems(patient) {
  return patient.problems.filter((problem) => problem.status === 'Active');
}

export function problemSummary(patient) {
  const active = activeProblems(patient);
  const list = active.length ? active : patient.problems;
  return list.map((problem) => problem.name).join(', ');
}

export function sameDay(iso, now = new Date()) {
  const date = new Date(iso);
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

export function appointmentsToday(list, now = new Date()) {
  return list.filter((item) => item.status === 'Upcoming' && sameDay(item.startsAt, now));
}

export function appointmentsThisWeek(list, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return list.filter((item) => {
    if (item.status !== 'Upcoming') return false;
    const when = new Date(item.startsAt);
    return when >= start && when < end;
  });
}

export function formatWhen(iso) {
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

export function formatRange(item) {
  const start = new Date(item.startsAt);
  const end = new Date(item.endsAt);
  const day = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const from = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const to = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${from}–${to}`;
}

export function clock(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
