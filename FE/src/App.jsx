import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartPulse, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { loadAppointments, loadPage, markAppointmentNotified } from './api';
import { clearSession, homeFor, readSession, writeSession } from './accounts';
import { appointmentLead, appointmentNoticeDue, pageMeta } from './data';
import Shell from './components/Shell';
import Dashboard from './pages/Dashboard';
import Medication from './pages/Medication';
import MedicationReport from './pages/MedicationReport';
import SharedReport from './pages/SharedReport';
import Laboratory from './pages/Laboratory';
import Vaccination from './pages/Vaccination';
import Documents from './pages/Documents';
import Sharing from './pages/Sharing';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Appointment from './pages/Appointment';
import Auth from './pages/Auth';
import DoctorLayout from './doctor/DoctorLayout';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorPatients from './pages/doctor/Patients';
import DoctorAppointments from './pages/doctor/Appointments';

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

const pages = {
  dashboard: Dashboard,
  medication: Medication,
  laboratory: Laboratory,
  vaccination: Vaccination,
  documents: Documents,
  sharing: Sharing,
  appointment: Appointment,
  settings: Settings,
};

function pageFromPath(pathname) {
  const id = pathname.replace(/^\//, '');
  if (id === 'admin') return id;
  return Object.prototype.hasOwnProperty.call(pages, id) ? id : null;
}

function showAppointmentNotification(item, label) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const where = item.location ? ` at ${item.location}` : '';
  try {
    const notification = new Notification(item.title, { body: `Starts ${label}${where}` });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // This browser blocked the notification.
  }
}

function MedicationReportPage() {
  return <MedicationReport />;
}

function AdminPage() {
  const { loadedPage, logout } = useApp();
  return (
    <div className="admin-app">
      <header className="topbar admin-topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <FontAwesomeIcon icon={faHeartPulse} />
          </span>
          <span className="brand-name">HealthPassport</span>
        </div>
        <button type="button" className="admin-signout" onClick={logout}>
          <FontAwesomeIcon icon={faRightFromBracket} />
          Sign out
        </button>
      </header>
      <main className="admin-screen">
        {loadedPage === 'admin' ? <Admin /> : <p className="empty-note">Loading…</p>}
      </main>
    </div>
  );
}

function Gate({ area, children }) {
  const { session } = useApp();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== area) return <Navigate to={homeFor(session)} replace />;
  return children;
}

function HomeRedirect() {
  const { session } = useApp();
  return <Navigate to={homeFor(session)} replace />;
}

function AuthRoute() {
  const { session, login } = useApp();
  if (session) return <Navigate to={homeFor(session)} replace />;
  return <Auth onLogin={login} />;
}

