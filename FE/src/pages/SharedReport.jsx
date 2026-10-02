import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { loadReport } from '../api';
import MedicationReport from './MedicationReport';

export default function SharedReport() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setReport(null);
    setError('');
    loadReport(token)
      .then((data) => {
        if (!ignore) setReport(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'This sharing link is not valid.');
      });
    return () => {
      ignore = true;
    };
  }, [token]);

  if (error) {
    return (
      <main className="report-screen">
        <p className="empty-note">{error}</p>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="report-screen">
        <p className="empty-note">Loading the report…</p>
      </main>
    );
  }

  return <MedicationReport report={report} />;
}
