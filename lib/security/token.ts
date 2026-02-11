import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function normalizeToken(value: string): string {
  return value.trim().toUpperCase();
}

function isBcryptHash(value: string): boolean {
  return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function hashToken(value: string): Promise<string> {
  return bcrypt.hash(normalizeToken(value), 12);
}

export async function verifyStoredToken(
  candidateValue: string,
  storedValue: string | null | undefined
): Promise<boolean> {
  if (!storedValue) {
    return false;
  }

  const normalizedCandidate = normalizeToken(candidateValue);
  if (isBcryptHash(storedValue)) {
    return bcrypt.compare(normalizedCandidate, storedValue);
  }

  // Legacy support for existing plaintext tokens before hash-at-rest migration.
  return safeEqual(normalizedCandidate, normalizeToken(storedValue));
}
