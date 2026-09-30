import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const practitionerSchema = new Schema(
  {
    organizationId: { type: objectId, ref: 'Organization', required: true, index: true },
    userId: { type: objectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  collectionOptions('practitioners'),
);

practitionerSchema.index({ name: 'text' });

export const Practitioner = model('Practitioner', practitionerSchema);
