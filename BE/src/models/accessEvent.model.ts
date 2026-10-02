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
    prevHash: { type: String },
    entryHash: { type: String },
    seq: { type: Number },
    visited: { type: Boolean, default: false },
  },
  collectionOptions('accessEvents'),
);

accessEventSchema.index({ grantId: 1, occurredAt: -1 });
accessEventSchema.index({ patientId: 1, occurredAt: -1 });
accessEventSchema.index(
  { grantId: 1, seq: 1 },
  { unique: true, partialFilterExpression: { seq: { $type: 'number' } } },
);
accessEventSchema.index(
  { entryHash: 1 },
  { unique: true, partialFilterExpression: { entryHash: { $type: 'string' } } },
);

export const AccessEvent = model('AccessEvent', accessEventSchema);
