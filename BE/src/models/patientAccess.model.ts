import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const patientAccessSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    userId: { type: objectId, ref: 'User', required: true },
    role: { type: String, required: true, enum: ['owner', 'proxy'] },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  },
  collectionOptions('patientAccess'),
);

patientAccessSchema.index({ patientId: 1, userId: 1 }, { unique: true });
patientAccessSchema.index({ userId: 1, status: 1 });

export const PatientAccess = model('PatientAccess', patientAccessSchema);
