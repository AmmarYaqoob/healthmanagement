import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faCamera,
  faEllipsisVertical,
  faMagnifyingGlass,
  faPenToSquare,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { createVaccine, updateVaccine } from '../api';
import { matches, toInputDate } from '../data';
import { useApp } from '../App';
import { Badge, Button, DetailModal, EmptyNote, ExtractModal, Field, InfoBanner, Modal, PageIntro } from '../components/ui';

const TABS = ['All', 'COVID-19', 'Influenza', 'Tetanus', 'HPV', 'Other'];
const emptyForm = { name: '', date: '2026-09-30', next: '', status: 'Completed', category: 'Other' };

function RowMenu({ onView, onEdit, onDownload }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const toggle = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 6, left: Math.max(8, rect.right - 190) });
    setOpen((value) => !value);
  };

  return (
    <div className="row-menu">
      <button type="button" ref={buttonRef} aria-label="More actions" aria-expanded={open} className="icon-btn" onClick={toggle}>
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>
      {open && createPortal(
        <>
          <button type="button" className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="menu mini-menu" role="menu" style={{ top: coords.top, left: coords.left }}>
            <button type="button" onClick={() => { setOpen(false); onView(); }}>View details</button>
            <button type="button" onClick={() => { setOpen(false); onEdit(); }}>Edit</button>
            <button type="button" onClick={() => { setOpen(false); onDownload(); }}>Download record</button>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

export default function Vaccination() {
  const { vaccines, setVaccines, notify } = useApp();
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const shown = vaccines.filter((item) => {
    if (tab !== 'All' && item.category !== tab) return false;
    return matches(query, item.name, item.status, item.date);
  });

  const addVaccine = async (entry) => {
    try {
      const saved = await createVaccine(entry);
      setVaccines((current) => [saved, ...current]);
      setModal(null);
      setEditing(null);
      setForm(emptyForm);
      notify(`${saved.name} added to vaccination history`);
    } catch (err) {
      setError(err.message);
      notify(err.message);
    }
  };

  const vaccinePayload = () => ({
    name: form.name.trim(),
    category: form.category,
    date: form.date,
    next: form.next.trim() || '—',
    status: form.status,
    tone: form.status === 'Due soon' ? 'orange' : 'green',
  });

  const openEdit = (vax) => {
    setEditing(vax);
    setSelected(null);
    setError('');
    setForm({
      name: vax.name,
      category: vax.category,
      date: toInputDate(vax.date),
      next: vax.next === '—' ? '' : vax.next,
      status: vax.status,
    });
    setModal('add');
  };

  const saveManual = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Enter the vaccine name.');
      return;
    }
    if (!editing) {
      addVaccine(vaccinePayload());
      return;
    }
    try {
      const saved = await updateVaccine(editing.id, vaccinePayload());
      setVaccines((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setModal(null);
      setEditing(null);
      setForm(emptyForm);
      notify(`${saved.name} updated`);
    } catch (err) {
      setError(err.message);
      notify(err.message);
    }
  };

  const influenza = vaccines.find((item) => item.name === 'Influenza');

  return (
    <>
      <PageIntro
        title="Vaccination History"
        text="Manage your vaccination records and get reminders based on verified recommendations."
        actions={(
          <>
            <Button icon={faCamera} onClick={() => setModal('scan')}>Scan certificate</Button>
            <Button variant="ghost" icon={faUpload} onClick={() => setModal('upload')}>Upload document</Button>
            <Button variant="ghost" icon={faPenToSquare} onClick={() => { setEditing(null); setForm(emptyForm); setError(''); setModal('add'); }}>Add manually</Button>
          </>
        )}
      />

      <section className="card flat">
        <div className="toolbar">
          <div className="chips" role="tablist" aria-label="Vaccine type">
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
            <span className="sr-only">Search vaccine</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vaccine..." />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vaccine</th>
                <th>Date</th>
                <th>Next due</th>
                <th>Status</th>
                <th className="col-action"> </th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan="5"><EmptyNote>No vaccines in this view.</EmptyNote></td></tr>
              )}
              {shown.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.date}</td>
                  <td>{item.next}</td>
                  <td><Badge tone={item.tone === 'orange' ? 'orange' : 'green'}>{item.status}</Badge></td>
                  <td className="col-action">
                    <RowMenu
                      onView={() => setSelected(item)}
                      onEdit={() => openEdit(item)}
                      onDownload={() => notify(`Preparing ${item.name} record`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <InfoBanner
        icon={faCalendarDays}
        title="Next reminder"
        text="Influenza vaccination is due in 6 months (Oct 2025)."
        action={<Button onClick={() => influenza && setSelected(influenza)}>View details</Button>}
      />

      {modal === 'add' && (
        <Modal
          title={editing ? 'Edit vaccination' : 'Add vaccination'}
          subtitle={editing ? 'Update the details for this vaccination.' : 'Record a vaccine you received.'}
          onClose={() => { setModal(null); setEditing(null); }}
          footer={(
            <>
              <Button variant="ghost" onClick={() => { setModal(null); setEditing(null); }}>Cancel</Button>
              <Button onClick={saveManual}>{editing ? 'Save changes' : 'Save vaccine'}</Button>
            </>
          )}
        >
          <form className="form-grid" onSubmit={saveManual}>
            <Field label="Vaccine"><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Category">
              <select className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {TABS.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Date"><input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></Field>
            <Field label="Next due"><input className="input" value={form.next} onChange={(event) => setForm({ ...form, next: event.target.value })} placeholder="Oct 2027" /></Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option>Completed</option>
                <option>Up to date</option>
                <option>Due soon</option>
              </select>
            </Field>
          </form>
          {error && <p className="form-error">{error}</p>}
        </Modal>
      )}

      {(modal === 'scan' || modal === 'upload') && (
        <ExtractModal
          title={modal === 'scan' ? 'Scan certificate' : 'Upload vaccination document'}
          hint="We’ll read the certificate and ask you to confirm the record."
          fields={{
            Vaccine: 'Influenza',
            Date: '30 Sep 2026',
            'Next due': 'Sep 2027',
            Status: 'Completed',
          }}
          onClose={() => setModal(null)}
          onConfirm={(values) => addVaccine({
            name: values.Vaccine,
            date: values.Date,
            next: values['Next due'],
            status: values.Status,
            tone: values.Status === 'Due soon' ? 'orange' : 'green',
            category: 'Other',
          })}
        />
      )}

      {selected && (
        <DetailModal
          title={selected.name}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          rows={[
            { label: 'Date', value: selected.date },
            { label: 'Next due', value: selected.next },
            { label: 'Status', value: <Badge tone={selected.tone === 'orange' ? 'orange' : 'green'}>{selected.status}</Badge> },
            { label: 'Category', value: selected.category },
          ]}
        />
      )}
    </>
  );
}
