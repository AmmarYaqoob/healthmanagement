import { Schema, model } from 'mongoose';
import { collectionOptions } from './helpers';

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, required: true, enum: ['hospital', 'laboratory', 'practice'] },
    active: { type: Boolean, default: true },
  },
  collectionOptions('organizations'),
);

organizationSchema.index({ name: 'text' });

export const Organization = model('Organization', organizationSchema);
