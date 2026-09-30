import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const accessEventSchema = new Schema(
  {
    grantId: { type: objectId, ref: 'AccessGrant', required: true },
    patientId: { type: objectId, ref: 'Patient', required: true },
    type: { type: String, required: true, enum: ['created', 'viewed', 'downloaded', 'revoked'] },
    actorUserId: { type: objectId, ref: 'User' },
    occurredAt: { type: Date, required: true },
    ipHash: { type: String },
  },
  collectionOptions('accessEvents'),
);

accessEventSchema.index({ grantId: 1, occurredAt: -1 });
accessEventSchema.index({ patientId: 1, occurredAt: -1 });

export const AccessEvent = model('AccessEvent', accessEventSchema);
