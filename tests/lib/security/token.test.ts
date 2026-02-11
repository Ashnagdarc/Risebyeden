import { describe, expect, it } from 'vitest';
import { hashToken, verifyStoredToken } from '@/lib/security/token';

describe('security/token', () => {
  it('hashes and verifies tokens case-insensitively', async () => {
    const hash = await hashToken('abc123');

    await expect(verifyStoredToken('abc123', hash)).resolves.toBe(true);
    await expect(verifyStoredToken('AbC123', hash)).resolves.toBe(true);
    await expect(verifyStoredToken('WRONG', hash)).resolves.toBe(false);
  });

  it('supports legacy plaintext stored token verification', async () => {
    await expect(verifyStoredToken('tok-901', 'TOK-901')).resolves.toBe(true);
    await expect(verifyStoredToken('tok-902', 'TOK-901')).resolves.toBe(false);
  });

  it('returns false for missing stored token', async () => {
    await expect(verifyStoredToken('abc', null)).resolves.toBe(false);
    await expect(verifyStoredToken('abc', undefined)).resolves.toBe(false);
  });
});
