const ACCOUNTS = {
  'admin@healthpassport.com': { role: 'admin', home: '/admin' },
  'ammar@healthpassport.com': { role: 'patient', home: '/dashboard' },
  'dr.umair@healthpassport.com': { role: 'doctor', home: '/doctor' },
};

const STORAGE_KEY = 'healthpassport.account';

export function accountForEmail(email) {
  const key = String(email || '').trim().toLowerCase();
  const account = ACCOUNTS[key];
  if (!account) return null;
  return { email: key, role: account.role, home: account.home };
}

export function homeFor(session) {
  if (!session) return '/login';
  return accountForEmail(session.email)?.home || '/login';
}

export function readSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const account = accountForEmail(parsed?.email);
    if (!account || account.role !== parsed.role) return null;
    return { email: account.email, role: account.role };
  } catch {
    return null;
  }
}

export function writeSession(email) {
  const account = accountForEmail(email);
  if (!account) return null;
  const session = { email: account.email, role: account.role };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}
