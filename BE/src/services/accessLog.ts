import { createHash } from 'crypto';
import { AccessEvent } from '../models/accessEvent.model';

export type AccessLogType = 'created' | 'viewed' | 'downloaded' | 'revoked';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isDuplicate(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

export async function appendAccessEvent(input: {
  grantId: string;
  patientId: string;
  tokenHash: string;
  type: AccessLogType;
  actorUserId?: string;
  visited?: boolean;
}): Promise<void> {
  const grantId = String(input.grantId);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const last = await AccessEvent
      .findOne({ grantId, entryHash: { $type: 'string' } })
      .sort({ seq: -1 })
      .lean();
    const seq = (typeof last?.seq === 'number' ? last.seq : 0) + 1;
    const prevHash = last?.entryHash || sha256(`grant:${grantId}`);
    const entryHash = sha256(`${prevHash}|${grantId}|${input.tokenHash}|${input.type}|${seq}`);

    try {
      await AccessEvent.create({
        grantId,
        patientId: input.patientId,
        type: input.type,
        ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
        occurredAt: new Date(),
        prevHash,
        entryHash,
        seq,
        visited: Boolean(input.visited),
      });
      return;
    } catch (error) {
      if (isDuplicate(error) && attempt < 4) {
        continue;
      }
      throw error;
    }
  }
}
