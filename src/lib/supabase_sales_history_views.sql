-- ============================================================
--  StoreIQ — Sales History SQL additions
--  Run this in Supabase SQL Editor AFTER the original schema
-- ============================================================

-- ── Convenience view: product sales with items as JSON ───────────────────────
create or replace view product_sales_summary as
select
  t.id,
  t.date,
  t.type,
  t.subtotal,
  t.tax,
  t.discount,
  t.total,
  t.payment,
  t.change_due,
  t.method,
  t.created_at,
  json_agg(json_build_object(
    'productId', ti.product_id,
    'name',      ti.name,
    'qty',       ti.qty,
    'price',     ti.price,
    'returnQty', ti.return_qty
  ) order by ti.id) as items
from transactions t
left join transaction_items ti on ti.transaction_id = t.id
group by t.id
order by t.created_at desc;

-- ── Convenience view: e-load sales with items as JSON ────────────────────────
create or replace view eload_sales_summary as
select
  et.id,
  et.date,
  'eloading'::text as type,
  et.subtotal,
  et.total_cost,
  et.total_profit,
  et.discount,
  et.total,
  et.payment,
  et.change_due,
  et.method,
  et.created_at,
  json_agg(json_build_object(
    'loadId',       eti.load_product_id,
    'name',         eti.name,
    'network',      eti.network,
    'denomination', eti.denomination,
    'costPrice',    eti.cost_price,
    'profit',       eti.profit,
    'mobileNumber', eti.mobile_number
  ) order by eti.id) as items
from eload_transactions et
left join eload_transaction_items eti on eti.eload_transaction_id = et.id
group by et.id
order by et.created_at desc;

-- ── Daily revenue summary (useful for charts later) ──────────────────────────
create or replace view daily_revenue as
select
  date,
  sum(case when type != 'eloading' then total else 0 end) as product_revenue,
  sum(case when type  = 'eloading' then total else 0 end) as eload_revenue,
  sum(total)                                               as total_revenue
from (
  select date, type, total from transactions
  union all
  select date, 'eloading', total from eload_transactions
) combined
group by date
order by date desc;

-- Grant read access to anon role
grant select on product_sales_summary to anon;
grant select on eload_sales_summary    to anon;
grant select on daily_revenue          to anon;
