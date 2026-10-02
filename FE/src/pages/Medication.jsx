import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faMagnifyingGlass,
  faNotesMedical,
  faPills,
  faFileLines,
  faPlus,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { createMedication, updateMedication } from '../api';
import { matches, toInputDate } from '../data';
import { useApp } from '../App';
import { Badge, Button, DetailModal, EmptyNote, ExtractModal, Field, InfoBanner, Modal, PageIntro, Tile } from '../components/ui';

const TABS = ['All', 'Active', 'Past', 'Archived'];
const TONES = ['blue', 'green', 'orange', 'purple', 'red'];

const emptyForm = { name: '', dosage: '', schedule: '', start: '2026-09-30', status: 'Active' };

export default function Medication() {
  const navigate = useNavigate();
  const { medications, setMedications, setAdded, pendingAction, clearAction, notify } = useApp();
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [seenAction, setSeenAction] = useState(null);

  if (pendingAction !== seenAction) {
    setSeenAction(pendingAction);
    if (pendingAction === 'add' || pendingAction === 'scan' || pendingAction === 'upload') {
      setModal(pendingAction);
    }
  }

  useEffect(() => {
    if (pendingAction) clearAction();
  }, [pendingAction, clearAction]);

  const shown = medications.filter((item) => {
    if (tab !== 'All' && item.status !== tab) return false;
    return matches(query, item.name, item.dosage, item.status, item.start);
  });

  const medicationPayload = () => ({
    name: form.name.trim(),
    dosage: form.dosage.trim(),
    schedule: form.schedule.trim() || 'As directed',
    start: form.start,
    status: form.status,
    tone: TONES[medications.length % TONES.length],
  });

  const addMedication = async (entry) => {
    try {
      const saved = await createMedication(entry);
      setMedications((current) => [saved, ...current]);
      if (saved.status === 'Active') setAdded((current) => ({ ...current, meds: current.meds + 1 }));
      setModal(null);
      setEditing(null);
      setForm(emptyForm);
      notify(`${saved.name} added to your medication list`);
    } catch (err) {
      setError(err.message);
      notify(err.message);
    }
  };

  const openEdit = (med) => {
    setEditing(med);
    setSelected(null);
    setError('');
    setForm({
      name: med.name,
      dosage: med.dosage,
      schedule: med.schedule,
      start: toInputDate(med.start),
      status: med.status,
    });
    setModal('add');
  };

  const saveManual = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.dosage.trim()) {
      setError('Enter a medication name and dosage.');
      return;
    }
    if (!editing) {
      addMedication(medicationPayload());
      return;
    }
    try {
      const saved = await updateMedication(editing.id, medicationPayload());
      setMedications((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setModal(null);
      setEditing(null);
      setForm(emptyForm);
      notify(`${saved.name} updated`);
    } catch (err) {
      setError(err.message);
      notify(err.message);
    }
  };

  return (
    <>
      <PageIntro
        title="Medication History"
        text="Manage your medication information. Add manually, scan prescriptions or upload medication plans and pharmacy documents. The system will extract relevant fields and ask you to confirm them."
        actions={(
          <>
            <Button variant="ghost" icon={faFileLines} onClick={() => navigate('/medication/report')}>View report</Button>
            <Button icon={faPlus} onClick={() => { setEditing(null); setForm(emptyForm); setError(''); setModal('add'); }}>Add manually</Button>
            <Button variant="ghost" icon={faCamera} onClick={() => setModal('scan')}>Scan prescription</Button>
            <Button variant="ghost" icon={faUpload} onClick={() => setModal('upload')}>Upload document</Button>
          </>
        )}
      />

      <section className="card flat">
        <div className="toolbar">
          <div className="chips" role="tablist" aria-label="Medication status">
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
            <span className="sr-only">Search medication</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medication..." />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Start date</th>
                <th>Status</th>
                <th className="col-action"> </th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan="5"><EmptyNote>No medications in this view.</EmptyNote></td>
                </tr>
              )}
              {shown.map((med) => (
                <tr key={med.id}>
                  <td>
                    <div className="name-cell">
                      <Tile small tone={med.tone} icon={faPills} />
                      {med.name}
                    </div>
                  </td>
                  <td>{med.dosage}</td>
                  <td>{med.start}</td>
                  <td><Badge tone={med.status === 'Active' ? 'green' : 'gray'}>{med.status}</Badge></td>
                  <td className="col-action">
                    <button type="button" className="linkish" onClick={() => setSelected(med)}>View details</button>
                    <button type="button" className="linkish" onClick={() => openEdit(med)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <InfoBanner
        icon={faNotesMedical}
        title="Scan a prescription or upload a medication plan."
        text="We’ll extract the relevant information and help you confirm it."
        action={<Button onClick={() => setModal('scan')}>Try now</Button>}
      />

      {modal === 'add' && (
        <Modal
          title={editing ? 'Edit medication' : 'Add medication'}
          subtitle={editing ? 'Update the details for this medication.' : 'Enter the details from the label or your care plan.'}
          onClose={() => setModal(null)}
          footer={(
            <>
              <Button variant="ghost" onClick={() => { setModal(null); setEditing(null); }}>Cancel</Button>
              <Button onClick={saveManual}>{editing ? 'Save changes' : 'Save medication'}</Button>
            </>
          )}
        >
          <form className="form-grid" onSubmit={saveManual}>
            <Field label="Medication">
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Dosage">
              <input className="input" value={form.dosage} onChange={(event) => setForm({ ...form, dosage: event.target.value })} placeholder="500 mg" />
            </Field>
            <Field label="Schedule">
              <input className="input" value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} placeholder="1-0-1 (morning & evening)" />
            </Field>
            <Field label="Start date">
              <input className="input" type="date" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} />
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option>Active</option>
                <option>Past</option>
                <option>Archived</option>
              </select>
            </Field>
          </form>
          {error && <p className="form-error">{error}</p>}
        </Modal>
      )}

      {(modal === 'scan' || modal === 'upload') && (
        <ExtractModal
          title={modal === 'scan' ? 'Scan prescription' : 'Upload medication document'}
          hint="Choose a photo or PDF. Confirm the extracted fields before they are saved."
          fields={{
            Name: 'Amoxicillin',
            Dosage: '500 mg',
            Schedule: '1-1-1 (with meals)',
            'Start date': '30 Sep 2026',
          }}
          onClose={() => setModal(null)}
          onConfirm={(values) => addMedication({
            name: values.Name,
            dosage: values.Dosage,
            schedule: values.Schedule,
            start: values['Start date'],
            status: 'Active',
            tone: 'blue',
          })}
        />
      )}

      {selected && (
        <DetailModal
          title={selected.name}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          rows={[
            { label: 'Dosage', value: selected.dosage },
            { label: 'Schedule', value: selected.schedule },
            { label: 'Start date', value: selected.start },
            { label: 'Status', value: <Badge tone={selected.status === 'Active' ? 'green' : 'gray'}>{selected.status}</Badge> },
          ]}
        />
      )}
    </>
  );
}
