-- ============================================================
--  ChonaSync — Auth, Audit & Calculator Schema
--  Run this in Supabase SQL Editor
-- ============================================================


-- ── ACCOUNTS ─────────────────────────────────────────────────────────────────
create table if not exists accounts (
  id           uuid primary key default gen_random_uuid(),
  name         text    not null,
  role         text    not null default 'cashier',  -- 'owner' | 'admin' | 'cashier' | 'staff'
  pin_hash     text    not null,                     -- SHA-256 of the 4-digit PIN
  avatar_color text    not null default '#4f46e5',
  is_active    boolean not null default true,
  last_login   timestamptz,
  created_at   timestamptz default now()
);

-- Only active accounts visible to anonymous reads
alter table accounts enable row level security;
create policy "read active accounts" on accounts
  for select using (is_active = true);
create policy "insert accounts" on accounts
  for insert with check (true);
create policy "update accounts" on accounts
  for update using (true);


-- ── AUDIT LOGS ────────────────────────────────────────────────────────────────
create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete set null,
  action     text not null,   -- e.g. 'login', 'logout', 'navigate', 'sale', 'stock_adjust'
  detail     text,
  created_at timestamptz default now()
);

-- Index for fast per-user lookups
create index if not exists idx_audit_logs_account on audit_logs(account_id);
create index if not exists idx_audit_logs_created on audit_logs(created_at desc);

alter table audit_logs enable row level security;
create policy "insert audit logs" on audit_logs for insert with check (true);
create policy "read audit logs"   on audit_logs for select using (true);


-- ── CALCULATOR HISTORY ────────────────────────────────────────────────────────
create table if not exists calculator_history (
  id          uuid primary key default gen_random_uuid(),
  expression  text not null,
  result      text not null,
  created_at  timestamptz default now()
);

alter table calculator_history enable row level security;
create policy "insert calc history" on calculator_history for insert with check (true);
create policy "read calc history"   on calculator_history for select using (true);


-- ── SEED: Default accounts ────────────────────────────────────────────────────
-- PINs are SHA-256 hashed. Default PINs listed below:
--   Owner (Chona)   → PIN: 1234  → hash below
--   Admin           → PIN: 5678
--   Cashier         → PIN: 0000
--
-- To generate a hash for a custom PIN, run in browser console:
--   const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PIN'));
--   console.log([...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''));

insert into accounts (name, role, pin_hash, avatar_color) values
  ('Chona',   'owner',   '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '#9333ea'),
  ('Admin',   'admin',   'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', '#4f46e5'),
  ('Cashier', 'cashier', '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0', '#059669')
on conflict do nothing;

-- Note: PIN 1234 = 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
--       PIN 5678 = ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f
--       PIN 0000 = 9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0


-- ── HELPFUL VIEW: recent activity feed ───────────────────────────────────────
create or replace view activity_feed as
select
  al.id,
  al.created_at,
  al.action,
  al.detail,
  a.name  as user_name,
  a.role  as user_role,
  a.avatar_color
from audit_logs al
left join accounts a on a.id = al.account_id
order by al.created_at desc;

grant select on activity_feed to anon;
grant select on accounts      to anon;
grant select on audit_logs    to anon;
grant insert on audit_logs    to anon;
grant insert on accounts      to anon;
grant update on accounts      to anon;
grant select on calculator_history to anon;
grant insert on calculator_history to anon;
