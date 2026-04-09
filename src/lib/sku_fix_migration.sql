-- ============================================================
--  ChonaSync — SKU Duplicate Fix Migration
--  Run this in Supabase SQL Editor
-- ============================================================
--
--  Problem: The products table has a UNIQUE constraint on `sku`.
--  When PurchasingManagement creates multiple new products in the
--  same PO (or the in-memory list is stale), duplicate SKUs were
--  being generated and the insert would crash with:
--    "duplicate key value violates unique constraint products_sku_key"
--
--  This migration does two things:
--    1. Verifies the constraint exists (informational only).
--    2. Creates a helper function that generates a guaranteed-unique
--       SKU directly in the database — useful if you ever want to
--       move SKU generation server-side in the future.
--
--  The primary fix is in the application layer (PurchasingManagement.jsx
--  + supabase.js), so NO schema changes are required. This file is
--  purely a safety net / reference.
-- ============================================================


-- ── 1. Confirm the unique constraint is present ───────────────────────────────
--  (This is a SELECT — safe to run any time.)
SELECT
  conname        AS constraint_name,
  contype        AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'products'::regclass
  AND conname  = 'products_sku_key';


-- ── 2. DB-side unique SKU generator (optional / future use) ──────────────────
--
--  Call:  SELECT generate_unique_sku('BEV');
--  Returns a SKU like 'BEV-007' that does not yet exist in products.
--
CREATE OR REPLACE FUNCTION generate_unique_sku(prefix text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  max_num  int := 0;
  candidate text;
  pattern  text;
BEGIN
  pattern := '^' || prefix || '-(\d+)$';

  SELECT COALESCE(MAX(CAST(substring(sku FROM pattern) AS int)), 0)
  INTO   max_num
  FROM   products
  WHERE  sku ~ pattern;

  -- Increment until we find a free slot (handles gaps / manual entries)
  LOOP
    max_num   := max_num + 1;
    candidate := prefix || '-' || lpad(max_num::text, 3, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM products WHERE sku = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

-- Grant execute to the anon role (matches the rest of the schema)
GRANT EXECUTE ON FUNCTION generate_unique_sku(text) TO anon;


-- ── 3. (Optional) Back-fill any accidental duplicate SKUs ────────────────────
--
--  If you already have duplicate SKUs in the table from previous failed
--  inserts that somehow slipped through, run the block below to rename them.
--  It appends '-DUP-<id>' to every duplicate beyond the first occurrence.
--
--  UNCOMMENT to run:
/*
WITH ranked AS (
  SELECT
    id,
    sku,
    ROW_NUMBER() OVER (PARTITION BY sku ORDER BY created_at) AS rn
  FROM products
)
UPDATE products p
SET    sku = p.sku || '-DUP-' || p.id
FROM   ranked r
WHERE  p.id = r.id
  AND  r.rn > 1;
*/
