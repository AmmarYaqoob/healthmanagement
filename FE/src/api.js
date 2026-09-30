const API = '/api/v1';

const MED_STATUS = { Active: 'active', Past: 'past', Archived: 'archived' };
const MED_LABEL = { active: 'Active', past: 'Past', archived: 'Archived' };
const LAB_CATEGORY = { Blood: 'blood', Urine: 'urine', Other: 'other' };
const LAB_LABEL = { blood: 'Blood', urine: 'Urine', other: 'Other' };
const VAX_STATUS = { Completed: 'completed', 'Up to date': 'up-to-date', 'Due soon': 'due-soon' };
const VAX_LABEL = { completed: 'Completed', 'up-to-date': 'Up to date', 'due-soon': 'Due soon' };
const VAX_GROUP = { 'COVID-19': 'covid-19', Influenza: 'influenza', Tetanus: 'tetanus', HPV: 'hpv', Other: 'other' };
const VAX_GROUP_LABEL = { 'covid-19': 'COVID-19', influenza: 'Influenza', tetanus: 'Tetanus', hpv: 'HPV', other: 'Other' };
const TONES = ['blue', 'green', 'orange', 'purple', 'red'];
const FOLDER_STYLE = {
  laboratory: { tone: 'red', icon: 'flask' },
  radiology: { tone: 'purple', icon: 'image' },
  prescriptions: { tone: 'red', icon: 'file' },
  letters: { tone: 'blue', icon: 'file' },
  discharge: { tone: 'teal', icon: 'file' },
  vaccination: { tone: 'green', icon: 'file' },
  other: { tone: 'gray', icon: 'folder' },
};
const REMINDER_STYLE = {
  lab: { tone: 'red', icon: 'vial' },
  vaccination: { tone: 'teal', icon: 'syringe' },
  refill: { tone: 'blue', icon: 'pills' },
};
const SHARE_TYPES = {
  medication: 'medication',
  laboratory: 'labResult',
  vaccination: 'immunization',
  documents: 'clinicalDocument',
};

const workspace = {
  patientId: '',
  userId: '',
  patient: null,
  user: null,
  medications: [],
  labs: [],
  vaccines: [],
  documents: [],
  folders: [],
  directory: [],
};

let contextPromise = null;

function displayDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function monthYear(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function toIsoDate(value) {
  if (!value || value === '—') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00.000Z`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}T00:00:00.000Z`;
}

function docIcon(name) {
  const lower = String(name).toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return 'image';
  if (lower.endsWith('.pdf')) return 'pdf';
  return 'file';
}

function docTone(type) {
  if (/lab/i.test(type)) return 'red';
  if (/radio|mri|x-ray/i.test(type)) return 'purple';
  if (/vacc/i.test(type)) return 'green';
  return 'blue';
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the API. Start the backend and try again.');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(body.message || 'Request failed');
  }
  return body.data;
}

function mapMedication(doc, index) {
  return {
    id: doc._id,
    name: doc.name,
    dosage: doc.dosage,
    schedule: doc.schedule,
    start: displayDate(doc.startDate),
    status: MED_LABEL[doc.status] || 'Active',
    tone: TONES[index % TONES.length],
  };
}

function mapLab(doc) {
  return {
    id: doc._id,
    test: doc.test,
    result: doc.result,
    unit: doc.unit,
    range: doc.referenceRange,
    date: displayDate(doc.collectedAt),
    source: doc.source,
    category: LAB_LABEL[doc.category] || 'Other',
  };
}

function mapVaccine(doc) {
  return {
    id: doc._id,
    name: doc.name,
    date: displayDate(doc.administeredAt),
    next: monthYear(doc.nextDueAt),
    status: VAX_LABEL[doc.status] || 'Completed',
    tone: doc.status === 'due-soon' ? 'orange' : 'green',
    category: VAX_GROUP_LABEL[doc.group] || 'Other',
  };
}

function mapFolder(doc) {
  const style = FOLDER_STYLE[doc.slug] || { tone: 'blue', icon: 'folder' };
  return {
    id: doc.slug,
    recordId: doc._id,
    name: doc.name,
    tone: style.tone,
    icon: style.icon,
    base: 0,
  };
}

function mapDocument(doc) {
  const folder = workspace.folders.find((item) => item.recordId === doc.folderId);
  return {
    id: doc._id,
    name: doc.name,
    type: doc.type,
    date: displayDate(doc.authoredAt),
    folder: folder?.id || 'other',
    tone: docTone(doc.type),
    icon: docIcon(doc.name),
  };
}