function AppPage() {
  const { pageId } = useParams();
  const { loadedPage, session } = useApp();
  const Page = pages[pageId];
  if (!Page) return <Navigate to={homeFor(session)} replace />;

  return (
    <Shell>
      {loadedPage === pageId ? <Page /> : <p className="empty-note">Loading your records…</p>}
    </Shell>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = pageFromPath(location.pathname);
  const pendingAction = searchParams.get('action');
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [medications, setMedications] = useState([]);
  const [labs, setLabs] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [shares, setShares] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadedPage, setLoadedPage] = useState(null);
  const [added, setAdded] = useState({ meds: 0, labs: 0, docs: 0 });
  const [session, setSession] = useState(() => readSession());

  const notify = useCallback((message) => setToast(message), []);

  const openPage = useCallback((id, action) => {
    const path = `/${id}`;
    navigate(action ? `${path}?action=${encodeURIComponent(action)}` : path);
    setMenuOpen(false);
  }, [navigate]);

  const clearAction = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('action');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const login = useCallback((email) => {
    const next = writeSession(email);
    if (!next) return false;
    setSession(next);
    navigate(homeFor(next), { replace: true });
    return true;
  }, [navigate]);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setMenuOpen(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!page) return;
    document.title = `${pageMeta[page] || 'HealthPassport'} · HealthPassport`;
  }, [page]);

  useEffect(() => {
    const canLoad = session && (page === 'admin' ? session.role === 'admin' : session.role === 'patient');
    if (!page || !canLoad) return undefined;

    let ignore = false;
    setLoading(true);
    loadPage(page)
      .then((data) => {
        if (ignore) return;
        if (data.profile) setProfile(data.profile);
        if (data.medications) setMedications(data.medications);
        if (data.labs) setLabs(data.labs);
        if (data.vaccines) setVaccines(data.vaccines);
        if (data.documents) setDocuments(data.documents);
        if (data.folders) setFolders(data.folders);
        if (data.recentDocs) setRecentDocs(data.recentDocs);
        if (data.reminders) setReminders(data.reminders);
        if (data.appointments) setAppointments(data.appointments);
        if (data.shares) setShares(data.shares);
        if (data.directory) setDirectory(data.directory);
        if (data.clinics) setClinics(data.clinics);
        setLoadedPage(page);
      })
      .catch((error) => {
        if (!ignore) {
          notify(error.message);
          setLoadedPage(page);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, session, notify]);

  const noticeRequest = useRef(0);
  const firingNotices = useRef(new Set());

  const refreshAppointmentNotices = useCallback(async () => {
    const requestId = noticeRequest.current + 1;
    noticeRequest.current = requestId;
    try {
      const list = await loadAppointments();
      if (noticeRequest.current !== requestId) return;
      setAppointments(list);
      const due = list.filter((item) => appointmentNoticeDue(item));
      for (const item of due) {
        if (firingNotices.current.has(item.id)) continue;
        firingNotices.current.add(item.id);
        const label = appointmentLead(item.startsAt);
        notify(`${item.title} is ${label}`);
        showAppointmentNotification(item, label);
        try {
          await markAppointmentNotified(item.id);
        } catch {
          firingNotices.current.delete(item.id);
        }
      }
    } catch {
      // Page loading already reports when the API is unreachable.
    }
  }, [notify]);

  useEffect(() => {
    if (!session || session.role !== 'patient' || !page || loadedPage !== page) return undefined;
    refreshAppointmentNotices();
    const timer = setInterval(refreshAppointmentNotices, 30000);
    return () => clearInterval(timer);
  }, [page, loadedPage, session, refreshAppointmentNotices]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.querySelector('.main')?.scrollTo(0, 0);
  }, [page]);

  const value = useMemo(() => ({
    page,
    openPage,
    notify,
    logout,
    menuOpen,
    setMenuOpen,
    pendingAction,
    clearAction,
    medications,
    setMedications,
    labs,
    setLabs,
    vaccines,
    setVaccines,
    documents,
    setDocuments,
    folders,
    setFolders,
    shares,
    setShares,
    recentDocs,
    setRecentDocs,
    reminders,
    appointments,
    setAppointments,
    refreshAppointmentNotices,
    directory,
    setDirectory,
    clinics,
    setClinics,
    profile,
    setProfile,
    loading,
    loadedPage,
    added,
    setAdded,
    session,
    login,
  }), [
    page, openPage, notify, logout, menuOpen, pendingAction, clearAction,
    medications, labs, vaccines, documents, folders, shares, recentDocs,
    reminders, appointments, refreshAppointmentNotices, directory, clinics, profile, loading, loadedPage, added,
    session, login,
  ]);

  return (
    <AppContext.Provider value={value}>
      <Routes>
        <Route path="/login" element={<AuthRoute />} />
        <Route path="/signup" element={<AuthRoute />} />
        <Route path="/forgot-password" element={<AuthRoute />} />
        <Route path="/verify-email" element={<AuthRoute />} />
        <Route path="/reset-password" element={<AuthRoute />} />
        <Route path="/s/:token" element={<SharedReport />} />
        <Route path="/medication/report" element={<MedicationReportPage />} />
        <Route path="/admin" element={<Gate area="admin"><AdminPage /></Gate>} />
        <Route path="/doctor" element={<Gate area="doctor"><DoctorLayout /></Gate>}>
          <Route index element={<DoctorDashboard />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="appointments" element={<DoctorAppointments />} />
        </Route>
        <Route path="/:pageId" element={<Gate area="patient"><AppPage /></Gate>} />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
      {toast && <div className="toast" role="status">{toast}</div>}
    </AppContext.Provider>
  );
}
