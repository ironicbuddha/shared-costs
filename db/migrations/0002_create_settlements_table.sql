CREATE TABLE IF NOT EXISTS settlements (
  id BIGSERIAL PRIMARY KEY,
  total NUMERIC(12, 2) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payer TEXT NOT NULL CHECK (payer IN ('Carlo', 'Warren')),
  receiver TEXT NOT NULL CHECK (receiver IN ('Carlo', 'Warren')),
  expense_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reverted_at TIMESTAMPTZ
);
