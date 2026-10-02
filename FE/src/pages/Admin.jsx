import { useMemo, useState } from 'react';
import { createClinic, createPractitioner, deletePractitioner } from '../api';
import { useApp } from '../App';
import { Button, Field, Modal, PageIntro } from '../components/ui';

const emptyPractitioner = { name: '', email: '', role: '', clinicId: '' };
const emptyClinic = { name: '', district: '' };

export default function Admin() {
  const { directory, setDirectory, clinics, setClinics, notify } = useApp();
  const [form, setForm] = useState(emptyPractitioner);
  const [clinicForm, setClinicForm] = useState(emptyClinic);
  const [saving, setSaving] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);
  const [pendingId, setPendingId] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const practitioners = useMemo(() => (
    directory
      .filter((person) => person.kind === 'practitioner')
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
  ), [directory]);

  const clinicName = (id) => clinics.find((clinic) => clinic.id === id)?.name || 'No clinic';
  const removing = practitioners.find((person) => person.id === deleteId);

  const addClinic = async (event) => {
    event.preventDefault();
    const name = clinicForm.name.trim();
    const district = clinicForm.district.trim();
    if (!name || !district) {
      notify('Clinic name and district are required');
      return;
    }
    setSavingClinic(true);
    try {
      const clinic = await createClinic({ name, district });
      setClinics((current) => [...current.filter((item) => item.id !== clinic.id), clinic]
        .sort((left, right) => left.name.localeCompare(right.name)));
      setClinicForm(emptyClinic);
      notify(`${clinic.name} added`);
    } catch (err) {
      notify(err.message);
    } finally {
      setSavingClinic(false);
    }
  };

  const add = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const role = form.role.trim();
    if (!name || !email || !role || !form.clinicId) {
      notify('Name, email, role, and clinic are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify('Enter a valid email address');
      return;
    }
    setSaving(true);
    try {
      const person = await createPractitioner({ name, email, role, clinicId: form.clinicId });
      setDirectory((current) => [...current.filter((item) => item.id !== person.id), person]);
      setForm({ name: '', email: '', role: '', clinicId: form.clinicId });
      notify(`${person.name} added`);
    } catch (err) {
      notify(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!removing) return;
    setPendingId(removing.id);
    try {
      await deletePractitioner(removing.id);
      setDirectory((current) => current.filter((item) => item.id !== removing.id));
      setDeleteId(null);
      notify(`${removing.name} removed`);
    } catch (err) {
      notify(err.message);
    } finally {
      setPendingId('');
    }
  };

  return (
    <>
      <PageIntro
        title="Admin"
        text="Add a clinic, then add a practitioner and choose which clinic they belong to."
      />
      <div className="admin-layout">
        <section className="card form-card">
          <header className="card-head"><h2>Add a clinic</h2></header>
          <form className="admin-form cols-3" onSubmit={addClinic}>
            <Field label="Clinic name">
              <input
                className="input"
                value={clinicForm.name}
                placeholder="Charité – Universitätsmedizin Berlin"
                onChange={(event) => setClinicForm({ ...clinicForm, name: event.target.value })}
              />
            </Field>
            <Field label="District">
              <input
                className="input"
                value={clinicForm.district}
                placeholder="Mitte"
                onChange={(event) => setClinicForm({ ...clinicForm, district: event.target.value })}
              />
            </Field>
            <Button type="submit" disabled={savingClinic}>
              {savingClinic ? 'Adding…' : 'Add clinic'}
            </Button>
          </form>
        </section>

        <section className="card form-card">
          <header className="card-head"><h2>Add a practitioner</h2></header>
          <form className="admin-form practitioner-form" onSubmit={add}>
            <Field label="Name">
              <input
                className="input"
                value={form.name}
                placeholder="Dr. Anna Hoffmann"
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className="input"
                type="email"
                value={form.email}
                placeholder="anna.hoffmann@charite.de"
                autoComplete="off"
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </Field>
            <Field label="Role">
              <input
                className="input"
                value={form.role}
                placeholder="Cardiologist"
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              />
            </Field>
            <Field label="Clinic">
              <select
                className="input"
                value={form.clinicId}
                onChange={(event) => setForm({ ...form, clinicId: event.target.value })}
              >
                <option value="">Select a clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.district ? `${clinic.name} · ${clinic.district}` : clinic.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" disabled={saving || clinics.length === 0}>
              {saving ? 'Adding…' : 'Add practitioner'}
            </Button>
          </form>
        </section>

        <section className="card flat">
          {practitioners.length === 0 ? (
            <p className="empty-note">No practitioners yet. Add one above.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Clinic</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {practitioners.map((person) => (
                    <tr key={person.id}>
                      <td>{person.name}</td>
                      <td>{person.email || '—'}</td>
                      <td>{person.role}</td>
                      <td>{clinicName(person.clinicId)}</td>
                      <td>
                        <button
                          type="button"
                          className="linkish danger"
                          disabled={pendingId === person.id}
                          onClick={() => setDeleteId(person.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {removing && (
        <Modal
          title="Delete practitioner"
          subtitle={`Remove ${removing.name} from the directory. Existing shares keep their saved name.`}
          onClose={() => setDeleteId(null)}
          footer={(
            <>
              <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button onClick={remove} disabled={pendingId === removing.id}>
                {pendingId === removing.id ? 'Deleting…' : 'Delete'}
              </Button>
            </>
          )}
        >
          <p>{removing.name} will no longer appear when a patient chooses {clinicName(removing.clinicId)}.</p>
        </Modal>
      )}
    </>
  );
}
