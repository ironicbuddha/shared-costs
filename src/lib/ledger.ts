import { getSql } from '@/lib/db';
import {
  type CreateExpenseInput,
  type Expense,
  type LedgerState,
  type Person,
  getSettlement,
  validateExpenseInput,
} from '@/lib/shared-costs';

type ExpenseRow = {
  id: number;
  title: string;
  vendor: string;
  paid_by: Person;
  amount: string;
  carlo_share: string;
  warren_share: string;
};

type SettlementRow = {
  id: number;
  expense_snapshot: Expense[];
  reverted_at: string | null;
};

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: Number(row.id),
    title: row.title,
    vendor: row.vendor,
    paidBy: row.paid_by,
    amount: Number(row.amount),
    shares: {
      Carlo: Number(row.carlo_share),
      Warren: Number(row.warren_share),
    },
  };
}

export async function getLedgerState(): Promise<LedgerState> {
  const sql = getSql();

  const transactionResults = (await sql.transaction([
    sql`
      SELECT id, title, vendor, paid_by, amount, carlo_share, warren_share
      FROM expenses
      ORDER BY created_at DESC, id DESC
    `,
    sql`
      SELECT COUNT(*)::text AS count
      FROM settlements
      WHERE reverted_at IS NULL
    `,
    sql`
      SELECT id, expense_snapshot, reverted_at
      FROM settlements
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
  ])) as [ExpenseRow[], { count: string }[], SettlementRow[]];

  const [expenseRows, settlementCountRows, latestSettlementRows] =
    transactionResults;

  const expenses = expenseRows.map(mapExpense);
  const settledMonths = Number(settlementCountRows[0]?.count ?? '0');
  const latestSettlement = latestSettlementRows[0];
  const canUndoLastSettlement =
    expenses.length === 0 &&
    Boolean(latestSettlement) &&
    latestSettlement.reverted_at === null;

  return {
    expenses,
    settledMonths,
    canUndoLastSettlement,
  };
}

export async function createExpense(input: CreateExpenseInput) {
  const sql = getSql();
  const { errors, normalized } = validateExpenseInput(input);

  if (Object.keys(errors).length > 0) {
    return {
      ok: false as const,
      errors,
      message: 'Check the highlighted fields before saving.',
    };
  }

  await sql`
    INSERT INTO expenses (title, vendor, paid_by, amount, carlo_share, warren_share)
    VALUES (
      ${normalized.title},
      ${normalized.vendor},
      ${normalized.paidBy},
      ${normalized.amount},
      ${normalized.carloShare},
      ${normalized.warrenShare}
    )
  `;

  return {
    ok: true as const,
    message: `${normalized.title} saved. Balance updated.`,
  };
}

export async function settleCurrentMonth() {
  const sql = getSql();
  const expenseRows = (await sql`
    SELECT id, title, vendor, paid_by, amount, carlo_share, warren_share
    FROM expenses
    ORDER BY created_at DESC, id DESC
  `) as ExpenseRow[];
  const expenses = expenseRows.map(mapExpense);

  if (expenses.length === 0) {
    return {
      ok: false as const,
      message: 'There are no open expenses to settle.',
    };
  }

  const settlement = getSettlement(expenses);
  const total = expenses.reduce(
    (sum: number, expense: Expense) => sum + expense.amount,
    0,
  );

  await sql.transaction([
    sql`
      INSERT INTO settlements (
        total,
        amount,
        payer,
        receiver,
        expense_snapshot
      )
      VALUES (
        ${total},
        ${settlement.amount},
        ${settlement.payer},
        ${settlement.receiver},
        ${JSON.stringify(expenses)}::jsonb
      )
    `,
    sql`DELETE FROM expenses`,
  ]);

  return {
    ok: true as const,
    message: `Month settled. ${settlement.payer} paid ${settlement.receiver}.`,
  };
}

export async function undoLastSettlement() {
  const sql = getSql();

  const transactionResults = (await sql.transaction([
    sql`SELECT COUNT(*)::text AS count FROM expenses`,
    sql`
      SELECT id, expense_snapshot, reverted_at
      FROM settlements
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
  ])) as [{ count: string }[], SettlementRow[]];

  const [expenseCountRows, latestSettlementRows] = transactionResults;

  const openExpenseCount = Number(expenseCountRows[0]?.count ?? '0');
  const latestSettlement = latestSettlementRows[0];

  if (!latestSettlement || latestSettlement.reverted_at !== null) {
    return {
      ok: false as const,
      message: 'There is no settlement left to undo.',
    };
  }

  if (openExpenseCount > 0) {
    return {
      ok: false as const,
      message: 'Clear the current ledger before undoing the last settlement.',
    };
  }

  const snapshot = latestSettlement.expense_snapshot as Expense[];

  await sql.transaction([
    ...snapshot.map((expense) => {
      const { title, vendor, paidBy, amount, shares } = expense;

      return sql`
        INSERT INTO expenses (title, vendor, paid_by, amount, carlo_share, warren_share)
        VALUES (
          ${title},
          ${vendor},
          ${paidBy},
          ${amount},
          ${shares.Carlo},
          ${shares.Warren}
        )
      `;
    }),
    sql`
      UPDATE settlements
      SET reverted_at = NOW()
      WHERE id = ${latestSettlement.id}
    `,
  ]);

  return {
    ok: true as const,
    message: 'Settlement undone. Expenses are back in the ledger.',
  };
}
