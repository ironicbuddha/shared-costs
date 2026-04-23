import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSessionToken,
  hasValidSessionToken,
  SESSION_TTL_SECONDS,
} from './session-token';

describe('session tokens', () => {
  const originalSecret = process.env.SHARED_COSTS_SESSION_SECRET;

  beforeEach(() => {
    process.env.SHARED_COSTS_SESSION_SECRET = 'test-session-secret';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();

    if (originalSecret === undefined) {
      delete process.env.SHARED_COSTS_SESSION_SECRET;
      return;
    }

    process.env.SHARED_COSTS_SESSION_SECRET = originalSecret;
  });

  it('creates tokens with the configured ttl', async () => {
    const token = await createSessionToken();
    const [expiresAtRaw, signature] = token.split('.');

    expect(signature).toBeTruthy();
    expect(Number(expiresAtRaw)).toBe(Date.now() + SESSION_TTL_SECONDS * 1000);
  });

  it('accepts a valid token', async () => {
    const token = await createSessionToken();

    await expect(hasValidSessionToken(token)).resolves.toBe(true);
  });

  it('rejects an expired token', async () => {
    const token = await createSessionToken();

    vi.advanceTimersByTime(SESSION_TTL_SECONDS * 1000 + 1);

    await expect(hasValidSessionToken(token)).resolves.toBe(false);
  });

  it('rejects malformed tokens', async () => {
    await expect(hasValidSessionToken('malformed')).resolves.toBe(false);
    await expect(
      hasValidSessionToken('not-a-timestamp.signature'),
    ).resolves.toBe(false);
  });

  it('rejects tampered signatures, including length mismatches', async () => {
    const token = await createSessionToken();
    const [expiresAtRaw, signature] = token.split('.');
    const tamperedSignature = `${signature}a`;
    const modifiedSignature = `${signature.slice(0, -1)}${
      signature.endsWith('a') ? 'b' : 'a'
    }`;

    await expect(
      hasValidSessionToken(`${expiresAtRaw}.${tamperedSignature}`),
    ).resolves.toBe(false);
    await expect(
      hasValidSessionToken(`${expiresAtRaw}.${modifiedSignature}`),
    ).resolves.toBe(false);
  });
});
