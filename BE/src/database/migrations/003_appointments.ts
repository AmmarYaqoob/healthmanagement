import type { Db } from 'mongodb';
import { Appointment } from '../../models/appointment.model';
import { collectionValidators } from '../validators';

const NAMESPACE_EXISTS = 48;

function errorCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'number' ? code : undefined;
  }

  return undefined;
}

export const appointmentsMigration = {
  id: '003_appointments',

  async up(db: Db): Promise<void> {
    try {
      await Appointment.createCollection();
    } catch (error) {
      if (errorCode(error) !== NAMESPACE_EXISTS) {
        throw error;
      }
    }

    const validator = collectionValidators.appointments;
    if (validator !== undefined) {
      await db.command({
        collMod: 'appointments',
        validator: { $jsonSchema: validator },
        validationLevel: 'moderate',
        validationAction: 'error',
      });
    }

    await Appointment.createIndexes();
  },
};
