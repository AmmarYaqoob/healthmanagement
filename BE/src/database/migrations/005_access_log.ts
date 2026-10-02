import type { Db } from 'mongodb';
import { AccessEvent } from '../../models/accessEvent.model';
import { AccessGrant } from '../../models/accessGrant.model';
import { collectionValidators } from '../validators';

async function applyValidator(db: Db, name: string): Promise<void> {
  const validator = collectionValidators[name];
  if (validator === undefined) {
    return;
  }

  await db.command({
    collMod: name,
    validator: { $jsonSchema: validator },
    validationLevel: 'moderate',
    validationAction: 'error',
  });
}

export const accessLogMigration = {
  id: '005_access_log',

  async up(db: Db): Promise<void> {
    await applyValidator(db, 'accessGrants');
    await applyValidator(db, 'accessEvents');
    await AccessGrant.createIndexes();
    await AccessEvent.createIndexes();
  },
};
