'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthenticatedSession } from '@/lib/auth';
import {
  createExpense,
  settleCurrentMonth,
  undoLastSettlement,
} from '@/lib/ledger';
import type { CreateExpenseInput } from '@/lib/shared-costs';

export async function createExpenseAction(input: CreateExpenseInput) {
  await requireAuthenticatedSession();
  const result = await createExpense(input);

  if (result.ok) {
    revalidatePath('/');
  }

  return result;
}

export async function settleCurrentMonthAction() {
  await requireAuthenticatedSession();
  const result = await settleCurrentMonth();

  if (result.ok) {
    revalidatePath('/');
  }

  return result;
}

export async function undoLastSettlementAction() {
  await requireAuthenticatedSession();
  const result = await undoLastSettlement();

  if (result.ok) {
    revalidatePath('/');
  }

  return result;
}
