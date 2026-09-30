import { Schema, model } from 'mongoose';
import { collectionOptions, objectId } from './helpers';

const grantItemSchema = new Schema(
  {
    resourceType: {
      type: String,
      required: true,
      enum: ['medication', 'labResult', 'immunization', 'clinicalDocument'],
    },
    resourceId: { type: objectId, required: true },
  },
  { _id: false },
);

const granteeSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false },
);

const accessGrantSchema = new Schema(
  {
    patientId: { type: objectId, ref: 'Patient', required: true },
    tokenHash: { type: String, required: true, unique: true },
    granteeType: { type: String, required: true, enum: ['practitioner', 'organization'] },
    granteePractitionerId: { type: objectId, ref: 'Practitioner' },
    granteeOrganizationId: { type: objectId, ref: 'Organization' },
    granteeUserId: { type: objectId, ref: 'User' },
    granteeSnapshot: { type: granteeSnapshotSchema, required: true },
    items: { type: [grantItemSchema], required: true },
    allowDownload: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active' },
    revokedAt: { type: Date },
    revokedBy: { type: objectId, ref: 'User' },
    createdBy: { type: objectId, ref: 'User', required: true },
  },
  collectionOptions('accessGrants'),
);

accessGrantSchema.index({ patientId: 1, status: 1, expiresAt: 1 });
accessGrantSchema.index({ granteeUserId: 1, status: 1 });

export const AccessGrant = model('AccessGrant', accessGrantSchema);
