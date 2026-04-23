import { loginAction } from '@/app/login/actions';

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const showError = params?.error === 'invalid';

  return (
    <main className="min-h-screen bg-[oklch(0.96_0.025_89)] text-stone-950">
      <section className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8 sm:px-8">
        <div className="w-full border-2 border-stone-900 bg-[oklch(0.99_0.012_94)] p-6 shadow-[8px_8px_0_oklch(0.18_0.012_75)] sm:p-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Shared costs access
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Enter the household passcode
          </h1>
          <p className="mt-3 text-base text-stone-700">
            Only Carlo and Warren should be able to open the ledger or change
            expenses.
          </p>

          <form action={loginAction} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              Passcode
              <input
                autoComplete="current-password"
                className="min-h-12 border-2 border-stone-300 bg-white px-3 py-2 font-normal outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                name="password"
                placeholder="Enter the shared passcode"
                required
                type="password"
              />
            </label>

            {showError ? (
              <p className="text-sm font-medium text-red-700">
                That passcode was not correct.
              </p>
            ) : null}

            <button className="min-h-12 bg-stone-950 px-4 py-3 font-black text-white transition hover:bg-stone-800 focus:outline-none focus:ring-4 focus:ring-emerald-100">
              Unlock ledger
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
