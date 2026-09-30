import type { Db } from 'mongodb';
import { allModels } from '../../models';
import { collectionValidators } from '../validators';

const NAMESPACE_EXISTS = 48;

function errorCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'number' ? code : undefined;
  }

  return undefined;
}

export const initialMigration = {
  id: '001_initial',

  async up(db: Db): Promise<void> {
    for (const model of allModels) {
      const name = model.collection.name;

      try {
        await model.createCollection();
      } catch (error) {
        if (errorCode(error) !== NAMESPACE_EXISTS) {
          throw error;
        }
      }

      const validator = collectionValidators[name];
      if (validator !== undefined) {
        await db.command({
          collMod: name,
          validator: { $jsonSchema: validator },
          validationLevel: 'moderate',
          validationAction: 'error',
        });
      }

      await model.createIndexes();
    }
  },
};
