import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { matches } from '../../data';
import { useDoctor } from '../../doctor/DoctorLayout';
import { formatRange } from '../../doctor/data';
import { Badge, Button, EmptyNote, Field, PageIntro, Tile } from '../../components/ui';

const TABS = [
  { id: 'Upcoming', label: 'Active' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Cancelled', label: 'Cancelled' },
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInput(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function blankForm() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    patientId: '',
    title: '',
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    location: '',
    description: '',
  };
}

export default function DoctorAppointments() {
  const { patients, appointments, addAppointment, setAppointmentStatus, notify } = useDoctor();
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingAction = searchParams.get('action');
  const [tab, setTab] = useState('Upcoming');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');
  const [seenAction, setSeenAction] = useState(null);
  const patientRef = useRef(null);

  if (pendingAction !== seenAction) {
    setSeenAction(pendingAction);
    if (pendingAction === 'add') {
      setForm(blankForm());
      setError('');
      setTab('Upcoming');
    }
  }

  useEffect(() => {
    if (pendingAction !== 'add') return;
    patientRef.current?.focus();
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('action');
      return next;
    }, { replace: true });
  }, [pendingAction, setSearchParams]);

  const shown = appointments.filter((item) => {
    if (item.status !== tab) return false;
    return matches(query, item.title, item.patientName, item.location, item.description);
  });

  const setStartTime = (startTime) => {
    setForm((current) => {
      const next = { ...current, startTime };
      const start = new Date(`${current.date}T${startTime}`);
      const end = new Date(`${current.date}T${current.endTime}`);
      if (!Number.isNaN(start.getTime()) && (Number.isNaN(end.getTime()) || end <= start)) {
        next.endTime = toTimeInput(new Date(start.getTime() + 30 * 60 * 1000));
      }
      return next;
    });
  };

  const save = (event) => {
    event.preventDefault();
    if (!form.patientId) {
      setError('Choose a patient.');
      return;
    }
    if (!form.title.trim()) {
      setError('Add a reason for this visit.');
      return;
    }
    if (!form.date || !form.startTime || !form.endTime) {
      setError('Enter a date, start time, and end time.');
      return;
    }
    const start = new Date(`${form.date}T${form.startTime}`);
    const end = new Date(`${form.date}T${form.endTime}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError('End time has to be after the start time.');
      return;
    }
    const saved = addAppointment(form);
    setForm(blankForm());
    setError('');
    setTab('Upcoming');
    notify(`${saved.title} added for ${saved.patientName}`);
  };

  const updateStatus = (item, status) => {
    setAppointmentStatus(item.id, status);
    notify(status === 'Completed' ? `${item.title} marked complete` : `${item.title} cancelled`);
  };

  return (
    <>
      <PageIntro
        title="Appointments"
        text="Active visits on your list. Add a new appointment for a patient in your care."
      />

      <section className="card form-card">
        <header className="card-head">
          <h2>New appointment</h2>
        </header>
        <form className="form-grid" onSubmit={save}>
          <Field label="Patient">
            <select
              ref={patientRef}
              className="input"
              value={form.patientId}
              onChange={(event) => setForm({ ...form, patientId: event.target.value })}
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Reason">
            <input
              className="input"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Follow-up, review, or new visit"
            />
          </Field>
          <Field label="Date">
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              required
            />
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              placeholder="Room or clinic"
            />
          </Field>
          <Field label="Start time">
            <input
              className="input"
              type="time"
              value={form.startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
            />
          </Field>
          <Field label="End time">
            <input
              className="input"
              type="time"
              value={form.endTime}
              onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              required
            />
          </Field>
          <div className="span-2">
            <Field label="Notes">
              <textarea
                className="input"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="What you need to cover in this visit"
              />
            </Field>
          </div>
          {error && <p className="form-error span-2">{error}</p>}
          <div className="form-actions span-2">
            <Button type="submit">Save appointment</Button>
          </div>
        </form>
      </section>

      <section className="card flat">
        <div className="toolbar">
          <div className="chips" role="tablist" aria-label="Appointment status">
            {TABS.map((item) => (
              <button
                type="button"
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                className={tab === item.id ? 'chip active' : 'chip'}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="mini-search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span className="sr-only">Search appointments</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search appointments..."
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visit</th>
                <th>Patient</th>
                <th>When</th>
                <th>Location</th>
                <th>Status</th>
                <th className="col-action"> </th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <EmptyNote>No {TABS.find((item) => item.id === tab)?.label.toLowerCase()} appointments.</EmptyNote>
                  </td>
                </tr>
              )}
              {shown.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="name-cell">
                      <Tile small tone="blue" icon={faCalendarDays} />
                      <span>
                        {item.title}
                        {item.description && <small className="cell-note">{item.description}</small>}
                      </span>
                    </div>
                  </td>
                  <td>{item.patientName}</td>
                  <td>{formatRange(item)}</td>
                  <td>{item.location || '—'}</td>
                  <td>
                    <Badge tone={item.status === 'Upcoming' ? 'blue' : item.status === 'Cancelled' ? 'orange' : 'gray'}>
                      {item.status === 'Upcoming' ? 'Active' : item.status}
                    </Badge>
                  </td>
                  <td className="col-action">
                    {item.status === 'Upcoming' && (
                      <>
                        <button type="button" className="linkish" onClick={() => updateStatus(item, 'Completed')}>Complete</button>
                        <button type="button" className="linkish danger" onClick={() => updateStatus(item, 'Cancelled')}>Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
