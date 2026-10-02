import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../config/logger';
import {
  AccessEvent,
  AccessGrant,
  AuthChallenge,
  Clinic,
  ClinicalDocument,
  Consent,
  DeletionRequest,
  FileObject,
  Folder,
  Immunization,
  LabResult,
  Medication,
  Organization,
  Patient,
  PatientAccess,
  Practitioner,
  Reminder,
  Session,
  User,
} from '../models';
import { hashSecret } from './hash';

const id = (value: string) => new Types.ObjectId(value);

const ids = {
  user: id('665f0a0000000000000000a1'),
  patient: id('665f0a0000000000000000b1'),
  access: id('665f0a0000000000000000c1'),
  consent: id('665f0a0000000000000000d1'),
  practice: id('665f0a0000000000000000e1'),
  klinikum: id('665f0a0000000000000000e2'),
  mvz: id('665f0a0000000000000000e3'),
  julia: id('665f0a0000000000000000f1'),
  markus: id('665f0a0000000000000000f2'),
  clinics: {
    charite: id('665f0a000000000000001001'),
    neukoelln: id('665f0a000000000000001002'),
    helios: id('665f0a000000000000001003'),
    westend: id('665f0a000000000000001004'),
    juedisches: id('665f0a000000000000001005'),
    ukb: id('665f0a000000000000001006'),
  },
  practitioners: [
    id('665f0a000000000000001101'),
    id('665f0a000000000000001102'),
    id('665f0a000000000000001103'),
    id('665f0a000000000000001104'),
    id('665f0a000000000000001105'),
    id('665f0a000000000000001106'),
    id('665f0a000000000000001107'),
    id('665f0a000000000000001108'),
    id('665f0a000000000000001109'),
    id('665f0a00000000000000110a'),
    id('665f0a00000000000000110b'),
  ],
  meds: [
    id('665f0a000000000000000101'),
    id('665f0a000000000000000102'),
    id('665f0a000000000000000103'),
    id('665f0a000000000000000104'),
    id('665f0a000000000000000105'),
  ],
  labs: [
    id('665f0a000000000000000201'),
    id('665f0a000000000000000202'),
    id('665f0a000000000000000203'),
    id('665f0a000000000000000204'),
    id('665f0a000000000000000205'),
  ],
  vaccines: [
    id('665f0a000000000000000301'),
    id('665f0a000000000000000302'),
    id('665f0a000000000000000303'),
    id('665f0a000000000000000304'),
    id('665f0a000000000000000305'),
  ],
  folders: {
    laboratory: id('665f0a000000000000000401'),
    radiology: id('665f0a000000000000000402'),
    prescriptions: id('665f0a000000000000000403'),
    letters: id('665f0a000000000000000404'),
    discharge: id('665f0a000000000000000405'),
    vaccination: id('665f0a000000000000000406'),
    other: id('665f0a000000000000000407'),
  },
  files: [
    id('665f0a000000000000000501'),
    id('665f0a000000000000000502'),
    id('665f0a000000000000000503'),
    id('665f0a000000000000000504'),
    id('665f0a000000000000000505'),
    id('665f0a000000000000000506'),
  ],
  documents: [
    id('665f0a000000000000000601'),
    id('665f0a000000000000000602'),
    id('665f0a000000000000000603'),
    id('665f0a000000000000000604'),
    id('665f0a000000000000000605'),
    id('665f0a000000000000000606'),
  ],
  reminders: [
    id('665f0a000000000000000701'),
    id('665f0a000000000000000702'),
    id('665f0a000000000000000703'),
  ],
  grants: [id('665f0a000000000000000801'), id('665f0a000000000000000802')],
  events: [id('665f0a000000000000000901'), id('665f0a000000000000000902')],
};

