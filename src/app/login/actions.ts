'use server';

import { timingSafeEqual } from 'node:crypto';
import { redirect } from 'next/navigation';
import {
  clearSessionCookie,
  createSessionCookie,
  getSharedCostsPassword,
} from '@/lib/auth';

function safeCompare(input: string, expected: string) {
  const left = Buffer.from(input);
  const right = Buffer.from(expected);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const expectedPassword = getSharedCostsPassword();

  if (!safeCompare(password, expectedPassword)) {
    redirect('/login?error=invalid');
  }

  await createSessionCookie();
  redirect('/');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}
