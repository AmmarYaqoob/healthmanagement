import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const clinicalDocumentSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    folderId: { type: objectId, ref: 'Folder', required: true },
    fileId: { type: objectId, ref: 'FileObject', required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    authoredAt: { type: Date, required: true },
  },
  collectionOptions('clinicalDocuments'),
);

clinicalDocumentSchema.index({ patientId: 1, folderId: 1, authoredAt: -1 });

export const ClinicalDocument = model('ClinicalDocument', clinicalDocumentSchema);
