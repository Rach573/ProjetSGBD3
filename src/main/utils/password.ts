import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plain, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export function verifyPassword(plain: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = scryptSync(plain, salt, KEY_LENGTH);
  return timingSafeEqual(expected, derived);
}
