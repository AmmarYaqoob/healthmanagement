import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const fileObjectSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    storageKey: { type: String, required: true },
    bucket: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    sha256: { type: String, required: true },
    scanStatus: { type: String, enum: ['pending', 'clean', 'rejected'], default: 'pending' },
  },
  collectionOptions('fileObjects'),
);

fileObjectSchema.index({ patientId: 1, storageKey: 1 }, { unique: true });

export const FileObject = model('FileObject', fileObjectSchema);
