import { LedgerClient } from '@/app/ledger-client';
import { requireAuthenticatedSession } from '@/lib/auth';
import { getLedgerState } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await requireAuthenticatedSession();
  const ledger = await getLedgerState();

  return <LedgerClient initialLedger={ledger} />;
}
