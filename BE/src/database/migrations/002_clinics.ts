import type { Db } from 'mongodb';
import { Clinic } from '../../models/clinic.model';
import { Practitioner } from '../../models/practitioner.model';
import { collectionValidators } from '../validators';

const NAMESPACE_EXISTS = 48;

function errorCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'number' ? code : undefined;
  }

  return undefined;
}

export const clinicsMigration = {
  id: '002_clinics',

  async up(db: Db): Promise<void> {
    try {
      await Clinic.createCollection();
    } catch (error) {
      if (errorCode(error) !== NAMESPACE_EXISTS) {
        throw error;
      }
    }

    const clinicsValidator = collectionValidators.clinics;
    if (clinicsValidator !== undefined) {
      await db.command({
        collMod: 'clinics',
        validator: { $jsonSchema: clinicsValidator },
        validationLevel: 'moderate',
        validationAction: 'error',
      });
    }

    const practitionersValidator = collectionValidators.practitioners;
    if (practitionersValidator !== undefined) {
      await db.command({
        collMod: 'practitioners',
        validator: { $jsonSchema: practitionersValidator },
        validationLevel: 'moderate',
        validationAction: 'error',
      });
    }

    await Clinic.createIndexes();
    await Practitioner.createIndexes();
  },
};
