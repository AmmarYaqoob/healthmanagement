import type { Db } from 'mongodb';
import { Practitioner } from '../../models/practitioner.model';
import { collectionValidators } from '../validators';

export const practitionerEmailMigration = {
  id: '004_practitioner_email',

  async up(db: Db): Promise<void> {
    const validator = collectionValidators.practitioners;
    if (validator !== undefined) {
      await db.command({
        collMod: 'practitioners',
        validator: { $jsonSchema: validator },
        validationLevel: 'moderate',
        validationAction: 'error',
      });
    }

    await Practitioner.createIndexes();
  },
};
