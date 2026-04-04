-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Add `notes` column to suppliers table
-- Run this once in your Supabase SQL Editor (Database → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Optional: add an index if you plan to full-text search notes later
-- CREATE INDEX IF NOT EXISTS idx_suppliers_notes ON suppliers USING gin(to_tsvector('english', coalesce(notes, '')));


-- ─────────────────────────────────────────────────────────────────────────────
-- PATCH for  src/lib/supabase.js
-- Two small changes are needed — shown as diffs below.
-- ─────────────────────────────────────────────────────────────────────────────

-- ① mapSupplier  — add `notes` to the returned object
--    BEFORE:
--      const mapSupplier = (row) => ({
--        id:             row.id,
--        name:           row.name,
--        contact:        row.contact ?? "",
--        terms:          row.terms,
--        rating:         Number(row.rating),
--        onTimeDelivery: Number(row.on_time_delivery),
--        deliveryTime:   row.delivery_time,
--        totalOrders:    row.total_orders,
--      });
--
--    AFTER:
--      const mapSupplier = (row) => ({
--        id:             row.id,
--        name:           row.name,
--        contact:        row.contact ?? "",
--        terms:          row.terms,
--        rating:         Number(row.rating),
--        onTimeDelivery: Number(row.on_time_delivery),
--        deliveryTime:   row.delivery_time,
--        totalOrders:    row.total_orders,
--        notes:          row.notes ?? "",          // ← ADD THIS LINE
--      });


-- ② updateSupplier  — forward the `notes` field when it's provided
--    BEFORE (inside the payload-building block):
--      if (changes.onTimeDelivery !== undefined) payload.on_time_delivery = changes.onTimeDelivery;
--
--    AFTER:
--      if (changes.onTimeDelivery !== undefined) payload.on_time_delivery = changes.onTimeDelivery;
--      if (changes.notes          !== undefined) payload.notes            = changes.notes;   // ← ADD


-- ③ createSupplier  — persist notes on insert
--    BEFORE (inside the .insert({...}) call):
--      total_orders:     supplier.totalOrders    ?? 0,
--
--    AFTER:
--      total_orders:     supplier.totalOrders    ?? 0,
--      notes:            supplier.notes          ?? null,   // ← ADD