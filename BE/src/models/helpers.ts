import { Schema } from 'mongoose';

export const objectId = Schema.Types.ObjectId;

const schemaOptions = { timestamps: true, versionKey: false } as const;

export function collectionOptions(collection: string) {
  return { ...schemaOptions, collection };
}

export const clinicalFields = {
  recordStatus: { type: String, enum: ['active', 'entered-in-error'], default: 'active' },
  replacesId: { type: objectId },
  recordedBy: { type: objectId, ref: 'User' },
};

export interface MigratableModel {
  collection: { name: string };
  createCollection(): Promise<unknown>;
  createIndexes(): Promise<unknown>;
}
