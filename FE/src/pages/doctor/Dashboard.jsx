import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faClipboardList,
  faNotesMedical,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { useDoctor } from '../../doctor/DoctorLayout';
import {
  activeProblems,
  appointmentsThisWeek,
  appointmentsToday,
  clock,
  formatWhen,
  problemSummary,
} from '../../doctor/data';
import { Badge, PageIntro, Tile } from '../../components/ui';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { profile, patients, appointments } = useDoctor();
  const activePatients = patients.filter((item) => item.status === 'Active');
  const openProblems = patients.reduce((sum, item) => sum + activeProblems(item).length, 0);
  const today = appointmentsToday(appointments);
  const week = appointmentsThisWeek(appointments);

  return (
    <>
      <PageIntro
        title={`Hello, ${profile.shortName}!`}
        text={`Here is your clinic overview at ${profile.clinic}.`}
      />
      <section className="stats" aria-label="Clinic summary">
        <button type="button" className="stat" onClick={() => navigate('/doctor/patients')}>
          <Tile tone="green" icon={faUserGroup} />
          <span className="stat-copy">
            <span className="stat-value">{activePatients.length} in care</span>
            <span className="stat-label">Active patients</span>
          </span>
        </button>
        <button type="button" className="stat" onClick={() => navigate('/doctor/appointments')}>
          <Tile tone="blue" icon={faCalendarDays} />
          <span className="stat-copy">
            <span className="stat-value">{today.length} scheduled</span>
            <span className="stat-label">Today’s visits</span>
          </span>
        </button>
        <button type="button" className="stat" onClick={() => navigate('/doctor/patients')}>
          <Tile tone="orange" icon={faNotesMedical} />
          <span className="stat-copy">
            <span className="stat-value">{openProblems} active</span>
            <span className="stat-label">Open problems</span>
          </span>
        </button>
        <button type="button" className="stat" onClick={() => navigate('/doctor/appointments')}>
          <Tile tone="teal" icon={faClipboardList} />
          <span className="stat-copy">
            <span className="stat-value">{week.length} booked</span>
            <span className="stat-label">This week</span>
          </span>
        </button>
      </section>

      <div className="split">
        <section className="card">
          <header className="card-head">
            <h2>Today’s schedule</h2>
            <button type="button" className="linkish" onClick={() => navigate('/doctor/appointments')}>View all</button>
          </header>
          <ul className="row-list">
            {today.length === 0 && <li><p className="empty-note">No visits scheduled today.</p></li>}
            {today.map((item) => (
              <li key={item.id}>
                <button type="button" className="row-item" onClick={() => navigate('/doctor/appointments')}>
                  <Tile small tone="blue" icon={faCalendarDays} />
                  <span className="row-copy">
                    <strong>{item.patientName}</strong>
                    <span>{clock(item.startsAt)} · {item.title}</span>
                  </span>
                  <Badge tone="blue">Active</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <header className="card-head">
            <h2>Patients in care</h2>
            <button type="button" className="linkish" onClick={() => navigate('/doctor/patients')}>View all</button>
          </header>
          <ul className="row-list">
            {activePatients.slice(0, 4).map((item) => (
              <li key={item.id}>
                <button type="button" className="row-item" onClick={() => navigate('/doctor/patients')}>
                  <Tile small tone="green" icon={faUserGroup} />
                  <span className="row-copy">
                    <strong>{item.name}</strong>
                    <span>{problemSummary(item)}</span>
                  </span>
                  <Badge tone="green">Active</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="split">
        <section className="card">
          <header className="card-head">
            <h2>This week</h2>
            <button type="button" className="linkish" onClick={() => navigate('/doctor/appointments')}>View all</button>
          </header>
          <ul className="row-list">
            {week.map((item) => (
              <li key={item.id}>
                <button type="button" className="row-item" onClick={() => navigate('/doctor/appointments')}>
                  <Tile small tone="teal" icon={faCalendarDays} />
                  <span className="row-copy">
                    <strong>{item.patientName}</strong>
                    <span>{formatWhen(item.startsAt)} · {item.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <header className="card-head">
            <h2>Quick actions</h2>
          </header>
          <div className="actions">
            <button type="button" className="action" onClick={() => navigate('/doctor/appointments?action=add')}>
              <Tile small tone="orange" icon={faCalendarDays} /> Add appointment
            </button>
            <button type="button" className="action" onClick={() => navigate('/doctor/patients')}>
              <Tile small tone="green" icon={faUserGroup} /> View patients
            </button>
            <button type="button" className="action" onClick={() => navigate('/doctor/patients')}>
              <Tile small tone="blue" icon={faNotesMedical} /> Review problems
            </button>
            <button type="button" className="action" onClick={() => navigate('/doctor/appointments')}>
              <Tile small tone="teal" icon={faClipboardList} /> Open schedule
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
