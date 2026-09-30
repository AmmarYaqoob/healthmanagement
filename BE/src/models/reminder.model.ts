import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const reminderSourceSchema = new Schema(
  {
    collection: { type: String, required: true },
    id: { type: objectId, required: true },
  },
  { _id: false },
);

const reminderSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    title: { type: String, required: true, trim: true },
    dueAt: { type: Date, required: true },
    kind: { type: String, required: true, enum: ['lab', 'vaccination', 'refill'] },
    source: { type: reminderSourceSchema },
    status: { type: String, enum: ['scheduled', 'done', 'dismissed'], default: 'scheduled' },
  },
  collectionOptions('reminders'),
);

reminderSchema.index({ patientId: 1, status: 1, dueAt: 1 });

export const Reminder = model('Reminder', reminderSchema);
