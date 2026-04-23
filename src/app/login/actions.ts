'use server';

import { redirect } from 'next/navigation';
import {
  clearSessionCookie,
  createSessionCookie,
  getSharedCostsPassword,
} from '@/lib/auth';
import { timingSafeEqualString } from '@/lib/timing-safe';

export async function loginAction(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const expectedPassword = getSharedCostsPassword();

  if (!timingSafeEqualString(password, expectedPassword)) {
    redirect('/login?error=invalid');
  }

  await createSessionCookie();
  redirect('/');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}
