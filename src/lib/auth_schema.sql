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
  avatar_url   text    default null,                 -- ← profile photo (Supabase Storage public URL)
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
  action     text not null,
  detail     text,
  created_at timestamptz default now()
);

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
--   Owner (Chona)   → PIN: 1234
--   Admin           → PIN: 5678
--   Cashier         → PIN: 0000

insert into accounts (name, role, pin_hash, avatar_color) values
  ('Chona',   'owner',   '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '#9333ea'),
  ('Admin',   'admin',   'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', '#4f46e5'),
  ('Cashier', 'cashier', '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0', '#059669')
on conflict do nothing;


-- ── ACTIVITY VIEW ─────────────────────────────────────────────────────────────
create or replace view activity_feed as
select
  al.id,
  al.created_at,
  al.action,
  al.detail,
  a.name        as user_name,
  a.role        as user_role,
  a.avatar_color,
  a.avatar_url                   -- ← now included in the view
from audit_logs al
left join accounts a on a.id = al.account_id
order by al.created_at desc;

grant select on activity_feed          to anon;
grant select on accounts               to anon;
grant select on audit_logs             to anon;
grant insert on audit_logs             to anon;
grant insert on accounts               to anon;
grant update on accounts               to anon;
grant select on calculator_history     to anon;
grant insert on calculator_history     to anon;


-- ══════════════════════════════════════════════════════════════════════════════
--  STORAGE — "avatars" bucket for profile photos
--  Run these statements in Supabase SQL Editor (they use the storage schema).
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Create a PUBLIC bucket called "avatars"
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Allow anyone to upload to avatars/ (no auth required — matches anon key usage)
create policy "allow anon uploads" on storage.objects
  for insert to anon
  with check (bucket_id = 'avatars');

-- 3. Allow anyone to read/view avatars (public bucket)
create policy "allow public reads" on storage.objects
  for select to anon
  using (bucket_id = 'avatars');

-- 4. Allow anyone to update/replace their own avatar
create policy "allow anon updates" on storage.objects
  for update to anon
  using (bucket_id = 'avatars');

-- 5. Allow deletion (optional — for future photo replacement cleanup)
create policy "allow anon deletes" on storage.objects
  for delete to anon
  using (bucket_id = 'avatars');


-- ══════════════════════════════════════════════════════════════════════════════
--  MIGRATION: Add avatar_url to existing accounts table if already created
--  Run this if you already ran the old schema (the CREATE TABLE above handles
--  new installs; this ALTER handles existing databases).
-- ══════════════════════════════════════════════════════════════════════════════

alter table accounts
  add column if not exists avatar_url text default null;