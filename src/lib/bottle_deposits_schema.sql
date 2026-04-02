-- ============================================================
--  ChonaSync — Bottle Deposits Schema
--  Run this in your Supabase SQL Editor
-- ============================================================


-- ── TABLE ─────────────────────────────────────────────────────────────────────
create table if not exists bottle_deposits (
  id                  uuid          primary key default gen_random_uuid(),
  customer_name       text          not null,
  contact             text,
  bottle_type         text          not null,
  bottle_size         text          not null,
  qty                 integer       not null default 1 check (qty > 0),
  deposit_per_bottle  numeric(10,2) not null default 0 check (deposit_per_bottle >= 0),
  total_deposit       numeric(10,2) not null default 0,
  notes               text,
  status              text          not null default 'borrowed'
                        check (status in ('borrowed', 'partially_returned', 'returned')),
  returned_qty        integer       not null default 0 check (returned_qty >= 0),
  date_borrowed       date          not null default current_date,
  due_date            date,                                          -- ← NEW: expected return date
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);


-- ── INDEXES ───────────────────────────────────────────────────────────────────
create index if not exists idx_bottle_deposits_status     on bottle_deposits(status);
create index if not exists idx_bottle_deposits_created    on bottle_deposits(created_at desc);
create index if not exists idx_bottle_deposits_customer   on bottle_deposits(customer_name);
create index if not exists idx_bottle_deposits_borrowed   on bottle_deposits(date_borrowed desc);
create index if not exists idx_bottle_deposits_due_date   on bottle_deposits(due_date);        -- ← NEW


-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
alter table bottle_deposits enable row level security;

create policy "read bottle deposits"
  on bottle_deposits for select using (true);

create policy "insert bottle deposits"
  on bottle_deposits for insert with check (true);

create policy "update bottle deposits"
  on bottle_deposits for update using (true);

create policy "delete bottle deposits"
  on bottle_deposits for delete using (true);


-- ── GRANTS ────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on bottle_deposits to anon;


-- ── AUTO-UPDATE trigger for updated_at ────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bottle_deposits_updated_at on bottle_deposits;
create trigger trg_bottle_deposits_updated_at
  before update on bottle_deposits
  for each row execute function set_updated_at();


-- ── SUMMARY VIEW ──────────────────────────────────────────────────────────────
create or replace view bottle_deposits_summary as
select
  id,
  customer_name,
  contact,
  bottle_type,
  bottle_size,
  qty,
  returned_qty,
  (qty - returned_qty)                                as outstanding_qty,
  deposit_per_bottle,
  total_deposit,
  round((qty - returned_qty) * deposit_per_bottle, 2) as held_amount,
  round(returned_qty * deposit_per_bottle, 2)         as refunded_amount,
  notes,
  status,
  date_borrowed,
  due_date,                                                          -- ← NEW
  case                                                               -- ← NEW: overdue flag
    when status = 'returned'             then false
    when due_date is null                then false
    when current_date > due_date         then true
    else false
  end                                                 as is_overdue,
  case                                                               -- ← NEW: days overdue
    when status = 'returned'             then null
    when due_date is null                then null
    when current_date > due_date         then (current_date - due_date)
    else null
  end                                                 as days_overdue,
  created_at,
  updated_at
from bottle_deposits
order by created_at desc;

grant select on bottle_deposits_summary to anon;


-- ── SEED DATA ─────────────────────────────────────────────────────────────────
insert into bottle_deposits
  (customer_name, contact, bottle_type, bottle_size, qty, deposit_per_bottle, total_deposit, status, returned_qty, date_borrowed, due_date)
values
  ('Juan dela Cruz', '09171234567', 'Coke',   '1.5L (big)', 3, 10.00, 30.00, 'borrowed',           0, current_date - 5, current_date + 2),
  ('Maria Santos',   '09281234567', 'Sprite', '1.5L (big)', 2, 10.00, 20.00, 'partially_returned', 1, current_date - 3, current_date - 1),
  ('Pedro Lazaro',   null,          'Royal',  '1L',         4, 10.00, 40.00, 'returned',           4, current_date - 7, current_date - 2)
on conflict do nothing;


-- ── IF TABLE ALREADY EXISTS: run this migration instead ───────────────────────
-- alter table bottle_deposits add column if not exists due_date date;
-- create index if not exists idx_bottle_deposits_due_date on bottle_deposits(due_date);