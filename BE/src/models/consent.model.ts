import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const consentSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    userId: { type: objectId, ref: 'User', required: true },
    purpose: { type: String, required: true, enum: ['health-record', 'sharing', 'notifications'] },
    granted: { type: Boolean, required: true },
    policyVersion: { type: String, required: true },
    capturedAt: { type: Date, required: true },
    ipHash: { type: String },
  },
  collectionOptions('consents'),
);

consentSchema.index({ patientId: 1, purpose: 1, capturedAt: -1 });

export const Consent = model('Consent', consentSchema);
