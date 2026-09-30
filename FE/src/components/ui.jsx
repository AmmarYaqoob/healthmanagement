import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faXmark } from '@fortawesome/free-solid-svg-icons';

export function Tile({ tone = 'blue', icon, small = false }) {
  return (
    <span className={`icon-tile${small ? ' sm' : ''} ${tone}`}>
      <FontAwesomeIcon icon={icon} />
    </span>
  );
}

export function Button({ variant = 'primary', icon, children, className = '', ...props }) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`.trim()} {...props}>
      {icon && <FontAwesomeIcon icon={icon} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Badge({ tone = 'green', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function PageIntro({ title, text, actions }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      {text && <p>{text}</p>}
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Modal({ title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close dialog" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-head">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function DetailModal({ title, rows, onClose, onEdit }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={(
        <>
          {onEdit && <Button variant="ghost" onClick={onEdit}>Edit</Button>}
          <Button onClick={onClose}>Close</Button>
        </>
      )}
    >
      <dl className="detail-grid">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

export function InfoBanner({ icon, title, text, action }) {
  return (
    <aside className="banner">
      <span className="banner-icon" aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div>
        <strong>{title}</strong>
        {text && <p>{text}</p>}
      </div>
      {action}
    </aside>
  );
}

export function ExtractModal({ title, hint, accept = 'image/*,.pdf', fields, confirmLabel = 'Confirm', onClose, onConfirm }) {
  const [fileName, setFileName] = useState('');
  const [values, setValues] = useState(null);

  return (
    <Modal
      title={title}
      subtitle={hint}
      onClose={onClose}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!values}
            onClick={() => onConfirm({ ...values, fileName })}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <label className="dropzone">
        <input
          type="file"
          accept={accept}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setFileName(file.name);
            setValues(fields);
          }}
        />
        <FontAwesomeIcon icon={faUpload} />
        <strong>{fileName || 'Upload a PDF or image'}</strong>
        <span>We’ll extract the relevant fields so you can confirm them.</span>
      </label>
      {values && (
        <div className="form-grid extracted">
          {Object.entries(values).map(([key, value]) => (
            <Field key={key} label={key}>
              <input
                className="input"
                value={value}
                onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
              />
            </Field>
          ))}
        </div>
      )}
    </Modal>
  );
}

export function EmptyNote({ children }) {
  return <p className="empty-note">{children}</p>;
}
