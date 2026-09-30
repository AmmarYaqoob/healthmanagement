import { Schema, model } from 'mongoose';
import { clinicalFields, collectionOptions, objectId } from './helpers';

const medicationSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    schedule: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    status: { type: String, required: true, enum: ['active', 'past', 'archived'] },
    sourceFileId: { type: objectId, ref: 'FileObject' },
    ...clinicalFields,
  },
  collectionOptions('medications'),
);

medicationSchema.index({ patientId: 1, recordStatus: 1, status: 1, startDate: -1 });

export const Medication = model('Medication', medicationSchema);