function mapReminder(doc) {
  const style = REMINDER_STYLE[doc.kind] || { tone: 'blue', icon: 'calendar' };
  return {
    id: doc._id,
    title: doc.title,
    date: displayDate(doc.dueAt),
    tone: style.tone,
    icon: style.icon,
  };
}

function mapShare(doc) {
  return {
    id: doc._id,
    name: doc.granteeSnapshot?.name || 'Shared access',
    role: doc.granteeSnapshot?.role || '',
    until: displayDate(doc.expiresAt),
    tone: doc.granteeType === 'organization' ? 'teal' : 'blue',
  };
}

function toRecent(doc) {
  return {
    id: doc.id,
    title: doc.name.replace(/\.(pdf|jpg|jpeg|png)$/i, ''),
    date: doc.date,
    tone: doc.tone,
    icon: doc.icon,
  };
}

function profileFromContext() {
  const user = workspace.user;
  const patient = workspace.patient;
  return {
    name: user?.name || patient?.displayName || '',
    email: user?.email || '',
    reminders: user?.notifications?.reminders ?? true,
    labs: user?.notifications?.labs ?? true,
    sharing: user?.notifications?.sharing ?? true,
  };
}

function ensureContext() {
  if (workspace.patientId) return Promise.resolve(workspace);
  if (!contextPromise) {
    contextPromise = (async () => {
      const patients = await request('/patients?limit=1');
      const patient = patients?.[0];
      if (!patient) {
        throw new Error('No patient record found. Run the seed command in the BE folder.');
      }
      const users = await request('/users?limit=1');
      workspace.patient = patient;
      workspace.user = users?.[0] || null;
      workspace.patientId = patient._id;
      workspace.userId = workspace.user?._id || '';
      return workspace;
    })().catch((error) => {
      contextPromise = null;
      throw error;
    });
  }
  return contextPromise;
}

async function patientQuery() {
  const current = await ensureContext();
  return `patientId=${current.patientId}&limit=100`;
}

export async function loadMedications() {
  const query = await patientQuery();
  const docs = await request(`/medications?${query}`);
  workspace.medications = (docs || []).map(mapMedication);
  return workspace.medications;
}

export async function loadLabs() {
  const query = await patientQuery();
  const docs = await request(`/lab-results?${query}`);
  workspace.labs = (docs || []).map(mapLab);
  return workspace.labs;
}

export async function loadVaccines() {
  const query = await patientQuery();
  const docs = await request(`/immunizations?${query}`);
  workspace.vaccines = (docs || []).map(mapVaccine);
  return workspace.vaccines;
}

export async function loadDocuments() {
  const query = await patientQuery();
  const folders = await request(`/folders?${query}`);
  const mappedFolders = [
    { id: 'all', name: 'All documents', tone: 'blue', icon: 'folder', base: 0 },
    ...(folders || []).map(mapFolder),
  ];
  workspace.folders = mappedFolders.filter((folder) => folder.id !== 'all');
  const docs = await request(`/clinical-documents?${query}`);
  workspace.documents = (docs || []).map(mapDocument);
  return {
    documents: workspace.documents,
    folders: mappedFolders,
    recentDocs: workspace.documents.slice(0, 4).map(toRecent),
  };
}

export async function loadReminders() {
  const query = await patientQuery();
  const docs = await request(`/reminders?${query}&status=scheduled`);
  return (docs || [])
    .slice()
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .map(mapReminder);
}

export async function loadShares() {
  const query = await patientQuery();
  const docs = await request(`/access-grants?${query}&status=active`);
  return (docs || []).map(mapShare);
}

export async function loadDirectory() {
  await ensureContext();
  const [practitioners, organizations] = await Promise.all([
    request('/practitioners?limit=100&active=true'),
    request('/organizations?limit=100&active=true'),
  ]);
  workspace.directory = [
    ...(practitioners || []).map((person) => ({
      id: person._id,
      kind: 'practitioner',
      name: person.name,
      role: person.role,
    })),
    ...(organizations || []).map((org) => ({
      id: org._id,
      kind: 'organization',
      name: org.name,
      role: { hospital: 'Hospital', laboratory: 'Laboratory', practice: 'Practice' }[org.kind] || 'Practice',
    })),
  ];
  return workspace.directory;
}

