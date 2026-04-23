const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret() {
  const value = process.env.SHARED_COSTS_SESSION_SECRET;

  if (!value) {
    throw new Error('SHARED_COSTS_SESSION_SECRET is required.');
  }

  return value;
}

async function signMessage(message: string) {
  const secret = getSessionSecret();
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );

  return Buffer.from(signature).toString('base64url');
}

export async function createSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `shared-costs:${expiresAt}`;
  const signature = await signMessage(payload);

  return `${expiresAt}.${signature}`;
}

export async function hasValidSessionToken(token?: string | null) {
  if (!token) {
    return false;
  }

  const [expiresAtRaw, signature] = token.split('.');

  if (!expiresAtRaw || !signature) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expectedSignature = await signMessage(`shared-costs:${expiresAt}`);

  return signature === expectedSignature;
}

export { SESSION_TTL_SECONDS };
