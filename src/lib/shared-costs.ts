export const people = ['Carlo', 'Warren'] as const;

export type Person = (typeof people)[number];

export type Expense = {
  id: number;
  title: string;
  vendor: string;
  paidBy: Person;
  amount: number;
  shares: Record<Person, number>;
};

export type Settlement = {
  amount: number;
  payer: Person;
  receiver: Person;
};

export type LedgerState = {
  expenses: Expense[];
  settledMonths: number;
  canUndoLastSettlement: boolean;
};

export type FieldErrors = Partial<
  Record<'title' | 'vendor' | 'amount' | 'split', string>
>;

export type CreateExpenseInput = {
  title: string;
  vendor: string;
  amount: number;
  paidBy: Person;
  carloShare: number;
};

export function formatRand(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function getSettlement(expenses: Expense[]): Settlement {
  const net = { Carlo: 0, Warren: 0 };

  for (const expense of expenses) {
    net[expense.paidBy] += expense.amount;

    for (const person of people) {
      net[person] -= expense.shares[person];
    }
  }

  const payer = net.Carlo < 0 ? 'Carlo' : 'Warren';
  const receiver = payer === 'Carlo' ? 'Warren' : 'Carlo';
  const amount = Math.abs(net[payer]);

  return { amount, payer, receiver };
}

export function validateExpenseInput(input: CreateExpenseInput) {
  const errors: FieldErrors = {};
  const title = input.title.trim();
  const vendor = input.vendor.trim();
  const amount = roundCurrency(input.amount);
  const carloShare = roundCurrency(input.carloShare);
  const warrenShare = roundCurrency(amount - carloShare);

  if (!title) {
    errors.title = 'Add a short name for this cost.';
  }

  if (!vendor) {
    errors.vendor = 'Add where the money was spent.';
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Enter an amount greater than R0.00.';
  }

  if (!Number.isFinite(carloShare) || carloShare < 0 || carloShare > amount) {
    errors.split = "Carlo's share must be between R0.00 and the total.";
  }

  if (warrenShare < 0) {
    errors.split = "Warren's share cannot be negative. Lower Carlo's share.";
  }

  return {
    errors,
    normalized: {
      title,
      vendor,
      amount,
      carloShare,
      warrenShare,
      paidBy: input.paidBy,
    },
  };
}
