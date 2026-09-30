import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faCircleInfo,
  faFileImage,
  faFileLines,
  faFilePdf,
  faFlask,
  faFolder,
  faFolderOpen,
  faFolderPlus,
  faMagnifyingGlass,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { createDocument, createFolder as storeFolder, moveDocuments } from '../api';
import { formatDate, matches } from '../data';
import { useApp } from '../App';
import { Button, EmptyNote, ExtractModal, Field, InfoBanner, Modal, PageIntro, Tile } from '../components/ui';

const ICONS = {
  pdf: faFilePdf,
  image: faFileImage,
  file: faFileLines,
  flask: faFlask,
  folder: faFolder,
};

const emptyUpload = { name: '', type: 'Lab report', date: '2026-09-30', folder: 'laboratory' };

export default function Documents() {
  const {
    documents, setDocuments, folders, setFolders, setRecentDocs, setAdded,
    pendingAction, clearAction, notify,
  } = useApp();
  const [folderId, setFolderId] = useState('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [creating, setCreating] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [upload, setUpload] = useState(emptyUpload);
  const [error, setError] = useState('');
  const [moveFolder, setMoveFolder] = useState('laboratory');
  const [picked, setPicked] = useState([]);
  const [seenAction, setSeenAction] = useState(null);

  if (pendingAction !== seenAction) {
    setSeenAction(pendingAction);
    if (pendingAction === 'upload' || pendingAction === 'scan') setModal(pendingAction);
  }

  useEffect(() => {
    if (pendingAction) clearAction();
  }, [pendingAction, clearAction]);

  const current = folders.find((folder) => folder.id === folderId) || folders[0] || {
    id: 'all',
    name: 'All documents',
  };
  const shown = documents.filter((doc) => {
    if (folderId !== 'all' && doc.folder !== folderId) return false;
    return matches(query, doc.name, doc.type, doc.date);
  });

  const countFor = (folder) => (
    documents.filter((doc) => folder.id === 'all' || doc.folder === folder.id).length
  );

  const addDocument = async (entry) => {
    try {
      const doc = await createDocument(entry);
      setDocuments((currentDocs) => [doc, ...currentDocs]);
      setRecentDocs((currentDocs) => [{
        id: doc.id,
        title: doc.name.replace(/\.(pdf|jpg|jpeg|png)$/i, ''),
        date: doc.date,
        tone: doc.tone,
        icon: doc.icon,
      }, ...currentDocs]);
      setAdded((currentAdded) => ({ ...currentAdded, docs: currentAdded.docs + 1 }));
      setModal(null);
      setUpload(emptyUpload);
      notify(`${doc.name} stored`);
    } catch (err) {
      setError(err.message);
      notify(err.message);
    }
  };

  const createFolder = async (event) => {
    event.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    try {
      const folder = await storeFolder(name);
      setFolders((currentFolders) => [...currentFolders, folder]);
      setFolderName('');
      setCreating(false);
      setFolderId(folder.id);
      notify(`Folder “${name}” created`);
    } catch (err) {
      notify(err.message);
    }
  };

  const saveUpload = (event) => {
    event.preventDefault();
    if (!upload.name.trim()) {
      setError('Enter a document name or choose a file.');
      return;
    }
    addDocument({
      name: upload.name.trim(),
      type: upload.type,
      date: formatDate(upload.date),
      folder: upload.folder,
      icon: upload.name.toLowerCase().endsWith('.jpg') ? 'image' : 'pdf',
      tone: 'blue',
    });
  };

  return (
    <>
      <PageIntro
        title="Medical Document Storage"
        text="A central place for all medical records, findings and diagnoses. Upload, scan, extract, confirm and organize your documents."
        actions={(
          <>
            <Button icon={faUpload} onClick={() => { setError(''); setModal('upload'); }}>Upload document</Button>
            <Button variant="ghost" icon={faCamera} onClick={() => setModal('scan')}>Scan document</Button>
            <Button variant="ghost" icon={faFolderOpen} onClick={() => { setPicked([]); setModal('organize'); }}>Organize</Button>
          </>
        )}
      />

      <div className="docs-layout">
        <section className="card">
          <header className="card-head"><h2>Folders</h2></header>
          <ul className="folder-list">
            {folders.map((folder) => (
              <li key={folder.id}>
                <button
                  type="button"
                  className={folder.id === folderId ? 'folder active' : 'folder'}
                  onClick={() => setFolderId(folder.id)}
                >
                  <Tile small tone={folder.tone} icon={ICONS[folder.icon] || faFolder} />
                  <span>{folder.name}</span>
                  <span className="count">{countFor(folder)}</span>
                </button>
              </li>
            ))}
          </ul>
          {creating ? (
            <form className="new-folder-form" onSubmit={createFolder}>
              <input className="input" autoFocus value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="Folder name" aria-label="Folder name" />
              <Button type="submit">Add</Button>
            </form>
          ) : (
            <button type="button" className="folder-add" onClick={() => setCreating(true)}>
              <FontAwesomeIcon icon={faFolderPlus} /> New folder
            </button>
          )}
        </section>

        <section className="card">
          <header className="card-head">
            <h2>{current.name}</h2>
            <label className="mini-search">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <span className="sr-only">Search documents</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." />
            </label>
          </header>
          <div className="file-head" aria-hidden="true">
            <span />
            <span>Name</span>
            <span>Type</span>
            <span>Date</span>
          </div>
          {shown.length === 0 ? (
            <EmptyNote>This folder is empty.</EmptyNote>
          ) : (
            <ul className="file-list">
              {shown.map((doc) => (
                <li key={doc.id} className="file-row">
                  <Tile small tone={doc.tone} icon={ICONS[doc.icon] || faFileLines} />
                  <strong>{doc.name}</strong>
                  <span className="file-type">{doc.type}</span>
                  <span className="file-date">{doc.date}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <InfoBanner
        icon={faCircleInfo}
        title="Never lose important documents."
        text="We extract key information and keep everything organized and secure."
      />

      {modal === 'upload' && (
        <Modal
          title="Upload document"
          subtitle="Store a PDF or image in one of your folders."
          onClose={() => setModal(null)}
          footer={(
            <>
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={saveUpload}>Save document</Button>
            </>
          )}
        >
          <form className="form-grid" onSubmit={saveUpload}>
            <label className="dropzone span-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setUpload((currentUpload) => ({ ...currentUpload, name: file.name }));
                }}
              />
              <FontAwesomeIcon icon={faUpload} />
              <strong>{upload.name || 'Choose a file'}</strong>
              <span>PDF, JPG, or PNG</span>
            </label>
            <Field label="Name"><input className="input" value={upload.name} onChange={(event) => setUpload({ ...upload, name: event.target.value })} /></Field>
            <Field label="Type">
              <select className="input" value={upload.type} onChange={(event) => setUpload({ ...upload, type: event.target.value })}>
                <option>Lab report</option>
                <option>Radiology</option>
                <option>Prescription</option>
                <option>Medical letter</option>
                <option>Vaccination</option>
              </select>
            </Field>
            <Field label="Date"><input className="input" type="date" value={upload.date} onChange={(event) => setUpload({ ...upload, date: event.target.value })} /></Field>
            <Field label="Folder">
              <select className="input" value={upload.folder} onChange={(event) => setUpload({ ...upload, folder: event.target.value })}>
                {folders.filter((folder) => folder.id !== 'all').map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </Field>
          </form>
          {error && <p className="form-error">{error}</p>}
        </Modal>
      )}

      {modal === 'scan' && (
        <ExtractModal
          title="Scan document"
          hint="Photograph a record. Confirm the name and type before it is filed."
          fields={{
            Name: 'Scanned record.pdf',
            Type: 'Medical letter',
            Date: '30 Sep 2026',
          }}
          onClose={() => setModal(null)}
          onConfirm={(values) => addDocument({
            name: values.Name,
            type: values.Type,
            date: values.Date,
            folder: 'letters',
            icon: 'pdf',
            tone: 'blue',
          })}
        />
      )}

      {modal === 'organize' && (
        <Modal
          title="Organize documents"
          subtitle="Move records into a folder."
          onClose={() => setModal(null)}
          footer={(
            <>
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                disabled={picked.length === 0}
                onClick={() => {
                  moveDocuments(picked, moveFolder)
                    .then(() => {
                      setDocuments((currentDocs) => currentDocs.map((doc) => (
                        picked.includes(doc.id) ? { ...doc, folder: moveFolder } : doc
                      )));
                      setModal(null);
                      notify('Documents moved');
                    })
                    .catch((err) => notify(err.message));
                }}
              >
                Move
              </Button>
            </>
          )}
        >
          <Field label="Destination folder">
            <select className="input" value={moveFolder} onChange={(event) => setMoveFolder(event.target.value)}>
              {folders.filter((folder) => folder.id !== 'all').map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </Field>
          <ul className="folder-list">
            {documents.map((doc) => (
              <li key={doc.id}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={picked.includes(doc.id)}
                    onChange={() => setPicked((currentPicked) => (
                      currentPicked.includes(doc.id)
                        ? currentPicked.filter((id) => id !== doc.id)
                        : [...currentPicked, doc.id]
                    ))}
                  />
                  {doc.name}
                </label>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  );
}
