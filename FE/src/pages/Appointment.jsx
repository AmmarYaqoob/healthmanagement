import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import { faCalendarDays, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { cancelAppointment, createAppointment, updateAppointment } from '../api';
import { matches } from '../data';
import { useApp } from '../App';
import { Badge, Button, EmptyNote, Field, PageIntro, Tile } from '../components/ui';

const TABS = ['Upcoming', 'Past', 'Cancelled'];

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
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: '',
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    location: '',
    description: '',
  };
}

async function requestNotificationPermission() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;
  try {
    await Notification.requestPermission();
  } catch {
    // The browser declined to show a permission prompt.
  }
}

export default function Appointment() {
  const {
    appointments,
    setAppointments,
    pendingAction,
    clearAction,
    notify,
    refreshAppointmentNotices,
  } = useApp();
  const [tab, setTab] = useState('Upcoming');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);
  const [seenAction, setSeenAction] = useState(null);

  if (pendingAction !== seenAction) {
    setSeenAction(pendingAction);
    if (pendingAction === 'add') {
      setEditing(null);
      setForm(blankForm());
      setError('');
    }
  }

  useEffect(() => {
    if (pendingAction === 'add') {
      titleRef.current?.focus();
      clearAction();
    }
  }, [pendingAction, clearAction]);

  const shown = appointments.filter((item) => {
    if (item.status !== tab) return false;
    return matches(query, item.title, item.location, item.description, item.when);
  });

  const setStartTime = (startTime) => {
    setForm((current) => {
      const next = { ...current, startTime };
      const start = new Date(`${current.date}T${startTime}`);
      const end = new Date(`${current.date}T${current.endTime}`);
      if (!Number.isNaN(start.getTime()) && (Number.isNaN(end.getTime()) || end <= start)) {
        next.endTime = toTimeInput(new Date(start.getTime() + 60 * 60 * 1000));
      }
      return next;
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(blankForm());
    setError('');
  };

  const openEdit = (item) => {
    setEditing(item);
    setError('');
    setForm({
      title: item.title,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      description: item.description,
    });
    document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
    titleRef.current?.focus();
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Add a title for this appointment.');
      return;
    }
    if (!form.date || !form.startTime || !form.endTime) {
      setError('Enter a date, start time, and end time.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = editing
        ? await updateAppointment(editing.id, form)
        : await createAppointment(form);
      setAppointments((current) => {
        const next = editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved];
        return next.sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
      });
      requestNotificationPermission();
      resetForm();
      setTab(saved.status);
      notify(`${saved.title} saved. You’ll be notified 1 hour before it starts.`);
      requestNotificationPermission().then(() => refreshAppointmentNotices());
    } catch (err) {
      setError(err.message);
      notify(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (item) => {
    try {
      const saved = await cancelAppointment(item.id);
      setAppointments((current) => current.map((entry) => (entry.id === saved.id ? saved : entry)));
      if (editing?.id === item.id) resetForm();
      notify(`${saved.title} cancelled`);
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <>
      <PageIntro
        title="Appointments"
        text="Add an upcoming visit the same way you add an event in a calendar. HealthPassport notifies you 1 hour before it starts."
      />

      <section className="card form-card">
        <header className="card-head">
          <h2>{editing ? 'Edit appointment' : 'New appointment'}</h2>
        </header>
        <form className="form-grid" onSubmit={save}>
          <div className="span-2">
            <Field label="Title">
              <input
                ref={titleRef}
                className="input"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Add title"
              />
            </Field>
          </div>
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
              placeholder="Clinic, room, or address"
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
            <Field label="Description">
              <textarea
                className="input"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Notes, what to bring, or who you’re seeing"
              />
            </Field>
          </div>
        </form>
        <p className="form-note">
          <FontAwesomeIcon icon={faBell} />
          Notification
          <span>1 hour before</span>
        </p>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          {editing && <Button variant="ghost" onClick={resetForm}>Cancel edit</Button>}
          <Button onClick={save} disabled={saving}>{editing ? 'Save changes' : 'Save appointment'}</Button>
        </div>
      </section>

      <section className="card flat">
        <div className="toolbar">
          <div className="chips" role="tablist" aria-label="Appointment status">
            {TABS.map((item) => (
              <button
                type="button"
                key={item}
                role="tab"
                aria-selected={tab === item}
                className={tab === item ? 'chip active' : 'chip'}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="mini-search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span className="sr-only">Search appointments</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search appointments..." />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Appointment</th>
                <th>When</th>
                <th>Location</th>
                <th>Status</th>
                <th className="col-action"> </th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan="5"><EmptyNote>No {tab.toLowerCase()} appointments.</EmptyNote></td>
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
                  <td>{item.when}</td>
                  <td>{item.location || '—'}</td>
                  <td>
                    <Badge tone={item.status === 'Upcoming' ? 'blue' : item.status === 'Cancelled' ? 'orange' : 'gray'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="col-action">
                    {item.status !== 'Cancelled' && (
                      <button type="button" className="linkish" onClick={() => openEdit(item)}>Edit</button>
                    )}
                    {item.status === 'Upcoming' && (
                      <button type="button" className="linkish danger" onClick={() => cancel(item)}>Cancel</button>
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
