-- ============================================================
--  ChonaSync — Bottle Deposits: Add due_date column
--  Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add the due_date column (safe to run on existing table)
alter table bottle_deposits
  add column if not exists due_date date default null;

-- 2. Index for fast overdue queries
create index if not exists idx_bottle_deposits_due_date
  on bottle_deposits(due_date);

-- 3. Recreate the summary view to include due_date
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
  due_date,
  -- Overdue flag: past due_date, or (no due_date and borrowed > 7 days ago)
  case
    when status = 'returned' then false
    when due_date is not null and due_date < current_date then true
    when due_date is null and date_borrowed < current_date - interval '7 days' then true
    else false
  end                                                 as is_overdue,
  created_at,
  updated_at
from bottle_deposits
order by created_at desc;

grant select on bottle_deposits_summary to anon;

-- ── Enable Realtime for bottle_deposits ────────────────────────────────────────
-- Required for the Dashboard and BottleDeposit live subscriptions to work.
-- Run in Supabase SQL Editor:
alter publication supabase_realtime add table bottle_deposits;

-- Also enable realtime for the other tables Dashboard subscribes to:
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table suppliers;
