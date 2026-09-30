import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const folderSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    system: { type: Boolean, default: false },
  },
  collectionOptions('folders'),
);

folderSchema.index({ patientId: 1, slug: 1 }, { unique: true });

export const Folder = model('Folder', folderSchema);
