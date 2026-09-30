import { scryptSync } from 'crypto';

const SALT = 'healthpass-seed-v1';

export function hashSecret(value: string): string {
  return `scrypt$${SALT}$${scryptSync(value, SALT, 32).toString('hex')}`;
}