export async function loadPage(page) {
  await ensureContext();
  const profile = profileFromContext();

  if (page === 'dashboard') {
    const [medications, labs, vaccines, documents, reminders] = await Promise.all([
      loadMedications(),
      loadLabs(),
      loadVaccines(),
      loadDocuments(),
      loadReminders(),
    ]);
    return { profile, medications, labs, vaccines, ...documents, reminders };
  }

  if (page === 'medication') {
    return { profile, medications: await loadMedications() };
  }

  if (page === 'laboratory') {
    return { profile, labs: await loadLabs() };
  }

  if (page === 'vaccination') {
    return { profile, vaccines: await loadVaccines() };
  }

  if (page === 'documents') {
    return { profile, ...(await loadDocuments()) };
  }

  if (page === 'sharing') {
    const [shares, directory, medications, labs, vaccines, documents] = await Promise.all([
      loadShares(),
      loadDirectory(),
      loadMedications(),
      loadLabs(),
      loadVaccines(),
      loadDocuments(),
    ]);
    return { profile, shares, directory, medications, labs, vaccines, ...documents };
  }

  if (page === 'settings') {
    await ensureContext();
    return { profile: profileFromContext() };
  }

  return { profile };
}

function requireWorkspace() {
  if (!workspace.patientId) {
    throw new Error('Health records are still loading.');
  }
}

export async function createMedication(entry) {
  requireWorkspace();
  const doc = await request('/medications', {
    method: 'POST',
    body: JSON.stringify({
      patientId: workspace.patientId,
      name: entry.name,
      dosage: entry.dosage,
      schedule: entry.schedule,
      startDate: toIsoDate(entry.start),
      status: MED_STATUS[entry.status] || 'active',
      recordStatus: 'active',
    }),
  });
  const mapped = mapMedication(doc, workspace.medications.length);
  workspace.medications = [mapped, ...workspace.medications];
  return mapped;
}

export async function createLab(entry) {
  requireWorkspace();
  const doc = await request('/lab-results', {
    method: 'POST',
    body: JSON.stringify({
      patientId: workspace.patientId,
      test: entry.test,
      result: entry.result,
      unit: entry.unit,
      referenceRange: entry.range,
      category: LAB_CATEGORY[entry.category] || 'other',
      collectedAt: toIsoDate(entry.date),
      source: entry.source,
      recordStatus: 'active',
    }),
  });
  const mapped = mapLab(doc);
  workspace.labs = [mapped, ...workspace.labs];
  return mapped;
}

export async function createVaccine(entry) {
  requireWorkspace();
  const nextDueAt = toIsoDate(entry.next);
  const doc = await request('/immunizations', {
    method: 'POST',
    body: JSON.stringify({
      patientId: workspace.patientId,
      name: entry.name,
      group: VAX_GROUP[entry.category] || 'other',
      administeredAt: toIsoDate(entry.date),
      ...(nextDueAt ? { nextDueAt } : {}),
      status: VAX_STATUS[entry.status] || 'completed',
      recordStatus: 'active',
    }),
  });
  const mapped = mapVaccine(doc);
  workspace.vaccines = [mapped, ...workspace.vaccines];
  return mapped;
}

function replaceCached(list, id, mapped) {
  return list.map((item) => (item.id === id ? mapped : item));
}

export async function updateMedication(id, entry) {
  requireWorkspace();
  const doc = await request(`/medications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: entry.name,
      dosage: entry.dosage,
      schedule: entry.schedule,
      startDate: toIsoDate(entry.start),
      status: MED_STATUS[entry.status] || 'active',
    }),
  });
  const index = Math.max(0, workspace.medications.findIndex((item) => item.id === id));
  const mapped = mapMedication(doc, index);
  workspace.medications = replaceCached(workspace.medications, id, mapped);
  return mapped;
}

export async function updateLab(id, entry) {
  requireWorkspace();
  const doc = await request(`/lab-results/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      test: entry.test,
      result: entry.result,
      unit: entry.unit,
      referenceRange: entry.range,
      category: LAB_CATEGORY[entry.category] || 'other',
      collectedAt: toIsoDate(entry.date),
      source: entry.source,
    }),
  });
  const mapped = mapLab(doc);
  workspace.labs = replaceCached(workspace.labs, id, mapped);
  return mapped;
}

