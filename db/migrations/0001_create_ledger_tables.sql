CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  vendor TEXT NOT NULL,
  paid_by TEXT NOT NULL CHECK (paid_by IN ('Carlo', 'Warren')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  carlo_share NUMERIC(12, 2) NOT NULL CHECK (carlo_share >= 0),
  warren_share NUMERIC(12, 2) NOT NULL CHECK (warren_share >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
