import { Schema, model } from 'mongoose';
import { collectionOptions } from './helpers';

const clinicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  collectionOptions('clinics'),
);

clinicSchema.index({ name: 'text' });

export const Clinic = model('Clinic', clinicSchema);
