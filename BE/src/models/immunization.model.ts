import { Schema, model } from 'mongoose';
import { clinicalFields, collectionOptions, objectId } from './helpers';

const immunizationSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    name: { type: String, required: true, trim: true },
    group: {
      type: String,
      required: true,
      enum: ['covid-19', 'influenza', 'tetanus', 'hpv', 'other'],
    },
    administeredAt: { type: Date, required: true },
    nextDueAt: { type: Date },
    status: { type: String, required: true, enum: ['completed', 'up-to-date', 'due-soon'] },
    ...clinicalFields,
  },
  collectionOptions('immunizations'),
);

immunizationSchema.index({ patientId: 1, recordStatus: 1, group: 1, administeredAt: -1 });

export const Immunization = model('Immunization', immunizationSchema);
