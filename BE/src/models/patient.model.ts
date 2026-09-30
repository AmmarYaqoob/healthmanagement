import { Schema, model } from 'mongoose';
import { collectionOptions } from './helpers';

const patientSchema = new Schema(
  {
    displayName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
  },
  collectionOptions('patients'),
);

export const Patient = model('Patient', patientSchema);
