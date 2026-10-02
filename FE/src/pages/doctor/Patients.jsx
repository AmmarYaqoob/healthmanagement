import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { matches } from '../../data';
import { useDoctor } from '../../doctor/DoctorLayout';
import { formatWhen } from '../../doctor/data';
import { Badge, Button, DetailModal, EmptyNote, Field, Modal, PageIntro, Tile } from '../../components/ui';

const TABS = [
  { id: 'All', tone: 'blue' },
  { id: 'Active', tone: 'green' },
  { id: 'Inactive', tone: 'gray' },
];
const PROBLEM_TYPES = [
  { id: 'Active', tone: 'orange' },
  { id: 'Resolved', tone: 'gray' },
];
const PATIENT_TYPES = [
  { id: 'Active', tone: 'green' },
  { id: 'Inactive', tone: 'gray' },
];
const emptyForm = { name: '', age: '', problem: '', problemStatus: 'Active', status: 'Active' };

function problemTone(status) {
  return status === 'Active' ? 'orange' : 'gray';
}

function TypeChoices({ label, value, options, onChange }) {
  return (
    <Field label={label}>
      <div className="type-choices" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            role="radio"
            aria-checked={value === option.id}
            className={value === option.id ? `chip tone-${option.tone} active` : 'chip'}
            onClick={() => onChange(option.id)}
          >
            {option.id}
          </button>
        ))}
      </div>
    </Field>
  );
}

export default function DoctorPatients() {
  const { patients, appointments, addPatient, notify } = useDoctor();
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const openAdd = () => {
    setForm(emptyForm);
    setError('');
    setAdding(true);
  };

  const closeAdd = () => {
    setAdding(false);
    setError('');
  };

  const nextVisit = (patientId) => {
    const upcoming = appointments
      .filter((item) => item.patientId === patientId && item.status === 'Upcoming')
      .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
    return upcoming[0] ? formatWhen(upcoming[0].startsAt) : '—';
  };

  const save = (event) => {
    event.preventDefault();
    const age = Number(form.age);
    if (!form.name.trim()) {
      setError('Enter the patient’s name.');
      return;
    }
    if (form.age === '' || !Number.isInteger(age) || age < 0 || age > 120) {
      setError('Enter an age between 0 and 120.');
      return;
    }
    if (!form.problem.trim()) {
      setError('Enter the problem you are following.');
      return;
    }
    const saved = addPatient(form);
    setForm(emptyForm);
    setError('');
    setAdding(false);
    setTab(saved.status);
    setQuery('');
    notify(`${saved.name} added`);
  };

  const counts = {
    All: patients.length,
    Active: patients.filter((item) => item.status === 'Active').length,
    Inactive: patients.filter((item) => item.status === 'Inactive').length,
  };

  const shown = useMemo(() => patients.filter((item) => {
    if (tab !== 'All' && item.status !== tab) return false;
    const problems = item.problems.map((problem) => `${problem.name} ${problem.status}`).join(' ');
    return matches(query, item.name, item.status, problems, item.lastVisit);
  }), [patients, tab, query]);

  return (
    <>
      <PageIntro
        title="Patients"
        text="Everyone in your care, the problem you are following, and whether that patient is still active."
        actions={<Button icon={faPlus} onClick={openAdd}>Add patient</Button>}
      />

      <section className="card flat">
        <div className="toolbar">
          <div className="chips" role="tablist" aria-label="Patient status">
            {TABS.map((item) => (
              <button
                type="button"
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                className={tab === item.id ? `chip tone-${item.tone} active` : 'chip'}
                onClick={() => setTab(item.id)}
              >
                {item.id}
                <span className="chip-count">{counts[item.id]}</span>
              </button>
            ))}
          </div>
          <label className="mini-search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span className="sr-only">Search patients</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patients or problems..."
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Problems</th>
                <th>Status</th>
                <th>Next visit</th>
                <th>Last visit</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan="5"><EmptyNote>No patients match this view.</EmptyNote></td>
                </tr>
              )}
              {shown.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button type="button" className="name-cell" onClick={() => setSelected(item)}>
                      <Tile small tone={item.status === 'Active' ? 'green' : 'gray'} icon={faUser} />
                      <span>
                        {item.name}
                        <small className="cell-note">{item.age} years</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <div className="problem-stack">
                      {item.problems.map((problem) => (
                        <span className="problem-line" key={problem.name}>
                          {problem.name}
                          <Badge tone={problemTone(problem.status)}>{problem.status}</Badge>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Badge tone={item.status === 'Active' ? 'green' : 'gray'}>{item.status}</Badge>
                  </td>
                  <td>{nextVisit(item.id)}</td>
                  <td>{item.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {adding && (
        <Modal
          title="Add patient"
          subtitle="Enter the person you are taking into your care."
          onClose={closeAdd}
          footer={(
            <>
              <Button variant="ghost" onClick={closeAdd}>Cancel</Button>
              <Button onClick={save}>Save patient</Button>
            </>
          )}
        >
          <form className="form-grid" onSubmit={save}>
            <Field label="Name">
              <input
                className="input"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Patient name"
              />
            </Field>
            <Field label="Age">
              <input
                className="input"
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={(event) => setForm({ ...form, age: event.target.value })}
                placeholder="Age in years"
              />
            </Field>
            <Field label="Problem">
              <input
                className="input"
                value={form.problem}
                onChange={(event) => setForm({ ...form, problem: event.target.value })}
                placeholder="Condition you are following"
              />
            </Field>
            <TypeChoices
              label="Problem status"
              value={form.problemStatus}
              options={PROBLEM_TYPES}
              onChange={(problemStatus) => setForm({ ...form, problemStatus })}
            />
            <TypeChoices
              label="Patient status"
              value={form.status}
              options={PATIENT_TYPES}
              onChange={(status) => setForm({ ...form, status })}
            />
          </form>
          {error && <p className="form-error">{error}</p>}
        </Modal>
      )}

      {selected && (
        <DetailModal
          title={selected.name}
          onClose={() => setSelected(null)}
          rows={[
            { label: 'Age', value: `${selected.age} years` },
            { label: 'Patient status', value: <Badge tone={selected.status === 'Active' ? 'green' : 'gray'}>{selected.status}</Badge> },
            { label: 'Next visit', value: nextVisit(selected.id) },
            { label: 'Last visit', value: selected.lastVisit },
            {
              label: 'Problems',
              value: (
                <div className="problem-stack">
                  {selected.problems.map((problem) => (
                    <span className="problem-line" key={problem.name}>
                      {problem.name}
                      <Badge tone={problemTone(problem.status)}>{problem.status}</Badge>
                    </span>
                  ))}
                </div>
              ),
            },
          ]}
        />
      )}
    </>
  );
}
