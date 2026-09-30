import { Schema, model } from 'mongoose';
import { collectionOptions } from './helpers';

const notificationSchema = new Schema(
  {
    reminders: { type: Boolean, default: true },
    labs: { type: Boolean, default: true },
    sharing: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    passwordHash: { type: String, required: true },
    passwordChangedAt: { type: Date },
    name: { type: String, required: true, trim: true },
    notifications: { type: notificationSchema, default: () => ({}) },
    status: { type: String, enum: ['active', 'locked', 'disabled'], default: 'active' },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  collectionOptions('users'),
);

export const User = model('User', userSchema);
