import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { loadPage } from './api';
import { pageMeta } from './data';
import Shell from './components/Shell';
import Dashboard from './pages/Dashboard';
import Medication from './pages/Medication';
import Laboratory from './pages/Laboratory';
import Vaccination from './pages/Vaccination';
import Documents from './pages/Documents';
import Sharing from './pages/Sharing';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

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
  settings: Settings,
};

function pageFromPath(pathname) {
  const id = pathname.replace(/^\//, '');
  return Object.prototype.hasOwnProperty.call(pages, id) ? id : null;
}

function AppPage() {
  const { pageId } = useParams();
  const { loadedPage } = useApp();
  const Page = pages[pageId];
  if (!Page) return <Navigate to="/dashboard" replace />;

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
  const [directory, setDirectory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadedPage, setLoadedPage] = useState(null);
  const [added, setAdded] = useState({ meds: 0, labs: 0, docs: 0 });

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

  const login = useCallback(() => {
    const from = location.state?.from?.pathname;
    navigate(from && pageFromPath(from) ? from : '/dashboard', { replace: true });
  }, [location.state, navigate]);

  const logout = useCallback(() => {
    setMenuOpen(false);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (!page) return;
    document.title = `${pageMeta[page] || 'HealthPassport'} · HealthPassport`;
  }, [page]);

  useEffect(() => {
    if (!page) return undefined;

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
        if (data.shares) setShares(data.shares);
        if (data.directory) setDirectory(data.directory);
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
  }, [page, notify]);

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
    directory,
    profile,
    setProfile,
    loading,
    loadedPage,
    added,
    setAdded,
  }), [
    page, openPage, notify, logout, menuOpen, pendingAction, clearAction,
    medications, labs, vaccines, documents, folders, shares, recentDocs,
    reminders, directory, profile, loading, loadedPage, added,
  ]);

  return (
    <AppContext.Provider value={value}>
      <Routes>
        <Route path="/login" element={<Auth onLogin={login} />} />
        <Route path="/signup" element={<Auth onLogin={login} />} />
        <Route path="/forgot-password" element={<Auth onLogin={login} />} />
        <Route path="/verify-email" element={<Auth onLogin={login} />} />
        <Route path="/reset-password" element={<Auth onLogin={login} />} />
        <Route path="/:pageId" element={<AppPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {toast && <div className="toast" role="status">{toast}</div>}
    </AppContext.Provider>
  );
}
