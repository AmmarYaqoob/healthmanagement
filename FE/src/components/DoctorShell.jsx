import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import {
  faBars,
  faCalendarDays,
  faChevronDown,
  faHeartPulse,
  faHouse,
  faMagnifyingGlass,
  faRightFromBracket,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { useApp } from '../App';
import { useDoctor } from '../doctor/DoctorLayout';
import { appointmentsToday, clock, problemSummary } from '../doctor/data';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', to: '/doctor', icon: faHouse },
  { id: 'patients', label: 'Patients', to: '/doctor/patients', icon: faUserGroup },
  { id: 'appointments', label: 'Appointments', to: '/doctor/appointments', icon: faCalendarDays },
];

function currentNav(pathname) {
  if (pathname.startsWith('/doctor/patients')) return 'patients';
  if (pathname.startsWith('/doctor/appointments')) return 'appointments';
  return 'dashboard';
}

function Avatar() {
  return (
    <svg className="avatar" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#D7E6F8" />
      <path d="M10 58c3-16 12-24 22-24s19 8 22 24" fill="#E7F0FB" />
      <circle cx="32" cy="26" r="11" fill="#E7F0FB" />
      <path d="M16 28c2-14 8-20 16-20s14 6 16 20c-5 2-10 3-16 3s-11-1-16-3z" fill="#3E5670" />
    </svg>
  );
}

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <FontAwesomeIcon icon={faHeartPulse} />
      </span>
      <span className="brand-name">HealthPassport</span>
    </div>
  );
}

export default function DoctorShell({ children }) {
  const { logout } = useApp();
  const { profile, patients, appointments } = useDoctor();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const page = currentNav(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState(null);
  const today = appointmentsToday(appointments);

  useEffect(() => {
    setQuery('');
    setPanel(null);
    setMenuOpen(false);
    document.querySelector('.main')?.scrollTo(0, 0);
  }, [pathname]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const items = [
      ...patients.map((item) => ({
        title: item.name,
        meta: problemSummary(item),
        to: '/doctor/patients',
      })),
      ...appointments.map((item) => ({
        title: `${item.patientName} · ${item.title}`,
        meta: 'Appointment',
        to: '/doctor/appointments',
      })),
      ...NAV.map((item) => ({ title: item.label, meta: 'Page', to: item.to })),
    ];
    return items.filter((item) => `${item.title} ${item.meta}`.toLowerCase().includes(needle)).slice(0, 7);
  }, [query, patients, appointments]);

  const closePanels = () => setPanel(null);

  return (
    <div className="app">
      <header className="topbar">
        <button
          type="button"
          className="menu-toggle"
          aria-label="Open navigation"
          onClick={() => setMenuOpen(true)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <Logo />
        <div className="top-search">
          <form
            className="search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              if (results[0]) navigate(results[0].to);
            }}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPanel('search');
              }}
              onFocus={() => setPanel('search')}
              placeholder="Search patients, visits, or pages..."
              aria-label="Search patients, visits, or pages"
            />
          </form>
          {panel === 'search' && query.trim() && (
            <div className="menu search-results" role="listbox">
              {results.length === 0 && <p className="menu-empty">No matching patients or visits</p>}
              {results.map((result, index) => (
                <button
                  type="button"
                  key={`${result.to}-${result.title}-${index}`}
                  onClick={() => navigate(result.to)}
                >
                  <strong>{result.title}</strong>
                  <span>{result.meta}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="bell"
            aria-label="Notifications"
            aria-expanded={panel === 'bell'}
            onClick={() => setPanel(panel === 'bell' ? null : 'bell')}
          >
            <FontAwesomeIcon icon={faBell} />
            {today.length > 0 && <span className="dot" />}
          </button>
          <button
            type="button"
            className="user-btn"
            aria-expanded={panel === 'user'}
            onClick={() => setPanel(panel === 'user' ? null : 'user')}
          >
            <Avatar />
            <strong>{profile.name}</strong>
            <FontAwesomeIcon icon={faChevronDown} className="chev" />
          </button>
          {panel === 'bell' && (
            <div className="menu notif-menu">
              <p className="menu-label">Today’s visits</p>
              {today.length === 0 && <p className="menu-empty">No visits scheduled today</p>}
              {today.map((item) => (
                <button type="button" key={item.id} onClick={() => navigate('/doctor/appointments')}>
                  <strong>{item.patientName}</strong>
                  <span>{clock(item.startsAt)} · {item.title}</span>
                </button>
              ))}
            </div>
          )}
          {panel === 'user' && (
            <div className="menu user-menu">
              <button type="button" onClick={() => { closePanels(); logout(); }}>
                <FontAwesomeIcon icon={faRightFromBracket} /> Sign out
              </button>
            </div>
          )}
        </div>
        {(panel === 'bell' || panel === 'user' || (panel === 'search' && query.trim())) && (
          <button type="button" className="scrim" aria-label="Close menu" onClick={closePanels} />
        )}
      </header>
      <div className="body">
        {menuOpen && (
          <button type="button" className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
        )}
        <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
          <nav className="side-nav" aria-label="Doctor">
            {NAV.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className={page === item.id ? 'nav-link active' : 'nav-link'}
                aria-current={page === item.id ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="main">
          <div className="content">{children}</div>
        </main>
      </div>
    </div>
  );
}
