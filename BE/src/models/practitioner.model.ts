import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const practitionerSchema = new Schema(
  {
    organizationId: { type: objectId, ref: 'Organization', required: true, index: true },
    clinicId: { type: objectId, ref: 'Clinic', index: true },
    userId: { type: objectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    role: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  collectionOptions('practitioners'),
);

practitionerSchema.index({ name: 'text' });
practitionerSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);

export const Practitioner = model('Practitioner', practitionerSchema);
