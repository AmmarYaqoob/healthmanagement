import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const deletionRequestSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true },
    patientId: { type: objectId, ref: 'Patient', required: true },
    requestedAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'completed', 'refused'], default: 'pending' },
    completedAt: { type: Date },
    reason: { type: String },
  },
  collectionOptions('deletionRequests'),
);

deletionRequestSchema.index({ userId: 1, status: 1 });

export const DeletionRequest = model('DeletionRequest', deletionRequestSchema);
