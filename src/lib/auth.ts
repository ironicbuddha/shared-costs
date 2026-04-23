import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  createSessionToken,
  hasValidSessionToken,
  SESSION_TTL_SECONDS,
} from '@/lib/session-token';

const SESSION_COOKIE_NAME = 'shared-costs-session';

function getRequiredEnv(
  name: 'SHARED_COSTS_PASSWORD' | 'SHARED_COSTS_SESSION_SECRET',
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export function getSharedCostsPassword() {
  return getRequiredEnv('SHARED_COSTS_PASSWORD');
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return hasValidSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireAuthenticatedSession() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect('/login');
  }
}

export async function createSessionCookie() {
  const cookieStore = await cookies();
  const token = await createSessionToken();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
