import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { Button, Field } from '../components/ui';

const titles = {
  '/login': 'Log in',
  '/signup': 'Sign up',
  '/forgot-password': 'Forgot password',
  '/verify-email': 'Email key',
  '/reset-password': 'Reset password',
};

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <FontAwesomeIcon icon={faHeartPulse} />
      </span>
      <span className="brand-name">HealthPassport</span>
    </div>
  );
}

function CodeInputs({ digits, setDigits }) {
  const refs = useRef([]);

  const update = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && refs.current[index + 1]) refs.current[index + 1].focus();
  };

  return (
    <div className="code-row">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => { refs.current[index] = node; }}
          className="code-input"
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${index + 1}`}
          value={digit}
          onChange={(event) => update(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digits[index] && refs.current[index - 1]) {
              refs.current[index - 1].focus();
            }
          }}
        />
      ))}
    </div>
  );
}

export default function Auth({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const purpose = params.get('purpose') === 'reset' ? 'reset' : 'signup';
  const note = location.state?.note || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const screen = location.pathname;

  useEffect(() => {
    document.title = `${titles[screen] || 'HealthPassport'} · HealthPassport`;
  }, [screen]);

  const openCode = (nextPurpose) => {
    setDigits(['', '', '', '', '', '']);
    navigate(`/verify-email?purpose=${nextPurpose}`);
  };

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <Brand />

        {screen === '/login' && (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (onLogin(email)) return;
              setError('That email is not recognized.');
            }}
          >
            <h1>Welcome back</h1>
            <p className="lede">Log in to your HealthPassport.</p>
            {note && <p className="auth-note">{note}</p>}
            <Field label="Email">
              <input
                className="input"
                type="email"
                placeholder="you@healthpassport.com"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                required
              />
            </Field>
            {error && <p className="form-error">{error}</p>}
            <Field label="Password">
              <input className="input" type="password" placeholder="Enter your password" autoComplete="current-password" />
            </Field>
            <div className="auth-row">
              <span />
              <button type="button" className="text-link" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
            </div>
            <Button type="submit">Log in</Button>
            <p className="auth-switch">
              New to HealthPassport?{' '}
              <button type="button" className="text-link" onClick={() => navigate('/signup')}>Sign up</button>
            </p>
          </form>
        )}

        {screen === '/signup' && (
          <form className="auth-form" onSubmit={(event) => { event.preventDefault(); openCode('signup'); }}>
            <h1>Create your account</h1>
            <p className="lede">Keep your records, medications, and results in one place.</p>
            <Field label="Full name">
              <input className="input" placeholder="Anna Miller" autoComplete="name" />
            </Field>
            <Field label="Email">
              <input className="input" type="email" placeholder="anna.miller@email.com" autoComplete="email" />
            </Field>
            <Field label="Password">
              <input className="input" type="password" placeholder="Create a password" autoComplete="new-password" />
            </Field>
            <Field label="Confirm password">
              <input className="input" type="password" placeholder="Repeat your password" autoComplete="new-password" />
            </Field>
            <Button type="submit">Create account</Button>
            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="text-link" onClick={() => navigate('/login')}>Log in</button>
            </p>
          </form>
        )}

        {screen === '/forgot-password' && (
          <form className="auth-form" onSubmit={(event) => { event.preventDefault(); openCode('reset'); }}>
            <h1>Forgot password</h1>
            <p className="lede">We’ll email you a 6-digit key to reset your password.</p>
            <Field label="Email">
              <input className="input" type="email" placeholder="anna.miller@email.com" autoComplete="email" />
            </Field>
            <Button type="submit">Send email key</Button>
            <p className="auth-switch">
              <button type="button" className="text-link" onClick={() => navigate('/login')}>Back to log in</button>
            </p>
          </form>
        )}

        {screen === '/verify-email' && (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (purpose === 'reset') navigate('/reset-password');
              else navigate('/login', { state: { note: 'Account created. Log in with your email to continue.' } });
            }}
          >
            <h1>Enter your email key</h1>
            <p className="lede">
              {purpose === 'reset'
                ? 'Enter the 6-digit key we sent so you can choose a new password.'
                : 'Enter the 6-digit key we sent to confirm your email.'}
            </p>
            <CodeInputs digits={digits} setDigits={setDigits} />
            <Button type="submit">Continue</Button>
            <p className="auth-switch">
              <button type="button" className="text-link" onClick={() => setDigits(['', '', '', '', '', ''])}>Resend key</button>
              {' · '}
              <button type="button" className="text-link" onClick={() => navigate(purpose === 'reset' ? '/forgot-password' : '/signup')}>Back</button>
            </p>
          </form>
        )}

        {screen === '/reset-password' && (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              navigate('/login', { state: { note: 'Your password was updated. Log in to continue.' } });
            }}
          >
            <h1>Reset password</h1>
            <p className="lede">Choose a new password for your HealthPassport account.</p>
            <Field label="New password">
              <input className="input" type="password" placeholder="New password" autoComplete="new-password" />
            </Field>
            <Field label="Confirm password">
              <input className="input" type="password" placeholder="Repeat the new password" autoComplete="new-password" />
            </Field>
            <Button type="submit">Reset password</Button>
            <p className="auth-switch">
              <button type="button" className="text-link" onClick={() => navigate('/login')}>Back to log in</button>
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
