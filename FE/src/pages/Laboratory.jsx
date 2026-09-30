import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileMedical, faMagnifyingGlass, faPenToSquare, faUpload } from '@fortawesome/free-solid-svg-icons';
import { createLab, updateLab } from '../api';
import { matches, toInputDate } from '../data';
import { useApp } from '../App';
import { Button, EmptyNote, ExtractModal, Field, InfoBanner, Modal, PageIntro } from '../components/ui';

const TABS = ['All', 'Blood', 'Urine', 'Other'];
const emptyForm = {
  test: '',
  result: '',
  unit: '',
  range: '',
  date: '2026-09-30',
  source: '',
  category: 'Blood',
};

export default function Laboratory() {
  const { labs, setLabs, setAdded, notify } = useApp();
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const shown = labs.filter((item) => {
    if (tab !== 'All' && item.category !== tab) return false;
    return matches(query, item.test, item.result, item.source, item.date);
  });

  const addLab = async (entry) => {
    try {
      const saved = await createLab(entry);
      setLabs((current) => [saved, ...current]);
      setAdded((current) => ({ ...current, labs: current.labs + 1 }));
      setModal(null);
      setEditing(null);
      setForm(emptyForm);
      notify(`${saved.test} saved to laboratory history`);
    } catch (err) {
      setError(err.message);
      notify(err.message);
    }
  };

  const labPayload = () => ({
    test: form.test.trim(),
    result: form.result.trim(),
    unit: form.unit.trim() || '—',
    range: form.range.trim() || '—',
    date: form.date,
    source: form.source.trim() || 'Entered manually',
    category: form.category,
  });

  const openEdit = (lab) => {
    setEditing(lab);
    setError('');
    setForm({
      test: lab.test,
      result: lab.result,
      unit: lab.unit === '—' ? '' : lab.unit,
      range: lab.range === '—' ? '' : lab.range,
      date: toInputDate(lab.date),
      source: lab.source,
      category: lab.category,
    });
    setModal('manual');
  };

  const saveManual = async (event) => {
    event.preventDefault();
    if (!form.test.trim() || !form.result.trim()) {
      setError('Enter the test name and result.');
      return;
    }
    if (!editing) {
      addLab(labPayload());
      return;
    }
    try {
      const saved = await updateLab(editing.id, labPayload());
      setLabs((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setModal(null);
      setEditing(null);
      setForm(emptyForm);
      notify(`${saved.test} updated`);
    } catch (err) {
      setError(err.message);
      notify(err.message);
    }
  };

  return (
    <>
      <PageIntro
        title="Laboratory History"
        text="View and manage your laboratory results. Upload reports, enter results manually and keep track of test dates, units, reference ranges and laboratory sources."
        actions={(
          <>
            <Button icon={faUpload} onClick={() => setModal('upload')}>Upload report</Button>
            <Button variant="ghost" icon={faPenToSquare} onClick={() => { setEditing(null); setForm(emptyForm); setError(''); setModal('manual'); }}>Enter manually</Button>
          </>
        )}
      />

      <section className="card flat">
        <div className="toolbar">
          <div className="chips" role="tablist" aria-label="Result type">
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
            <span className="sr-only">Search test or result</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search test or result..." />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference range</th>
                <th>Date</th>
                <th>Source</th>
                <th className="col-action"> </th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan="7"><EmptyNote>No results in this category.</EmptyNote></td>
                </tr>
              )}
              {shown.map((lab) => (
                <tr key={lab.id}>
                  <td><strong>{lab.test}</strong></td>
                  <td>{lab.result}</td>
                  <td>{lab.unit}</td>
                  <td>{lab.range}</td>
                  <td>{lab.date}</td>
                  <td>{lab.source}</td>
                  <td className="col-action">
                    <button type="button" className="linkish" onClick={() => openEdit(lab)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <InfoBanner
        icon={faFileMedical}
        title="Keep your lab reports organized."
        text="Upload PDFs or images and we’ll extract the key information."
        action={<Button onClick={() => setModal('upload')}>Upload now</Button>}
      />

      {modal === 'upload' && (
        <ExtractModal
          title="Upload report"
          hint="Upload a PDF or image. Review the extracted values before saving."
          fields={{
            Test: 'Hemoglobin',
            Result: '13.8',
            Unit: 'g/dL',
            'Reference range': '12.0 - 16.0',
            Date: '30 Sep 2026',
            Source: 'Lab Berlin',
          }}
          onClose={() => setModal(null)}
          onConfirm={(values) => addLab({
            test: values.Test,
            result: values.Result,
            unit: values.Unit,
            range: values['Reference range'],
            date: values.Date,
            source: values.Source,
            category: 'Blood',
          })}
        />
      )}

      {modal === 'manual' && (
        <Modal
          title={editing ? 'Edit result' : 'Enter result manually'}
          subtitle={editing ? 'Update this laboratory value.' : 'Add a single laboratory value to your history.'}
          onClose={() => setModal(null)}
          footer={(
            <>
              <Button variant="ghost" onClick={() => { setModal(null); setEditing(null); }}>Cancel</Button>
              <Button onClick={saveManual}>{editing ? 'Save changes' : 'Save result'}</Button>
            </>
          )}
        >
          <form className="form-grid" onSubmit={saveManual}>
            <Field label="Test"><input className="input" value={form.test} onChange={(event) => setForm({ ...form, test: event.target.value })} /></Field>
            <Field label="Result"><input className="input" value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })} /></Field>
            <Field label="Unit"><input className="input" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="g/dL" /></Field>
            <Field label="Reference range"><input className="input" value={form.range} onChange={(event) => setForm({ ...form, range: event.target.value })} placeholder="12.0 - 16.0" /></Field>
            <Field label="Date"><input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></Field>
            <Field label="Source"><input className="input" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="Lab Berlin" /></Field>
            <Field label="Category">
              <select className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option>Blood</option>
                <option>Urine</option>
                <option>Other</option>
              </select>
            </Field>
          </form>
          {error && <p className="form-error">{error}</p>}
        </Modal>
      )}
    </>
  );
}
