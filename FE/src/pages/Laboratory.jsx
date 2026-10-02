import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileMedical, faMagnifyingGlass, faPenToSquare, faUpload } from '@fortawesome/free-solid-svg-icons';
import { createLab, extractLabReport, updateLab } from '../api';
import { matches, toInputDate } from '../data';
import { useApp } from '../App';
import { Button, EmptyNote, Field, InfoBanner, Modal, PageIntro } from '../components/ui';

const TABS = ['All', 'Blood', 'Urine', 'Other'];
const CATEGORY_LABEL = { blood: 'Blood', urine: 'Urine', other: 'Other' };
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
  const [fileName, setFileName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [savingUpload, setSavingUpload] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [draft, setDraft] = useState(null);

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

  const closeUpload = () => {
    setModal(null);
    setDraft(null);
    setFileName('');
    setUploadError('');
    setExtracting(false);
  };

  const openUpload = () => {
    setDraft(null);
    setFileName('');
    setUploadError('');
    setExtracting(false);
    setModal('upload');
  };

  const onReport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileName('');
      setDraft(null);
      setUploadError('Choose a PDF.');
      return;
    }

    setFileName(file.name);
    setDraft(null);
    setUploadError('');
    setExtracting(true);
    try {
      const report = await extractLabReport(file);
      setDraft({
        source: report.source || '',
        date: report.collectedAt || '',
        rows: (report.rows || []).map((row, index) => ({
          key: `${row.test}-${index}`,
          keep: true,
          test: row.test,
          result: row.result,
          unit: row.unit,
          range: row.referenceRange,
          category: CATEGORY_LABEL[row.category] || 'Other',
        })),
      });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  const patchDraft = (patch) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const patchRow = (key, patch) => {
    setDraft((current) => (
      current
        ? {
          ...current,
          rows: current.rows.map((item) => (item.key === key ? { ...item, ...patch } : item)),
        }
        : current
    ));
  };

  const saveExtracted = async () => {
    if (!draft) return;
    const kept = draft.rows.filter((row) => row.keep && row.test.trim() && row.result.trim());
    if (!draft.date) {
      setUploadError('Enter the collection date.');
      return;
    }
    if (kept.length === 0) {
      setUploadError('Keep at least one result.');
      return;
    }

    setSavingUpload(true);
    setUploadError('');
    const saved = [];
    try {
      for (const row of kept) {
        const created = await createLab({
          test: row.test.trim(),
          result: row.result.trim(),
          unit: row.unit.trim() || '—',
          range: row.range.trim() || '—',
          date: draft.date,
          source: draft.source.trim() || fileName || 'Uploaded report',
          category: row.category,
        });
        saved.push(created);
        setLabs((current) => [created, ...current]);
        setDraft((current) => (
          current ? { ...current, rows: current.rows.filter((item) => item.key !== row.key) } : current
        ));
      }
      setAdded((current) => ({ ...current, labs: current.labs + saved.length }));
      closeUpload();
      const label = saved.length === 1 ? `${saved[0].test} saved` : `${saved.length} results saved`;
      notify(`${label} to laboratory history`);
    } catch (err) {
      if (saved.length > 0) {
        setAdded((current) => ({ ...current, labs: current.labs + saved.length }));
      }
      setUploadError(err.message);
      notify(err.message);
    } finally {
      setSavingUpload(false);
    }
  };

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
            <Button icon={faUpload} onClick={openUpload}>Upload report</Button>
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
        text="Upload a PDF report. We’ll read the results so you can confirm them before saving."
        action={<Button onClick={openUpload}>Upload now</Button>}
      />

      {modal === 'upload' && (
        <Modal
          wide
          title="Upload report"
          subtitle="Upload a PDF. Check the rows, then save the ones you want."
          onClose={closeUpload}
          footer={(
            <>
              <Button variant="ghost" onClick={closeUpload}>Cancel</Button>
              <Button disabled={!draft || extracting || savingUpload} onClick={saveExtracted}>
                {savingUpload ? 'Saving...' : 'Save results'}
              </Button>
            </>
          )}
        >
          <label className="dropzone">
            <input type="file" accept="application/pdf,.pdf" onChange={onReport} />
            <FontAwesomeIcon icon={faUpload} />
            <strong>{fileName || 'Upload a PDF'}</strong>
            <span>{extracting ? 'Reading the report...' : 'We’ll extract each result so you can confirm it.'}</span>
          </label>
          {draft && (
            <>
              <div className="form-grid extracted">
                <Field label="Date">
                  <input
                    className="input"
                    type="date"
                    value={draft.date}
                    onChange={(event) => patchDraft({ date: event.target.value })}
                  />
                </Field>
                <Field label="Source">
                  <input
                    className="input"
                    value={draft.source}
                    placeholder="Laboratory name"
                    onChange={(event) => patchDraft({ source: event.target.value })}
                  />
                </Field>
              </div>
              <div className="table-scroll extracted">
                <table className="data-table extract-table">
                  <thead>
                    <tr>
                      <th className="col-check">Keep</th>
                      <th>Test</th>
                      <th>Result</th>
                      <th>Unit</th>
                      <th>Reference range</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.rows.map((row) => (
                      <tr key={row.key}>
                        <td className="col-check">
                          <input
                            type="checkbox"
                            checked={row.keep}
                            aria-label={`Keep ${row.test}`}
                            onChange={(event) => patchRow(row.key, { keep: event.target.checked })}
                          />
                        </td>
                        <td><input className="input" aria-label="Test" value={row.test} onChange={(event) => patchRow(row.key, { test: event.target.value })} /></td>
                        <td><input className="input" aria-label="Result" value={row.result} onChange={(event) => patchRow(row.key, { result: event.target.value })} /></td>
                        <td><input className="input" aria-label="Unit" value={row.unit} onChange={(event) => patchRow(row.key, { unit: event.target.value })} /></td>
                        <td><input className="input" aria-label="Reference range" value={row.range} onChange={(event) => patchRow(row.key, { range: event.target.value })} /></td>
                        <td>
                          <select className="input" aria-label="Category" value={row.category} onChange={(event) => patchRow(row.key, { category: event.target.value })}>
                            <option>Blood</option>
                            <option>Urine</option>
                            <option>Other</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {uploadError && <p className="form-error">{uploadError}</p>}
        </Modal>
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
