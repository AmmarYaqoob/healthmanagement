import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import {
  faBars,
  faChevronDown,
  faFlask,
  faFolder,
  faGear,
  faHeartPulse,
  faHouse,
  faMagnifyingGlass,
  faPills,
  faRightFromBracket,
  faShareNodes,
  faSyringe,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useApp } from '../App';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: faHouse },
  { id: 'medication', label: 'Medication', icon: faPills },
  { id: 'laboratory', label: 'Laboratory', icon: faFlask },
  { id: 'vaccination', label: 'Vaccination', icon: faSyringe },
  { id: 'documents', label: 'Documents', icon: faFolder },
  { id: 'sharing', label: 'Sharing', icon: faShareNodes },
];

function Avatar() {
  return (
    <svg className="avatar" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#F3D2BE" />
      <path d="M10 58c3-16 12-24 22-24s19 8 22 24" fill="#F6DDD0" />
      <circle cx="32" cy="26" r="11" fill="#F6DDD0" />
      <path d="M14 30c1-16 8-24 18-24 8 0 14 5 17 14-6 1-10 5-17 6-8 1-13 0-18 4z" fill="#6A4634" />
      <path d="M18 27c2 8 6 12 14 12s12-4 15-12c-4 3-8 4-15 4s-11-1-14-4z" fill="#7A5340" />
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

export default function Shell({ children }) {
  const {
    page, openPage, logout, menuOpen, setMenuOpen,
    medications, labs, vaccines, documents, recentDocs, reminders, profile,
  } = useApp();
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState(null);

  useEffect(() => {
    setQuery('');
    setPanel(null);
  }, [page]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const items = [
      ...medications.map((item) => ({ title: `${item.name} ${item.dosage}`, meta: 'Medication', page: 'medication' })),
      ...labs.map((item) => ({ title: item.test, meta: 'Laboratory', page: 'laboratory' })),
      ...vaccines.map((item) => ({ title: item.name, meta: 'Vaccination', page: 'vaccination' })),
      ...documents.map((item) => ({ title: item.name, meta: 'Document', page: 'documents' })),
      ...recentDocs.map((item) => ({ title: item.title, meta: 'Document', page: 'documents' })),
      ...NAV.map((item) => ({ title: item.label, meta: 'Page', page: item.id })),
      { title: 'Settings', meta: 'Page', page: 'settings' },
    ];
    return items.filter((item) => item.title.toLowerCase().includes(needle)).slice(0, 7);
  }, [query, medications, labs, vaccines, documents, recentDocs]);

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
              if (results[0]) openPage(results[0].page);
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
              placeholder="Search records, documents, or anything..."
              aria-label="Search records, documents, or anything"
            />
          </form>
          {panel === 'search' && query.trim() && (
            <div className="menu search-results" role="listbox">
              {results.length === 0 && <p className="menu-empty">No matching records</p>}
              {results.map((result, index) => (
                <button
                  type="button"
                  key={`${result.page}-${result.title}-${index}`}
                  onClick={() => openPage(result.page)}
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
            <span className="dot" />
          </button>
          <button
            type="button"
            className="user-btn"
            aria-expanded={panel === 'user'}
            onClick={() => setPanel(panel === 'user' ? null : 'user')}
          >
            <Avatar />
            <strong>{profile?.name || 'Anna Miller'}</strong>
            <FontAwesomeIcon icon={faChevronDown} className="chev" />
          </button>
          {panel === 'bell' && (
            <div className="menu notif-menu">
              <p className="menu-label">Upcoming reminders</p>
              {reminders.map((item) => (
                <button type="button" key={item.id} onClick={() => openPage('dashboard')}>
                  <strong>{item.title}</strong>
                  <span>{item.date}</span>
                </button>
              ))}
            </div>
          )}
          {panel === 'user' && (
            <div className="menu user-menu">
              <button type="button" onClick={() => openPage('settings')}>
                <FontAwesomeIcon icon={faUser} /> Profile
              </button>
              <button type="button" onClick={() => openPage('settings')}>
                <FontAwesomeIcon icon={faGear} /> Settings
              </button>
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
          <nav className="side-nav" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.id}
                to={`/${item.id}`}
                className={page === item.id ? 'nav-link active' : 'nav-link'}
                aria-current={page === item.id ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <nav className="side-nav bottom" aria-label="Settings">
            <Link
              to="/settings"
              className={page === 'settings' ? 'nav-link active' : 'nav-link'}
              aria-current={page === 'settings' ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faGear} />
              <span>Settings</span>
            </Link>
          </nav>
        </aside>
        <main className="main">
          <div className="content">{children}</div>
        </main>
      </div>
    </div>
  );
}
