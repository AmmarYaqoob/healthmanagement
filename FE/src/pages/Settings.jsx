import { useEffect, useState } from 'react';
import { saveSettings } from '../api';
import { useApp } from '../App';
import { Button, Field, PageIntro } from '../components/ui';

const emptyProfile = { name: '', email: '', reminders: true, labs: true, sharing: true };

export default function Settings() {
  const { profile, setProfile, notify } = useApp();
  const [form, setForm] = useState(profile || emptyProfile);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      notify('Name and email are required');
      return;
    }
    try {
      const saved = await saveSettings({
        name: form.name.trim(),
        email: form.email.trim(),
        reminders: form.reminders,
        labs: form.labs,
        sharing: form.sharing,
      });
      setProfile(saved);
      notify('Settings saved');
    } catch (err) {
      notify(err.message);
    }
  };

  const toggle = (key) => setForm((current) => ({ ...current, [key]: !current[key] }));

  return (
    <form onSubmit={save}>
      <PageIntro
        title="Settings"
        text="Manage your profile and how HealthPassport keeps you informed."
      />
      <div className="settings-grid">
        <section className="card">
          <header className="card-head"><h2>Profile</h2></header>
          <div className="form-grid tight-form">
            <Field label="Full name">
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </Field>
          </div>
        </section>
        <section className="card">
          <header className="card-head"><h2>Notifications</h2></header>
          <div>
            <div className="switch-row">
              <div>
                <strong>Reminders</strong>
                <p>Blood tests, refills, and upcoming vaccines.</p>
              </div>
              <button type="button" className={form.reminders ? 'switch on' : 'switch'} role="switch" aria-checked={form.reminders} onClick={() => toggle('reminders')}>
                <i />
              </button>
            </div>
            <div className="switch-row">
              <div>
                <strong>Laboratory results</strong>
                <p>Tell me when a new result is stored.</p>
              </div>
              <button type="button" className={form.labs ? 'switch on' : 'switch'} role="switch" aria-checked={form.labs} onClick={() => toggle('labs')}>
                <i />
              </button>
            </div>
            <div className="switch-row">
              <div>
                <strong>Sharing activity</strong>
                <p>Let me know when a link is used or revoked.</p>
              </div>
              <button type="button" className={form.sharing ? 'switch on' : 'switch'} role="switch" aria-checked={form.sharing} onClick={() => toggle('sharing')}>
                <i />
              </button>
            </div>
          </div>
        </section>
      </div>
      <div className="settings-actions">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
