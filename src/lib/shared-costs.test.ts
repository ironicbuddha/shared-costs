import { describe, expect, it } from 'vitest';
import {
  type CreateExpenseInput,
  type Expense,
  getSettlement,
  roundCurrency,
  validateExpenseInput,
} from './shared-costs';

function createExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 1,
    title: 'Groceries',
    vendor: 'Checkers',
    paidBy: 'Carlo',
    amount: 100,
    shares: {
      Carlo: 50,
      Warren: 50,
    },
    ...overrides,
  };
}

function createInput(
  overrides: Partial<CreateExpenseInput> = {},
): CreateExpenseInput {
  return {
    title: ' Groceries ',
    vendor: ' Checkers ',
    amount: 100,
    paidBy: 'Carlo',
    carloShare: 50,
    ...overrides,
  };
}

describe('roundCurrency', () => {
  it('rounds values to two decimal places', () => {
    expect(roundCurrency(12.345)).toBe(12.35);
    expect(roundCurrency(12.344)).toBe(12.34);
  });
});

describe('getSettlement', () => {
  it('returns zero when the ledger is already settled', () => {
    expect(getSettlement([]).amount).toBe(0);
  });

  it('calculates Carlo owing Warren', () => {
    const settlement = getSettlement([
      createExpense({
        paidBy: 'Warren',
        amount: 120,
        shares: {
          Carlo: 60,
          Warren: 60,
        },
      }),
    ]);

    expect(settlement).toEqual({
      amount: 60,
      payer: 'Carlo',
      receiver: 'Warren',
    });
  });

  it('calculates Warren owing Carlo', () => {
    const settlement = getSettlement([
      createExpense({
        amount: 120,
        shares: {
          Carlo: 60,
          Warren: 60,
        },
      }),
    ]);

    expect(settlement).toEqual({
      amount: 60,
      payer: 'Warren',
      receiver: 'Carlo',
    });
  });

  it('supports a full amount allocated to one person', () => {
    const settlement = getSettlement([
      createExpense({
        paidBy: 'Warren',
        shares: {
          Carlo: 100,
          Warren: 0,
        },
      }),
    ]);

    expect(settlement).toEqual({
      amount: 100,
      payer: 'Carlo',
      receiver: 'Warren',
    });
  });
});

describe('validateExpenseInput', () => {
  it('accepts valid input and normalizes trimmed values', () => {
    const result = validateExpenseInput(createInput());

    expect(result.errors).toEqual({});
    expect(result.normalized).toMatchObject({
      title: 'Groceries',
      vendor: 'Checkers',
      amount: 100,
      carloShare: 50,
      warrenShare: 50,
      paidBy: 'Carlo',
    });
  });

  it('requires a description', () => {
    const result = validateExpenseInput(createInput({ title: '   ' }));

    expect(result.errors.title).toBe('Add a short name for this cost.');
  });

  it('rejects zero amounts', () => {
    const result = validateExpenseInput(createInput({ amount: 0 }));

    expect(result.errors.amount).toBe('Enter an amount greater than R0.00.');
  });

  it('rejects Carlo shares that exceed the total', () => {
    const result = validateExpenseInput(createInput({ carloShare: 101 }));

    expect(result.errors.split).toBe(
      "Carlo's share must be between R0.00 and the total.",
    );
  });

  it('allows Carlo to cover the full amount', () => {
    const result = validateExpenseInput(createInput({ carloShare: 100 }));

    expect(result.errors).toEqual({});
    expect(result.normalized).toMatchObject({
      carloShare: 100,
      warrenShare: 0,
    });
  });
});
