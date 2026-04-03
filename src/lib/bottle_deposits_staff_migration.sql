-- ============================================================
--  ChonaSync — Bottle Deposits: Add recorded_by & received_by
--  Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add recorded_by: staff who created the borrow record
alter table bottle_deposits
  add column if not exists recorded_by text default null;

-- 2. Add received_by: staff who received the returned bottles
alter table bottle_deposits
  add column if not exists received_by text default null;

-- 3. Optional indexes for filtering/reporting by staff
create index if not exists idx_bottle_deposits_recorded_by
  on bottle_deposits(recorded_by);

create index if not exists idx_bottle_deposits_received_by
  on bottle_deposits(received_by);

-- 4. Drop the old view first — required because we're inserting new columns
--    before existing ones (recorded_by, received_by before is_overdue).
--    PostgreSQL's CREATE OR REPLACE VIEW cannot reorder or insert mid-list columns.
drop view if exists bottle_deposits_summary;

-- 5. Recreate the summary view with all columns including the new ones
create view bottle_deposits_summary as
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
  recorded_by,
  received_by,
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