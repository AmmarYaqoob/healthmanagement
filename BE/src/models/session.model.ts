import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const sessionSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  collectionOptions('sessions'),
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model('Session', sessionSchema);