function day(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function at<T>(items: readonly T[], index: number): T {
  const value = items[index];
  if (value === undefined) {
    throw new Error(`Missing seed value at index ${index}`);
  }
  return value;
}

async function clearDemo(): Promise<void> {
  const patientId = ids.patient;
  const userId = ids.user;

  await AccessEvent.deleteMany({ patientId });
  await AccessGrant.deleteMany({ patientId });
  await Reminder.deleteMany({ patientId });
  await ClinicalDocument.deleteMany({ patientId });
  await FileObject.deleteMany({ patientId });
  await Folder.deleteMany({ patientId });
  await Immunization.deleteMany({ patientId });
  await LabResult.deleteMany({ patientId });
  await Medication.deleteMany({ patientId });
  await Consent.deleteMany({ patientId });
  await DeletionRequest.deleteMany({ patientId });
  await PatientAccess.deleteMany({ patientId });
  await Patient.deleteMany({ _id: patientId });
  await Session.deleteMany({ userId });
  await AuthChallenge.deleteMany({ userId });
  await User.deleteMany({ _id: userId });
  await Practitioner.deleteMany({
    _id: { $in: [ids.julia, ids.markus, ...ids.practitioners] },
  });
  await Clinic.deleteMany({ _id: { $in: Object.values(ids.clinics) } });
  await Organization.deleteMany({ _id: { $in: [ids.practice, ids.klinikum, ids.mvz] } });
}

async function seed(): Promise<void> {
  await connectDatabase();
  await clearDemo();

  const recordedBy = ids.user;

  await User.create({
    _id: ids.user,
    email: 'anna.miller@email.com',
    emailVerified: true,
    passwordHash: hashSecret('HealthPass123!'),
    name: 'Anna Miller',
    notifications: { reminders: true, labs: true, sharing: true },
    status: 'active',
  });

  await Patient.create({
    _id: ids.patient,
    displayName: 'Anna Miller',
    dateOfBirth: day('1994-06-12'),
  });

  await PatientAccess.create({
    _id: ids.access,
    patientId: ids.patient,
    userId: ids.user,
    role: 'owner',
    status: 'active',
  });

  await Consent.create({
    _id: ids.consent,
    patientId: ids.patient,
    userId: ids.user,
    purpose: 'health-record',
    granted: true,
    policyVersion: '2026-09-30',
    capturedAt: day('2026-09-30'),
  });

  await Organization.create([
    { _id: ids.practice, name: 'Praxis Schneider', kind: 'practice', active: true },
    { _id: ids.klinikum, name: 'Klinikum Berlin', kind: 'hospital', active: true },
    { _id: ids.mvz, name: 'MVZ Mitte', kind: 'laboratory', active: true },
  ]);

  await Clinic.create([
    { _id: ids.clinics.charite, name: 'Charité – Universitätsmedizin Berlin', district: 'Mitte', active: true },
    { _id: ids.clinics.neukoelln, name: 'Vivantes Klinikum Neukölln', district: 'Neukölln', active: true },
    { _id: ids.clinics.helios, name: 'Helios Klinikum Berlin-Buch', district: 'Pankow', active: true },
    { _id: ids.clinics.westend, name: 'DRK Kliniken Berlin Westend', district: 'Charlottenburg-Wilmersdorf', active: true },
    { _id: ids.clinics.juedisches, name: 'Jüdisches Krankenhaus Berlin', district: 'Mitte', active: true },
    { _id: ids.clinics.ukb, name: 'Unfallkrankenhaus Berlin', district: 'Marzahn-Hellersdorf', active: true },
  ]);

  const doctor = (
    _id: (typeof ids.practitioners)[number],
    clinicId: (typeof ids.clinics)[keyof typeof ids.clinics],
    name: string,
    email: string,
    role: string,
  ) => ({
    _id,
    clinicId,
    organizationId: ids.klinikum,
    name,
    email,
    role,
    active: true,
  });

  await Practitioner.create([
    {
      _id: ids.julia,
      organizationId: ids.practice,
      clinicId: ids.clinics.charite,
      name: 'Dr. Julia Schneider',
      email: 'julia.schneider@charite.example',
      role: 'General Practitioner',
      active: true,
    },
    {
      _id: ids.markus,
      organizationId: ids.klinikum,
      clinicId: ids.clinics.charite,
      name: 'Dr. Markus Weber',
      email: 'markus.weber@charite.example',
      role: 'Cardiologist',
      active: true,
    },
    doctor(at(ids.practitioners, 0), ids.clinics.charite, 'Dr. Sabine Krüger', 'sabine.krueger@charite.example', 'Neurologist'),
    doctor(at(ids.practitioners, 1), ids.clinics.neukoelln, 'Dr. Lena Vogel', 'lena.vogel@vivantes.example', 'Dermatologist'),
    doctor(at(ids.practitioners, 2), ids.clinics.neukoelln, 'Dr. Felix Hartmann', 'felix.hartmann@vivantes.example', 'Orthopedist'),
    doctor(at(ids.practitioners, 3), ids.clinics.helios, 'Dr. Petra Neumann', 'petra.neumann@helios.example', 'Pediatrician'),
    doctor(at(ids.practitioners, 4), ids.clinics.helios, 'Dr. Oliver Stein', 'oliver.stein@helios.example', 'Pulmonologist'),
    doctor(at(ids.practitioners, 5), ids.clinics.westend, 'Dr. Claudia Richter', 'claudia.richter@drk.example', 'Gynecologist'),
    doctor(at(ids.practitioners, 6), ids.clinics.westend, 'Dr. Henrik Wolf', 'henrik.wolf@drk.example', 'Surgeon'),
    doctor(at(ids.practitioners, 7), ids.clinics.juedisches, 'Dr. Miriam Goldstein', 'miriam.goldstein@jkb.example', 'Internist'),
    doctor(at(ids.practitioners, 8), ids.clinics.juedisches, 'Dr. David Levy', 'david.levy@jkb.example', 'Gastroenterologist'),
    doctor(at(ids.practitioners, 9), ids.clinics.ukb, 'Dr. Jonas Keller', 'jonas.keller@ukb.example', 'Trauma Surgeon'),
    doctor(at(ids.practitioners, 10), ids.clinics.ukb, 'Dr. Eva Brandt', 'eva.brandt@ukb.example', 'Anesthesiologist'),
  ]);

  const meds = ids.meds;
  await Medication.create([
    {
      _id: at(meds, 0),
      patientId: ids.patient,
      name: 'Metformin',
      dosage: '500 mg',
      schedule: '1-0-1 (morning & evening)',
      startDate: day('2024-01-01'),
      status: 'active',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(meds, 1),
      patientId: ids.patient,
      name: 'Lisinopril',
      dosage: '10 mg',
      schedule: '1-0-0 (morning)',
      startDate: day('2024-02-15'),
      status: 'active',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(meds, 2),
      patientId: ids.patient,
      name: 'Atorvastatin',
      dosage: '20 mg',
      schedule: '0-0-1 (evening)',
      startDate: day('2024-03-10'),
      status: 'active',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(meds, 3),
      patientId: ids.patient,
      name: 'Omeprazole',
      dosage: '20 mg',
      schedule: '1-0-0 (morning)',
      startDate: day('2023-11-01'),
      status: 'past',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(meds, 4),
      patientId: ids.patient,
      name: 'Ibuprofen',
      dosage: '400 mg',
      schedule: '1-0-1 (as needed)',
      startDate: day('2023-08-12'),
      status: 'past',
      recordStatus: 'active',
      recordedBy,
    },
  ]);

  await LabResult.create([
    {
      _id: at(ids.labs, 0),
      patientId: ids.patient,
      test: 'Hemoglobin',
      result: '13.8',
      unit: 'g/dL',
      referenceRange: '12.0 - 16.0',
      category: 'blood',
      collectedAt: day('2025-04-12'),
      source: 'Lab Berlin',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(ids.labs, 1),
      patientId: ids.patient,
      test: 'White Blood Cells',
      result: '6.2',
      unit: '10^9/L',
      referenceRange: '4.0 - 10.0',
      category: 'blood',
      collectedAt: day('2025-04-12'),
      source: 'Lab Berlin',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(ids.labs, 2),
      patientId: ids.patient,
      test: 'CRP',
      result: '2.3',
      unit: 'mg/L',
      referenceRange: '< 5.0',
      category: 'blood',
      collectedAt: day('2025-03-10'),
      source: 'MVZ Mitte',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(ids.labs, 3),
      patientId: ids.patient,
      test: 'Vitamin D (25-OH)',
      result: '28.5',
      unit: 'ng/mL',
      referenceRange: '30.0 - 100.0',
      category: 'blood',
      collectedAt: day('2025-03-10'),
      source: 'Lab Berlin',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(ids.labs, 4),
      patientId: ids.patient,
      test: 'Cholesterol (total)',
      result: '198',
      unit: 'mg/dL',
      referenceRange: '< 200',
      category: 'blood',
      collectedAt: day('2025-02-05'),
      source: 'MVZ Mitte',
      recordStatus: 'active',
      recordedBy,
    },
  ]);

  await Immunization.create([
    {
      _id: at(ids.vaccines, 0),
      patientId: ids.patient,
      name: 'COVID-19 (Booster)',
      group: 'covid-19',
      administeredAt: day('2021-03-15'),
      status: 'completed',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(ids.vaccines, 1),
      patientId: ids.patient,
      name: 'Influenza',
      group: 'influenza',
      administeredAt: day('2024-10-22'),
      nextDueAt: day('2025-10-01'),
      status: 'due-soon',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(ids.vaccines, 2),
      patientId: ids.patient,
      name: 'Tetanus',
      group: 'tetanus',
      administeredAt: day('2019-01-12'),
      nextDueAt: day('2029-01-12'),
      status: 'up-to-date',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(ids.vaccines, 3),
      patientId: ids.patient,
      name: 'Hepatitis B',
      group: 'other',
      administeredAt: day('2018-09-10'),
      status: 'completed',
      recordStatus: 'active',
      recordedBy,
    },
    {
      _id: at(ids.vaccines, 4),
      patientId: ids.patient,
      name: 'HPV',
      group: 'hpv',
      administeredAt: day('2015-09-05'),
      status: 'completed',
      recordStatus: 'active',
      recordedBy,
    },
  ]);

  await Folder.create([
    { _id: ids.folders.laboratory, patientId: ids.patient, name: 'Laboratory reports', slug: 'laboratory', system: true },
    { _id: ids.folders.radiology, patientId: ids.patient, name: 'Radiology reports', slug: 'radiology', system: true },
    { _id: ids.folders.prescriptions, patientId: ids.patient, name: 'Prescriptions', slug: 'prescriptions', system: true },
    { _id: ids.folders.letters, patientId: ids.patient, name: 'Medical letters', slug: 'letters', system: true },
    { _id: ids.folders.discharge, patientId: ids.patient, name: 'Discharge summaries', slug: 'discharge', system: true },
    { _id: ids.folders.vaccination, patientId: ids.patient, name: 'Vaccination', slug: 'vaccination', system: true },
    { _id: ids.folders.other, patientId: ids.patient, name: 'Other', slug: 'other', system: true },
  ]);

  const files = [
    ['Blood test report.pdf', 'application/pdf', ids.folders.laboratory, 'Lab report', '2025-04-12'],
    ['Chest X-ray.jpg', 'image/jpeg', ids.folders.radiology, 'Radiology', '2025-04-05'],
    ['Prescription - Amoxicillin.pdf', 'application/pdf', ids.folders.prescriptions, 'Prescription', '2025-04-15'],
    ['Discharge summary.pdf', 'application/pdf', ids.folders.discharge, 'Medical letter', '2025-02-20'],
    ['Vaccination certificate.pdf', 'application/pdf', ids.folders.vaccination, 'Vaccination', '2025-03-28'],
    ['MRI report.pdf', 'application/pdf', ids.folders.radiology, 'Radiology', '2025-01-10'],
  ] as const;

  await FileObject.create(
    files.map((file, index) => ({
      _id: at(ids.files, index),
      patientId: ids.patient,
      storageKey: `patients/${ids.patient.toHexString()}/${file[0]}`,
      bucket: 'healthpass-local',
      fileName: file[0],
      mimeType: file[1],
      size: 120000 + index,
      sha256: hashSecret(file[0]),
      scanStatus: 'clean',
    })),
  );

  await ClinicalDocument.create(
    files.map((file, index) => ({
      _id: at(ids.documents, index),
      patientId: ids.patient,
      folderId: file[2],
      fileId: at(ids.files, index),
      name: file[0],
      type: file[3],
      authoredAt: day(file[4]),
    })),
  );

  const atorvastatinId = at(meds, 2);
  const influenzaId = at(ids.vaccines, 1);
  await Reminder.create([
    {
      _id: at(ids.reminders, 0),
      patientId: ids.patient,
      title: 'Blood test (fasting)',
      dueAt: day('2025-04-15'),
      kind: 'lab',
      status: 'scheduled',
    },
    {
      _id: at(ids.reminders, 1),
      patientId: ids.patient,
      title: 'Vaccination - Influenza',
      dueAt: day('2025-06-20'),
      kind: 'vaccination',
      status: 'scheduled',
      source: { collection: 'immunizations', id: influenzaId },
    },
    {
      _id: at(ids.reminders, 2),
      patientId: ids.patient,
      title: 'Medication refill - Atorvastatin',
      dueAt: day('2025-04-28'),
      kind: 'refill',
      status: 'scheduled',
      source: { collection: 'medications', id: atorvastatinId },
    },
  ]);

  await AccessGrant.create([
    {
      _id: at(ids.grants, 0),
      patientId: ids.patient,
      tokenHash: hashSecret('seed-share-julia'),
      granteeType: 'practitioner',
      granteePractitionerId: ids.julia,
      granteeSnapshot: { name: 'Dr. Julia Schneider', role: 'General Practitioner' },
      items: [
        { resourceType: 'medication', resourceId: at(meds, 0) },
        { resourceType: 'medication', resourceId: at(meds, 1) },
        { resourceType: 'medication', resourceId: at(meds, 2) },
      ],
      allowDownload: false,
      expiresAt: day('2025-04-14'),
      status: 'active',
      createdBy: ids.user,
    },
    {
      _id: at(ids.grants, 1),
      patientId: ids.patient,
      tokenHash: hashSecret('seed-share-klinikum'),
      granteeType: 'organization',
      granteeOrganizationId: ids.klinikum,
      granteeSnapshot: { name: 'Klinikum Berlin', role: 'Hospital · Specialist' },
      items: [
        { resourceType: 'labResult', resourceId: at(ids.labs, 0) },
        { resourceType: 'clinicalDocument', resourceId: at(ids.documents, 0) },
        { resourceType: 'clinicalDocument', resourceId: at(ids.documents, 1) },
      ],
      allowDownload: false,
      expiresAt: day('2025-04-30'),
      status: 'active',
      createdBy: ids.user,
    },
  ]);

  await AccessEvent.create([
    {
      _id: at(ids.events, 0),
      grantId: at(ids.grants, 0),
      patientId: ids.patient,
      type: 'created',
      actorUserId: ids.user,
      occurredAt: day('2025-04-07'),
    },
    {
      _id: at(ids.events, 1),
      grantId: at(ids.grants, 1),
      patientId: ids.patient,
      type: 'created',
      actorUserId: ids.user,
      occurredAt: day('2025-04-01'),
    },
  ]);

  logger.info('Seed complete', { email: 'anna.miller@email.com' });
}

void seed()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown seed error';
    logger.error('Seed failed', { message });
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