export async function updateVaccine(id, entry) {
  requireWorkspace();
  const nextDueAt = toIsoDate(entry.next);
  const doc = await request(`/immunizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: entry.name,
      group: VAX_GROUP[entry.category] || 'other',
      administeredAt: toIsoDate(entry.date),
      ...(nextDueAt ? { nextDueAt } : {}),
      status: VAX_STATUS[entry.status] || 'completed',
    }),
  });
  const mapped = mapVaccine(doc);
  workspace.vaccines = replaceCached(workspace.vaccines, id, mapped);
  return mapped;
}

export async function createFolder(name) {
  requireWorkspace();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'folder';
  const doc = await request('/folders', {
    method: 'POST',
    body: JSON.stringify({
      patientId: workspace.patientId,
      name,
      slug,
      system: false,
    }),
  });
  const mapped = mapFolder(doc);
  workspace.folders = [...workspace.folders, mapped];
  return mapped;
}

export async function createDocument(entry) {
  requireWorkspace();
  const folder = workspace.folders.find((item) => item.id === entry.folder) || workspace.folders.find((item) => item.id === 'other');
  if (!folder?.recordId) {
    throw new Error('Choose a folder before storing this document.');
  }

  const file = await request('/file-objects', {
    method: 'POST',
    body: JSON.stringify({
      patientId: workspace.patientId,
      storageKey: `patients/${workspace.patientId}/${crypto.randomUUID()}/${entry.name}`,
      bucket: 'healthpass-local',
      fileName: entry.name,
      mimeType: docIcon(entry.name) === 'image' ? 'image/jpeg' : 'application/pdf',
      size: 1,
      sha256: crypto.randomUUID().replace(/-/g, ''),
      scanStatus: 'clean',
    }),
  });
  const doc = await request('/clinical-documents', {
    method: 'POST',
    body: JSON.stringify({
      patientId: workspace.patientId,
      folderId: folder.recordId,
      fileId: file._id,
      name: entry.name,
      type: entry.type,
      authoredAt: toIsoDate(entry.date),
    }),
  });
  const mapped = { ...mapDocument(doc), tone: entry.tone || docTone(entry.type), icon: entry.icon || docIcon(entry.name) };
  workspace.documents = [mapped, ...workspace.documents];
  return mapped;
}

export async function moveDocuments(ids, folderSlug) {
  requireWorkspace();
  const folder = workspace.folders.find((item) => item.id === folderSlug);
  if (!folder?.recordId) {
    throw new Error('That folder is not available.');
  }

  await Promise.all(ids.map((id) => request(`/clinical-documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ folderId: folder.recordId }),
  })));
}

export async function createShare({ person, days, allowDownload, types }) {
  requireWorkspace();
  const known = workspace.directory.find((item) => item.name === person.name);
  const items = types.flatMap((type) => {
    const resourceType = SHARE_TYPES[type];
    const source = {
      medication: workspace.medications,
      laboratory: workspace.labs,
      vaccination: workspace.vaccines,
      documents: workspace.documents,
    }[type];
    const record = source?.[0];
    return resourceType && record ? [{ resourceType, resourceId: record.id }] : [];
  });

  if (items.length === 0) {
    throw new Error('Add a record of the selected type before sharing it.');
  }

  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + days);
  const doc = await request('/access-grants', {
    method: 'POST',
    body: JSON.stringify({
      patientId: workspace.patientId,
      tokenHash: token,
      granteeType: known?.kind || 'practitioner',
      ...(known?.kind === 'organization' ? { granteeOrganizationId: known.id } : {}),
      ...(known?.kind === 'practitioner' ? { granteePractitionerId: known.id } : {}),
      granteeSnapshot: { name: person.name, role: person.role },
      items,
      allowDownload,
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      createdBy: workspace.userId,
    }),
  });

  await request('/access-events', {
    method: 'POST',
    body: JSON.stringify({
      grantId: doc._id,
      patientId: workspace.patientId,
      type: 'created',
      actorUserId: workspace.userId,
      occurredAt: new Date().toISOString(),
    }),
  }).catch(() => undefined);

  return {
    share: mapShare(doc),
    link: `https://healthpassport.app/s/${token.slice(0, 8)}`,
  };
}

export async function revokeShare(id) {
  requireWorkspace();
  await request(`/access-grants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'revoked',
      revokedAt: new Date().toISOString(),
      revokedBy: workspace.userId,
    }),
  });
  await request('/access-events', {
    method: 'POST',
    body: JSON.stringify({
      grantId: id,
      patientId: workspace.patientId,
      type: 'revoked',
      actorUserId: workspace.userId,
      occurredAt: new Date().toISOString(),
    }),
  }).catch(() => undefined);
}

export async function saveSettings(profile) {
  requireWorkspace();
  if (!workspace.userId) {
    throw new Error('No user profile is available to update.');
  }

  const doc = await request(`/users/${workspace.userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: profile.name,
      email: profile.email,
      notifications: {
        reminders: profile.reminders,
        labs: profile.labs,
        sharing: profile.sharing,
      },
    }),
  });

  const saved = {
    name: doc.name,
    email: doc.email,
    reminders: doc.notifications?.reminders ?? profile.reminders,
    labs: doc.notifications?.labs ?? profile.labs,
    sharing: doc.notifications?.sharing ?? profile.sharing,
  };
  workspace.user = {
    ...(workspace.user || {}),
    ...doc,
    notifications: {
      reminders: saved.reminders,
      labs: saved.labs,
      sharing: saved.sharing,
    },
  };
  return saved;
}
