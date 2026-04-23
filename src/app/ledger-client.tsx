'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createExpenseAction,
  settleCurrentMonthAction,
  undoLastSettlementAction,
} from '@/app/actions';
import { logoutAction } from '@/app/login/actions';
import {
  type CreateExpenseInput,
  type FieldErrors,
  type LedgerState,
  type Person,
  formatRand,
  getSettlement,
  people,
  roundCurrency,
  validateExpenseInput,
} from '@/lib/shared-costs';

type LedgerClientProps = {
  initialLedger: LedgerState;
};

export function LedgerClient({ initialLedger }: LedgerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<Person>('Carlo');
  const [carloShare, setCarloShare] = useState('');

  const expenses = initialLedger.expenses;
  const settledMonths = initialLedger.settledMonths;
  const settlement = useMemo(() => getSettlement(expenses), [expenses]);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const numericAmount = Number(amount) || 0;
  const defaultShare = roundCurrency(numericAmount / 2);
  const effectiveCarloShare =
    carloShare === '' ? defaultShare : Number(carloShare) || 0;
  const effectiveWarrenShare = roundCurrency(
    numericAmount - effectiveCarloShare,
  );
  const canSave =
    title.trim().length > 0 &&
    vendor.trim().length > 0 &&
    numericAmount > 0 &&
    effectiveCarloShare >= 0 &&
    effectiveWarrenShare >= 0 &&
    effectiveCarloShare <= numericAmount &&
    !isPending;

  function clearForm() {
    setTitle('');
    setVendor('');
    setAmount('');
    setCarloShare('');
    setPaidBy('Carlo');
    setErrors({});
  }

  function runRefresh(message: string) {
    setStatusMessage(message);
    router.refresh();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreateExpenseInput = {
      title,
      vendor,
      amount: numericAmount,
      paidBy,
      carloShare: effectiveCarloShare,
    };

    const validation = validateExpenseInput(payload);

    if (Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors);
      setStatusMessage('Check the highlighted fields before saving.');
      return;
    }

    startTransition(async () => {
      const result = await createExpenseAction(payload);

      if (!result.ok) {
        setErrors(result.errors);
        setStatusMessage(result.message);
        return;
      }

      clearForm();
      runRefresh(result.message);
    });
  }

  function handleSettleMonth() {
    startTransition(async () => {
      const result = await settleCurrentMonthAction();
      runRefresh(result.message);
    });
  }

  function handleUndoSettle() {
    startTransition(async () => {
      const result = await undoLastSettlementAction();
      runRefresh(result.message);
    });
  }

  return (
    <main className="min-h-screen bg-[oklch(0.96_0.025_89)] text-stone-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
        <header className="grid gap-5 border-b-2 border-stone-900 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
              Carlo / Warren household account
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-normal sm:text-6xl">
              Shared cost ledger
            </h1>
            <p className="mt-3 max-w-xl text-base text-stone-700">
              Add the receipt, adjust the split when needed, and keep the
              monthly settlement obvious.
            </p>
          </div>
          <div className="grid gap-3 sm:min-w-96">
            <form action={logoutAction} className="flex justify-end">
              <button className="min-h-11 border-2 border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-900 transition hover:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100">
                Log out
              </button>
            </form>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="border-2 border-stone-900 bg-[oklch(0.99_0.012_94)] p-4 shadow-[6px_6px_0_oklch(0.18_0.012_75)]">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-stone-600">
                  Recorded
                </p>
                <p className="mt-2 text-2xl font-black">{formatRand(total)}</p>
              </div>
              <div className="border-2 border-stone-900 bg-emerald-700 p-4 text-emerald-50 shadow-[6px_6px_0_oklch(0.18_0.012_75)]">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-emerald-100">
                  To settle
                </p>
                <p className="mt-2 text-2xl font-black">
                  {formatRand(settlement.amount)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <p
          aria-live="polite"
          className="min-h-6 font-medium text-emerald-900"
          role="status"
        >
          {statusMessage}
        </p>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="order-3 border-2 border-stone-900 bg-[oklch(0.99_0.012_94)] p-4 shadow-[8px_8px_0_oklch(0.18_0.012_75)] sm:p-5 lg:order-1">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">Expenses</h2>
              <p className="border border-emerald-800 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
                Default split: 50/50
              </p>
            </div>

            {expenses.length === 0 ? (
              <div className="mt-5 border border-dashed border-stone-400 bg-stone-50 p-6">
                <p className="font-bold">No open expenses.</p>
                <p className="mt-2 text-sm text-stone-700">
                  Add the next receipt to start a fresh monthly ledger.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y-2 divide-stone-200">
                {expenses.map((expense) => (
                  <article key={expense.id} className="grid gap-4 py-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <div>
                        <h3 className="text-lg font-black">{expense.title}</h3>
                        <p className="mt-1 text-sm text-stone-600">
                          {expense.vendor} / paid by {expense.paidBy}
                        </p>
                      </div>
                      <p className="text-xl font-black">
                        {formatRand(expense.amount)}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {people.map((person) => (
                        <div
                          key={person}
                          className="bg-[oklch(0.95_0.018_89)] px-4 py-3 text-sm"
                        >
                          <p className="font-bold">{person} share</p>
                          <p className="mt-1 text-stone-700">
                            {formatRand(expense.shares[person])}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="order-1 flex flex-col gap-6 lg:order-2">
            <form
              className="order-1 border-2 border-stone-900 bg-[oklch(0.99_0.012_94)] p-4 shadow-[8px_8px_0_oklch(0.18_0.012_75)] sm:p-5 lg:order-2"
              onSubmit={handleSubmit}
            >
              <h2 className="text-2xl font-black">New expense</h2>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-bold">
                  What was it?
                  <input
                    aria-describedby={errors.title ? 'title-error' : undefined}
                    aria-invalid={Boolean(errors.title)}
                    className="min-h-11 border-2 border-stone-300 bg-white px-3 py-2 font-normal outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setErrors((currentErrors) => ({
                        ...currentErrors,
                        title: undefined,
                      }));
                    }}
                    placeholder="Rent, groceries, dinner"
                    required
                    value={title}
                  />
                  {errors.title ? (
                    <span
                      className="text-sm font-medium text-red-700"
                      id="title-error"
                    >
                      {errors.title}
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-2 text-sm font-bold">
                  Where was it paid?
                  <input
                    aria-describedby={
                      errors.vendor ? 'vendor-error' : undefined
                    }
                    aria-invalid={Boolean(errors.vendor)}
                    className="min-h-11 border-2 border-stone-300 bg-white px-3 py-2 font-normal outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                    onChange={(event) => {
                      setVendor(event.target.value);
                      setErrors((currentErrors) => ({
                        ...currentErrors,
                        vendor: undefined,
                      }));
                    }}
                    placeholder="Woolworths, Checkers, Eskom"
                    required
                    value={vendor}
                  />
                  {errors.vendor ? (
                    <span
                      className="text-sm font-medium text-red-700"
                      id="vendor-error"
                    >
                      {errors.vendor}
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-2 text-sm font-bold">
                  Total amount
                  <input
                    aria-describedby={
                      errors.amount ? 'amount-error' : undefined
                    }
                    aria-invalid={Boolean(errors.amount)}
                    className="min-h-11 border-2 border-stone-300 bg-white px-3 py-2 font-normal outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                    inputMode="decimal"
                    min="0.01"
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setCarloShare('');
                      setErrors((currentErrors) => ({
                        ...currentErrors,
                        amount: undefined,
                        split: undefined,
                      }));
                    }}
                    placeholder="0.00"
                    required
                    step="0.01"
                    type="number"
                    value={amount}
                  />
                  {errors.amount ? (
                    <span
                      className="text-sm font-medium text-red-700"
                      id="amount-error"
                    >
                      {errors.amount}
                    </span>
                  ) : null}
                </label>

                <fieldset className="grid gap-2">
                  <legend className="text-sm font-bold">Who paid?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {people.map((person) => (
                      <button
                        aria-pressed={paidBy === person}
                        className={`min-h-11 border-2 px-3 py-2 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                          paidBy === person
                            ? 'border-emerald-800 bg-emerald-700 text-white'
                            : 'border-stone-300 bg-white text-stone-800 hover:border-emerald-700'
                        }`}
                        key={person}
                        onClick={() => setPaidBy(person)}
                        type="button"
                      >
                        {person}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <section className="border-2 border-stone-200 bg-[oklch(0.95_0.018_89)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black">Split</h3>
                      <p className="mt-1 text-sm text-stone-700">
                        Warren is calculated from what remains.
                      </p>
                    </div>
                    <button
                      className="min-h-11 border-2 border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-800 transition hover:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      onClick={() => {
                        setCarloShare('');
                        setErrors((currentErrors) => ({
                          ...currentErrors,
                          split: undefined,
                        }));
                      }}
                      type="button"
                    >
                      Reset 50/50
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <label className="grid gap-2 text-sm font-bold">
                      Carlo share
                      <input
                        aria-describedby={
                          errors.split ? 'split-error' : undefined
                        }
                        aria-invalid={Boolean(errors.split)}
                        className="min-h-11 border-2 border-stone-300 bg-white px-3 py-2 font-normal outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                        inputMode="decimal"
                        min="0"
                        max={numericAmount || undefined}
                        onChange={(event) => {
                          setCarloShare(event.target.value);
                          setErrors((currentErrors) => ({
                            ...currentErrors,
                            split: undefined,
                          }));
                        }}
                        placeholder={defaultShare.toFixed(2)}
                        step="0.01"
                        type="number"
                        value={carloShare}
                      />
                    </label>
                    <div className="bg-white px-3 py-2 text-sm">
                      <p className="font-bold">Warren share</p>
                      <p className="mt-1 text-stone-700">
                        {formatRand(effectiveWarrenShare)}
                      </p>
                    </div>
                    {errors.split ? (
                      <p
                        className="text-sm font-medium text-red-700"
                        id="split-error"
                      >
                        {errors.split}
                      </p>
                    ) : null}
                  </div>
                </section>

                <button
                  className="min-h-12 bg-stone-950 px-4 py-3 font-black text-white transition hover:bg-stone-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
                  disabled={!canSave}
                >
                  {isPending ? 'Saving...' : 'Save expense'}
                </button>
              </div>
            </form>

            <section className="order-2 border-2 border-stone-900 bg-[oklch(0.99_0.012_94)] p-4 shadow-[8px_8px_0_oklch(0.18_0.012_75)] sm:p-5 lg:order-1">
              <h2 className="text-2xl font-black">Balance</h2>
              <div className="mt-5 bg-[oklch(0.95_0.018_89)] p-4">
                {settlement.amount === 0 ? (
                  <p className="font-bold">Everything is settled.</p>
                ) : (
                  <>
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-stone-600">
                      Current settlement
                    </p>
                    <p className="mt-2 text-xl font-black">
                      {settlement.payer} pays {settlement.receiver}{' '}
                      {formatRand(settlement.amount)}
                    </p>
                  </>
                )}
              </div>
              <button
                className="mt-4 min-h-12 w-full bg-emerald-700 px-4 py-3 font-black text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-stone-600"
                disabled={expenses.length === 0 || isPending}
                onClick={handleSettleMonth}
                type="button"
              >
                {isPending ? 'Working...' : 'Settle and start next month'}
              </button>
              {initialLedger.canUndoLastSettlement ? (
                <button
                  className="mt-3 min-h-11 w-full border-2 border-stone-300 bg-white px-4 py-2 font-bold text-stone-900 transition hover:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  disabled={isPending}
                  onClick={handleUndoSettle}
                  type="button"
                >
                  Undo last settlement
                </button>
              ) : null}
              {settledMonths > 0 ? (
                <p className="mt-3 text-sm text-stone-600">
                  Settled months: {settledMonths}
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
