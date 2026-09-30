import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const authChallengeSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, required: true, enum: ['signup', 'reset'] },
    codeHash: { type: String, required: true },
    attemptCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  collectionOptions('authChallenges'),
);

authChallengeSchema.index({ userId: 1, purpose: 1, createdAt: -1 });
authChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthChallenge = model('AuthChallenge', authChallengeSchema);
