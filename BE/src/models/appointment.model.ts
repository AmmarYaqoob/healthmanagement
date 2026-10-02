import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const appointmentSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    title: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    location: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['upcoming', 'cancelled'], default: 'upcoming' },
    notifyAt: { type: Date, required: true },
    notifiedAt: { type: Date },
  },
  collectionOptions('appointments'),
);

appointmentSchema.index({ patientId: 1, status: 1, startsAt: 1 });

export const Appointment = model('Appointment', appointmentSchema);
