import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { Badge } from '../components/ui';

const PATIENT = {
  name: 'Anna Miller',
  age: '35 years',
  generated: '1 Oct 2026',
};

const ACTIVE = [
  { name: 'Metformin', dosage: '500 mg', schedule: '1-0-1 (morning & evening)', start: '01 Jan 2024' },
  { name: 'Lisinopril', dosage: '10 mg', schedule: '1-0-0 (morning)', start: '15 Feb 2024' },
  { name: 'Atorvastatin', dosage: '20 mg', schedule: '0-0-1 (evening)', start: '10 Mar 2024' },
];

const PAST = [
  { name: 'Omeprazole', dosage: '20 mg', schedule: '1-0-0 (morning)', start: '01 Nov 2023' },
  { name: 'Ibuprofen', dosage: '400 mg', schedule: '1-0-1 (as needed)', start: '12 Aug 2023' },
];

const LABS = [
  { test: 'Hemoglobin', result: '13.8', unit: 'g/dL', range: '12.0 – 16.0', date: '12 Apr 2025', source: 'Lab Berlin' },
  { test: 'White Blood Cells', result: '6.2', unit: '10⁹/L', range: '4.0 – 10.0', date: '12 Apr 2025', source: 'Lab Berlin' },
  { test: 'CRP', result: '2.3', unit: 'mg/L', range: '< 5.0', date: '10 Mar 2025', source: 'MVZ Mitte' },
  { test: 'Vitamin D (25-OH)', result: '28.5', unit: 'ng/mL', range: '30.0 – 100.0', date: '10 Mar 2025', source: 'Lab Berlin' },
  { test: 'Cholesterol (total)', result: '198', unit: 'mg/dL', range: '< 200', date: '05 Feb 2025', source: 'MVZ Mitte' },
];

const VACCINES = [
  { name: 'COVID-19 (Booster)', date: '15 Mar 2021', next: '—', status: 'Completed', tone: 'green' },
  { name: 'Influenza', date: '22 Oct 2024', next: 'Oct 2025', status: 'Due soon', tone: 'orange' },
  { name: 'Tetanus', date: '12 Jan 2019', next: 'Jan 2029', status: 'Up to date', tone: 'green' },
  { name: 'Hepatitis B', date: '10 Sep 2018', next: '—', status: 'Completed', tone: 'green' },
  { name: 'HPV', date: '05 Sep 2015', next: '—', status: 'Completed', tone: 'green' },
];

function ReportTable({ title, tone, columns, rows }) {
  return (
    <section>
      <header className="report-section-head">
        <h2>{title}</h2>
        <Badge tone={tone}>{rows.length}</Badge>
      </header>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.name || row.test}-${index}`}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.badge
                      ? <Badge tone={row.tone === 'orange' ? 'orange' : 'green'}>{row[column.key]}</Badge>
                      : column.strong
                        ? <strong>{row[column.key]}</strong>
                        : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const SAMPLE = {
  name: PATIENT.name,
  age: PATIENT.age,
  generated: PATIENT.generated,
  active: ACTIVE,
  past: PAST,
  labs: LABS,
  vaccines: VACCINES,
};

const MED_COLUMNS = [
  { key: 'name', label: 'Medication', strong: true },
  { key: 'dosage', label: 'Dosage' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'start', label: 'Started' },
];

export default function MedicationReport({ report = SAMPLE }) {
  useEffect(() => {
    document.title = 'Health report · HealthPassport';
  }, []);

  const hasMedication = Array.isArray(report.active) || Array.isArray(report.past);
  const hasLabs = Array.isArray(report.labs);
  const hasVaccines = Array.isArray(report.vaccines);

  return (
    <main className="report-screen">
      <header className="report-letterhead">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <FontAwesomeIcon icon={faHeartPulse} />
          </span>
          <span className="brand-name">HealthPassport</span>
        </div>
        <p>Health report · {report.generated}</p>
      </header>

      <section className="report-patient">
        <h1>{report.name}</h1>
        <p>{report.age}</p>
      </section>

      {hasMedication && (
        <article className="card report-card">
          {report.active?.length > 0 && (
            <ReportTable title="Medication" tone="green" rows={report.active} columns={MED_COLUMNS} />
          )}
          {report.past?.length > 0 && (
            <ReportTable title="Past" tone="gray" rows={report.past} columns={MED_COLUMNS} />
          )}
          {!report.active?.length && !report.past?.length && (
            <p className="empty-note">No medications in this report.</p>
          )}
        </article>
      )}

      {hasLabs && (
        <article className="card report-card">
          {report.labs.length > 0 ? (
            <ReportTable
              title="Laboratory"
              tone="blue"
              rows={report.labs}
              columns={[
                { key: 'test', label: 'Test', strong: true },
                { key: 'result', label: 'Result' },
                { key: 'unit', label: 'Unit' },
                { key: 'range', label: 'Reference range' },
                { key: 'date', label: 'Date' },
                { key: 'source', label: 'Source' },
              ]}
            />
          ) : <p className="empty-note">No laboratory results in this report.</p>}
        </article>
      )}

      {hasVaccines && (
        <article className="card report-card">
          {report.vaccines.length > 0 ? (
            <ReportTable
              title="Vaccination"
              tone="teal"
              rows={report.vaccines}
              columns={[
                { key: 'name', label: 'Vaccine', strong: true },
                { key: 'date', label: 'Date' },
                { key: 'next', label: 'Next due' },
                { key: 'status', label: 'Status', badge: true },
              ]}
            />
          ) : <p className="empty-note">No vaccinations in this report.</p>}
        </article>
      )}

      {!hasMedication && !hasLabs && !hasVaccines && (
        <p className="empty-note">This share does not include medication, laboratory, or vaccination records.</p>
      )}
    </main>
  );
}
