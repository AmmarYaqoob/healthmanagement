import type { MigratableModel } from './helpers';
import { AccessEvent } from './accessEvent.model';
import { AccessGrant } from './accessGrant.model';
import { AuthChallenge } from './authChallenge.model';
import { ClinicalDocument } from './clinicalDocument.model';
import { Consent } from './consent.model';
import { DeletionRequest } from './deletionRequest.model';
import { FileObject } from './fileObject.model';
import { Folder } from './folder.model';
import { Immunization } from './immunization.model';
import { LabResult } from './labResult.model';
import { Medication } from './medication.model';
import { Organization } from './organization.model';
import { Patient } from './patient.model';
import { PatientAccess } from './patientAccess.model';
import { Practitioner } from './practitioner.model';
import { Reminder } from './reminder.model';
import { Session } from './session.model';
import { User } from './user.model';

export {
  AccessEvent,
  AccessGrant,
  AuthChallenge,
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
};

export const allModels: MigratableModel[] = [
  User,
  Session,
  AuthChallenge,
  Patient,
  PatientAccess,
  Medication,
  LabResult,
  Immunization,
  Folder,
  FileObject,
  ClinicalDocument,
  Reminder,
  Organization,
  Practitioner,
  AccessGrant,
  AccessEvent,
  Consent,
  DeletionRequest,
];
