import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faCamera,
  faClipboardList,
  faFileImage,
  faFileLines,
  faFilePdf,
  faFlask,
  faFolder,
  faPills,
  faSyringe,
  faUpload,
  faVial,
} from '@fortawesome/free-solid-svg-icons';
import { useApp } from '../App';
import { Badge, Modal, PageIntro, Tile } from '../components/ui';

const tileIcon = {
  pdf: faFilePdf,
  file: faFileLines,
  image: faFileImage,
  syringe: faSyringe,
  pills: faPills,
  vial: faVial,
  flask: faFlask,
  folder: faFolder,
};

export default function Dashboard() {
  const { openPage, medications, labs, vaccines, documents, recentDocs, reminders } = useApp();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [reminder, setReminder] = useState(null);
  const [showAllReminders, setShowAllReminders] = useState(false);
  const current = medications.filter((item) => item.status === 'Active').slice(0, 3);
  const activeCount = medications.filter((item) => item.status === 'Active').length;
  const vaccineLabel = vaccines.some((item) => item.status === 'Due soon') ? 'Due soon' : 'Up to date';

  return (
    <>
      <PageIntro title="Hello, Anna!" text="Here is your personal health overview." />
      <section className="stats" aria-label="Health summary">
        <button type="button" className="stat" onClick={() => openPage('medication')}>
          <Tile tone="green" icon={faPills} />
          <span className="stat-copy">
            <span className="stat-value">{activeCount} active</span>
            <span className="stat-label">Medications</span>
          </span>
        </button>
        <button type="button" className="stat" onClick={() => openPage('laboratory')}>
          <Tile tone="blue" icon={faFlask} />
          <span className="stat-copy">
            <span className="stat-value">{labs.length} stored</span>
            <span className="stat-label">Lab results</span>
          </span>
        </button>
        <button type="button" className="stat" onClick={() => openPage('vaccination')}>
          <Tile tone="teal" icon={faSyringe} />
          <span className="stat-copy">
            <span className="stat-value">{vaccineLabel}</span>
            <span className="stat-label">Vaccinations</span>
          </span>
        </button>
        <button type="button" className="stat" onClick={() => openPage('documents')}>
          <Tile tone="purple" icon={faFolder} />
          <span className="stat-copy">
            <span className="stat-value">{documents.length} stored</span>
            <span className="stat-label">Documents</span>
          </span>
        </button>
      </section>

      <div className="split">
        <section className="card">
          <header className="card-head">
            <h2>Recent Documents</h2>
            <button type="button" className="linkish" onClick={() => openPage('documents')}>View all</button>
          </header>
          <ul className="row-list">
            {recentDocs.slice(0, 4).map((doc) => (
              <li key={doc.id}>
                <button type="button" className="row-item" onClick={() => openPage('documents')}>
                  <Tile small tone={doc.tone} icon={tileIcon[doc.icon] || faFileLines} />
                  <span className="row-copy">
                    <strong>{doc.title}</strong>
                    <span>{doc.date}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <header className="card-head">
            <h2>Current Medication</h2>
            <button type="button" className="linkish" onClick={() => openPage('medication')}>View all</button>
          </header>
          <ul className="row-list">
            {current.map((med) => (
              <li key={med.id}>
                <button type="button" className="row-item" onClick={() => openPage('medication')}>
                  <Tile small tone={med.tone} icon={faPills} />
                  <span className="row-copy">
                    <strong>{med.name} {med.dosage}</strong>
                    <span>{med.schedule}</span>
                  </span>
                  <Badge tone="green">Active</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="split">
        <section className="card">
          <header className="card-head">
            <h2>Upcoming Reminders</h2>
            <button type="button" className="linkish" onClick={() => setShowAllReminders(true)}>View all</button>
          </header>
          <ul className="row-list">
            {reminders.map((item) => (
              <li key={item.id}>
                <button type="button" className="row-item" onClick={() => setReminder(item)}>
                  <Tile small tone={item.tone} icon={tileIcon[item.icon] || faCalendarDays} />
                  <span className="row-copy">
                    <strong>{item.title}</strong>
                    <span>{item.date}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <header className="card-head">
            <h2>Quick Actions</h2>
          </header>
          <div className="actions">
            <button type="button" className="action" onClick={() => openPage('medication', 'add')}>
              <Tile small tone="blue" icon={faPills} /> Add medication
            </button>
            <button type="button" className="action" onClick={() => openPage('documents', 'upload')}>
              <Tile small tone="purple" icon={faUpload} /> Upload document
            </button>
            <button type="button" className="action" onClick={() => openPage('medication', 'scan')}>
              <Tile small tone="teal" icon={faCamera} /> Scan prescription
            </button>
            <button type="button" className="action" onClick={() => openPage('appointment', 'add')}>
              <Tile small tone="orange" icon={faCalendarDays} /> Add appointment
            </button>
            <button type="button" className="action" onClick={() => setSummaryOpen(true)}>
              <Tile small tone="green" icon={faClipboardList} /> View summary
            </button>
          </div>
        </section>
      </div>

      {summaryOpen && (
        <Modal title="Health summary" subtitle="A snapshot of Anna Miller’s record." onClose={() => setSummaryOpen(false)}>
          <dl className="detail-grid">
            <div><dt>Medications</dt><dd>{activeCount} active</dd></div>
            <div><dt>Lab results</dt><dd>{labs.length} stored</dd></div>
            <div><dt>Vaccinations</dt><dd>{vaccineLabel}</dd></div>
            <div><dt>Documents</dt><dd>{documents.length} stored</dd></div>
            <div className="span-2">
              <dt>Next reminder</dt>
              <dd>{reminders[0] ? `${reminders[0].title} · ${reminders[0].date}` : 'None scheduled'}</dd>
            </div>
          </dl>
        </Modal>
      )}

      {showAllReminders && (
        <Modal title="Upcoming reminders" onClose={() => setShowAllReminders(false)}>
          <ul className="row-list">
            {reminders.map((item) => (
              <li key={item.id}>
                <button type="button" className="row-item" onClick={() => { setShowAllReminders(false); setReminder(item); }}>
                  <Tile small tone={item.tone} icon={tileIcon[item.icon] || faCalendarDays} />
                  <span className="row-copy">
                    <strong>{item.title}</strong>
                    <span>{item.date}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {reminder && (
        <Modal title={reminder.title} onClose={() => setReminder(null)}>
          <dl className="detail-grid">
            <div><dt>When</dt><dd>{reminder.date}</dd></div>
            <div><dt>Status</dt><dd>Scheduled</dd></div>
            <div className="span-2"><dt>Note</dt><dd>You’ll get a reminder before this is due. No data leaves this preview.</dd></div>
          </dl>
        </Modal>
      )}
    </>
  );
}
