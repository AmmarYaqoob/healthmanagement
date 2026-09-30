type JsonSchema = Record<string, unknown>;

const objectId = { bsonType: 'objectId' };
const date = { bsonType: 'date' };
const str = { bsonType: 'string' };
const bool = { bsonType: 'bool' };
const num = { bsonType: ['int', 'long', 'double'] };

function strEnum(values: string[]): JsonSchema {
  return { bsonType: 'string', enum: values };
}

function doc(required: string[], properties: JsonSchema): JsonSchema {
  return {
    bsonType: 'object',
    required,
    additionalProperties: true,
    properties,
  };
}

const recordStatus = strEnum(['active', 'entered-in-error']);

export const collectionValidators: Record<string, JsonSchema> = {
  users: doc(['email', 'passwordHash', 'name'], {
    email: str,
    passwordHash: str,
    name: str,
    emailVerified: bool,
    status: strEnum(['active', 'locked', 'disabled']),
    failedLoginCount: num,
  }),
  sessions: doc(['userId', 'tokenHash', 'expiresAt'], {
    userId: objectId,
    tokenHash: str,
    expiresAt: date,
    revokedAt: date,
  }),
  authChallenges: doc(['userId', 'email', 'purpose', 'codeHash', 'expiresAt'], {
    userId: objectId,
    email: str,
    purpose: strEnum(['signup', 'reset']),
    codeHash: str,
    attemptCount: num,
    expiresAt: date,
    usedAt: date,
  }),
  patients: doc(['displayName'], {
    displayName: str,
    dateOfBirth: date,
  }),
  patientAccess: doc(['patientId', 'userId', 'role'], {
    patientId: objectId,
    userId: objectId,
    role: strEnum(['owner', 'proxy']),
    status: strEnum(['active', 'revoked']),
  }),
  medications: doc(['patientId', 'name', 'dosage', 'schedule', 'startDate', 'status'], {
    patientId: objectId,
    name: str,
    dosage: str,
    schedule: str,
    startDate: date,
    status: strEnum(['active', 'past', 'archived']),
    sourceFileId: objectId,
    recordStatus,
    replacesId: objectId,
    recordedBy: objectId,
  }),
  labResults: doc(
    ['patientId', 'test', 'result', 'unit', 'referenceRange', 'category', 'collectedAt', 'source'],
    {
      patientId: objectId,
      test: str,
      result: str,
      unit: str,
      referenceRange: str,
      category: strEnum(['blood', 'urine', 'other']),
      collectedAt: date,
      source: str,
      sourceFileId: objectId,
      recordStatus,
      replacesId: objectId,
      recordedBy: objectId,
    },
  ),
  immunizations: doc(['patientId', 'name', 'group', 'administeredAt', 'status'], {
    patientId: objectId,
    name: str,
    group: strEnum(['covid-19', 'influenza', 'tetanus', 'hpv', 'other']),
    administeredAt: date,
    nextDueAt: date,
    status: strEnum(['completed', 'up-to-date', 'due-soon']),
    recordStatus,
    replacesId: objectId,
    recordedBy: objectId,
  }),
  folders: doc(['patientId', 'name', 'slug'], {
    patientId: objectId,
    name: str,
    slug: str,
    system: bool,
  }),
  fileObjects: doc(['patientId', 'storageKey', 'bucket', 'fileName', 'mimeType', 'size', 'sha256'], {
    patientId: objectId,
    storageKey: str,
    bucket: str,
    fileName: str,
    mimeType: str,
    size: { bsonType: ['int', 'long', 'double'] },
    sha256: str,
    scanStatus: strEnum(['pending', 'clean', 'rejected']),
  }),
  clinicalDocuments: doc(['patientId', 'folderId', 'fileId', 'name', 'type', 'authoredAt'], {
    patientId: objectId,
    folderId: objectId,
    fileId: objectId,
    name: str,
    type: str,
    authoredAt: date,
  }),
  reminders: doc(['patientId', 'title', 'dueAt', 'kind'], {
    patientId: objectId,
    title: str,
    dueAt: date,
    kind: strEnum(['lab', 'vaccination', 'refill']),
    status: strEnum(['scheduled', 'done', 'dismissed']),
  }),
  organizations: doc(['name', 'kind'], {
    name: str,
    kind: strEnum(['hospital', 'laboratory', 'practice']),
    active: bool,
  }),
  practitioners: doc(['organizationId', 'name', 'role'], {
    organizationId: objectId,
    userId: objectId,
    name: str,
    role: str,
    active: bool,
  }),
  accessGrants: doc(
    ['patientId', 'tokenHash', 'granteeType', 'granteeSnapshot', 'items', 'expiresAt', 'createdBy'],
    {
      patientId: objectId,
      tokenHash: str,
      granteeType: strEnum(['practitioner', 'organization']),
      granteePractitionerId: objectId,
      granteeOrganizationId: objectId,
      granteeUserId: objectId,
      items: {
        bsonType: 'array',
        minItems: 1,
        maxItems: 200,
        items: doc(['resourceType', 'resourceId'], {
          resourceType: strEnum(['medication', 'labResult', 'immunization', 'clinicalDocument']),
          resourceId: objectId,
        }),
      },
      allowDownload: bool,
      expiresAt: date,
      status: strEnum(['active', 'revoked', 'expired']),
      createdBy: objectId,
    },
  ),
  accessEvents: doc(['grantId', 'patientId', 'type', 'occurredAt'], {
    grantId: objectId,
    patientId: objectId,
    type: strEnum(['created', 'viewed', 'downloaded', 'revoked']),
    actorUserId: objectId,
    occurredAt: date,
    ipHash: str,
  }),
  consents: doc(['patientId', 'userId', 'purpose', 'granted', 'policyVersion', 'capturedAt'], {
    patientId: objectId,
    userId: objectId,
    purpose: strEnum(['health-record', 'sharing', 'notifications']),
    granted: bool,
    policyVersion: str,
    capturedAt: date,
    ipHash: str,
  }),
  deletionRequests: doc(['userId', 'patientId', 'requestedAt'], {
    userId: objectId,
    patientId: objectId,
    requestedAt: date,
    status: strEnum(['pending', 'completed', 'refused']),
    completedAt: date,
    reason: str,
  }),
};
