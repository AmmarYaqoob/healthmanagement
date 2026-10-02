import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlask,
  faFolder,
  faInbox,
  faLink,
  faPills,
  faShieldHalved,
  faSyringe,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { createShare, revokeShare } from '../api';
import { useApp } from '../App';
import { Button, Field, Modal, PageIntro, Tile } from '../components/ui';

const RECORD_TYPES = [
  { id: 'medication', label: 'Medication', count: 3, icon: faPills, tone: 'blue' },
  { id: 'laboratory', label: 'Laboratory', count: 1, icon: faFlask, tone: 'teal' },
  { id: 'vaccination', label: 'Vaccination', count: 5, icon: faSyringe, tone: 'green' },
  { id: 'documents', label: 'Documents', count: 2, icon: faFolder, tone: 'purple' },
];

const DURATIONS = [
  { label: '24 hours', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'Single use', singleUse: true },
];

function initials(name) {
  return name.split(' ').filter((part) => part !== 'Dr.' && part !== '·').slice(0, 2).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export default function Sharing() {
  const { shares, setShares, directory, clinics, notify } = useApp();
  const [tab, setTab] = useState('professionals');
  const [selected, setSelected] = useState(['medication', 'laboratory', 'documents']);
  const [clinicId, setClinicId] = useState('');
  const [practitionerId, setPractitionerId] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [duration, setDuration] = useState('7 days');
  const [allowDownload, setAllowDownload] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [revokeId, setRevokeId] = useState(null);

  const clinicPractitioners = useMemo(() => {
    if (!clinicId) return [];
    return directory
      .filter((person) => person.kind === 'practitioner' && person.clinicId === clinicId)
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [directory, clinicId]);

  const chooseClinic = (id) => {
    setClinicId(id);
    setPractitionerId('');
  };

  const choosePractitioner = (id) => {
    setPractitionerId(id);
    const person = clinicPractitioners.find((item) => item.id === id);
    if (!person) return;
    setRecipients((current) => (current.some((item) => item.id === person.id) ? current : [...current, person]));
  };

  const generate = async () => {
    if (selected.length === 0) {
      setError('Select at least one record type.');
      return;
    }
    if (recipients.length === 0) {
      setError('Choose a recipient.');
      return;
    }
    const choice = DURATIONS.find((item) => item.label === duration) || DURATIONS[1];
    try {
      const created = [];
      for (const person of recipients) {
        created.push(await createShare({
          person,
          days: choice.days || 7,
          singleUse: Boolean(choice.singleUse),
          allowDownload,
          types: selected,
        }));
      }
      setShares((current) => [...created.map((item) => item.share).reverse(), ...current]);
      setLink(created[0]?.link || '');
      setError('');
      notify('Sharing link created');
    } catch (err) {
      setError(err.message);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      notify('Link copied');
    } catch {
      notify('Select the link to copy it');
    }
  };

  const revoke = shares.find((item) => item.id === revokeId);

  return (
    <>
      <PageIntro
        title="Sharing"
        text="Authorize healthcare professionals and restrict access to your health data. You can select specific records, generate a time-limited sharing link and revoke access anytime."
      />
      <div className="underline-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'professionals'} className={tab === 'professionals' ? 'active' : ''} onClick={() => setTab('professionals')}>
          Share with professionals
        </button>
        <button type="button" role="tab" aria-selected={tab === 'incoming'} className={tab === 'incoming' ? 'active' : ''} onClick={() => setTab('incoming')}>
          Shared with you
        </button>
      </div>

      {tab === 'incoming' ? (
        <section className="card empty-state">
          <Tile tone="blue" icon={faInbox} />
          <strong>Nothing shared with you</strong>
          <p>When a professional shares records with Anna, they will show up here.</p>
        </section>
      ) : (
        <div className="share-layout">
          <section className="card share-card">
            <div className="step">
              <div className="step-head">
                <span className="step-num">1</span>
                <div>
                  <h2>Select records</h2>
                  <p>Choose which records to share.</p>
                </div>
              </div>
              <div className="record-grid">
                {RECORD_TYPES.map((item) => {
                  const on = selected.includes(item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={on ? 'record-card selected' : 'record-card'}
                      aria-pressed={on}
                      onClick={() => setSelected((current) => (
                        current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                      ))}
                    >
                      <Tile small tone={item.tone} icon={item.icon} />
                      <span>
                        <strong>{item.label}</strong>
                        {on && <em>{item.count} selected</em>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="step">
              <div className="step-head">
                <span className="step-num">2</span>
                <div>
                  <h2>Choose recipient</h2>
                  <p>Select a clinic, then a practitioner at that clinic.</p>
                </div>
              </div>
              <div className="recipient-picks">
                <Field label="Clinic">
                  <select value={clinicId} onChange={(event) => chooseClinic(event.target.value)}>
                    <option value="">Select a clinic</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.district ? `${clinic.name} · ${clinic.district}` : clinic.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Practitioner">
                  <select
                    value={practitionerId}
                    disabled={!clinicId}
                    onChange={(event) => choosePractitioner(event.target.value)}
                  >
                    <option value="">{clinicId ? 'Select a practitioner' : 'Select a clinic first'}</option>
                    {clinicPractitioners.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} · {person.role}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="recipient-list">
                {recipients.map((person) => (
                  <div className="recipient" key={person.id || person.name}>
                    <span className="initials blue">{initials(person.name)}</span>
                    <div>
                      <strong>{person.name}</strong>
                      <span>{person.role}</span>
                    </div>
                    <button type="button" className="icon-btn" aria-label={`Remove ${person.name}`} onClick={() => {
                      setRecipients((current) => current.filter((item) => item.id !== person.id));
                      if (practitionerId === person.id) setPractitionerId('');
                    }}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="step">
              <div className="step-head">
                <span className="step-num">3</span>
                <div>
                  <h2>Set access and create link</h2>
                  <p>Limit how long the link stays valid.</p>
                </div>
              </div>
              <div className="access-row">
                <Field label="Valid for">
                  <select className="input" value={duration} onChange={(event) => setDuration(event.target.value)}>
                    {DURATIONS.map((item) => <option key={item.label}>{item.label}</option>)}
                  </select>
                </Field>
                <label className="check">
                  <input type="checkbox" checked={allowDownload} onChange={(event) => setAllowDownload(event.target.checked)} />
                  Allow download
                </label>
              </div>
              <Button icon={faLink} onClick={generate}>Generate sharing link</Button>
              {error && <p className="form-error">{error}</p>}
              {link && (
                <div className="link-box">
                  <a href={link}>{link}</a>
                  <Button variant="ghost" onClick={copyLink}>Copy</Button>
                </div>
              )}
            </div>
          </section>

          <div className="share-side">
            <aside className="secure-card">
              <Tile tone="blue" icon={faShieldHalved} />
              <div>
                <strong>Share securely</strong>
                <p>A time-limited link will be created. You can revoke access at any time.</p>
              </div>
            </aside>
            <section className="card">
              <header className="card-head"><h2>Active shares</h2></header>
              {shares.length === 0 ? (
                <p className="empty-note">No active shares. Generate a link to give time-limited access.</p>
              ) : (
                <ul className="share-list">
                  {shares.map((share) => (
                    <li key={share.id} className="share-row">
                      <span className={`initials ${share.tone}`}>{initials(share.name)}</span>
                      <div>
                        <strong>{share.name}</strong>
                        <span className="share-meta">{share.role}</span>
                        <span className="share-meta">{share.singleUse ? 'Single use' : `Valid until ${share.until}`}</span>
                      </div>
                      <button type="button" className="linkish danger" onClick={() => setRevokeId(share.id)}>Revoke</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {revoke && (
        <Modal
          title="Revoke access"
          subtitle={`Remove ${revoke.name}’s access to the shared records.`}
          onClose={() => setRevokeId(null)}
          footer={(
            <>
              <Button variant="ghost" onClick={() => setRevokeId(null)}>Cancel</Button>
              <Button onClick={() => {
                revokeShare(revoke.id)
                  .then(() => {
                    setShares((current) => current.filter((item) => item.id !== revoke.id));
                    setRevokeId(null);
                    notify(`Access revoked for ${revoke.name}`);
                  })
                  .catch((err) => notify(err.message));
              }}
              >
                Revoke
              </Button>
            </>
          )}
        >
          <p>The existing link will stop working.</p>
        </Modal>
      )}
    </>
  );
}
