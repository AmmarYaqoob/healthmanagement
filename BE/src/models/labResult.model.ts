import { Schema, model } from 'mongoose';
import { clinicalFields, collectionOptions, objectId } from './helpers';

const labResultSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    test: { type: String, required: true, trim: true },
    result: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    referenceRange: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['blood', 'urine', 'other'] },
    collectedAt: { type: Date, required: true },
    source: { type: String, required: true, trim: true },
    sourceFileId: { type: objectId, ref: 'FileObject' },
    ...clinicalFields,
  },
  collectionOptions('labResults'),
);

labResultSchema.index({ patientId: 1, recordStatus: 1, category: 1, collectedAt: -1 });

export const LabResult = model('LabResult', labResultSchema);
