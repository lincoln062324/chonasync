// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────────────────────
// 1. Install the client:  npm install @supabase/supabase-js
// 2. Create a .env file in your project root:
//      VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
//      VITE_SUPABASE_ANON_KEY=your-anon-key-here
// 3. Import the functions you need in your components.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);


// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS — map DB snake_case rows → app camelCase objects
// ══════════════════════════════════════════════════════════════════════════════

const mapSupplier = (row) => ({
  id:              row.id,
  name:            row.name,
  contact:         row.contact ?? "",
  terms:           row.terms,
  rating:          Number(row.rating),
  onTimeDelivery:  Number(row.on_time_delivery),
  deliveryTime:    row.delivery_time,
  totalOrders:     row.total_orders,
});

const mapProduct = (row) => ({
  id:           row.id,
  sku:          row.sku,
  name:         row.name,
  category:     row.category,
  supplierId:   row.supplier_id ?? "",
  cost:         Number(row.cost),
  price:        Number(row.price),
  stock:        row.stock,
  reserved:     row.reserved,
  damaged:      row.damaged,
  reorderLevel: row.reorder_level,
  unit:         row.unit,
  variants:     [],
});

const mapLoadProduct = (row) => ({
  id:           row.id,
  network:      row.network,
  name:         row.name,
  denomination: Number(row.denomination),
  costPrice:    Number(row.cost_price),
  profit:       Number(row.profit),
});

const mapTransaction = (row) => ({
  id:       row.id,
  date:     row.date,
  type:     row.type ?? "sale",
  items:    (row.transaction_items ?? []).map((i) => ({
    productId: i.product_id,
    name:      i.name,
    qty:       i.qty,
    price:     Number(i.price),
    returnQty: i.return_qty,
  })),
  subtotal: Number(row.subtotal),
  tax:      Number(row.tax),
  discount: Number(row.discount),
  total:    Number(row.total),
  payment:  Number(row.payment),
  change:   Number(row.change_due),
  method:   row.method,
});

const mapEloadTransaction = (row) => ({
  id:          row.id,
  date:        row.date,
  type:        "eloading",
  items:       (row.eload_transaction_items ?? []).map((i) => ({
    loadId:       i.load_product_id,
    name:         i.name,
    network:      i.network,
    denomination: Number(i.denomination),
    costPrice:    Number(i.cost_price),
    profit:       Number(i.profit),
    mobileNumber: i.mobile_number ?? "",
  })),
  subtotal:     Number(row.subtotal),
  totalCost:    Number(row.total_cost),
  totalProfit:  Number(row.total_profit),
  discount:     Number(row.discount),
  total:        Number(row.total),
  payment:      Number(row.payment),
  change:       Number(row.change_due),
  method:       row.method,
});

const mapPurchaseOrder = (row) => ({
  id:           row.id,
  date:         row.date,
  supplierId:   row.supplier_id ?? "",
  status:       row.status,
  total:        Number(row.total),
  expectedDate: row.expected_date ?? "",
  receivedDate: row.received_date ?? null,
  items:        (row.purchase_order_items ?? []).map((i) => ({
    productId: i.product_id,
    qty:       i.qty,
    unitCost:  Number(i.unit_cost),
  })),
});


// ══════════════════════════════════════════════════════════════════════════════
//  SUPPLIERS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchSuppliers() {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(mapSupplier);
}

export async function createSupplier(supplier) {
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name:             supplier.name,
      contact:          supplier.contact,
      terms:            supplier.terms,
      rating:           supplier.rating ?? 0,
      on_time_delivery: supplier.onTimeDelivery ?? 100,
      delivery_time:    supplier.deliveryTime   ?? 3,
      total_orders:     supplier.totalOrders    ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSupplier(data);
}

export async function updateSupplier(id, changes) {
  const payload = {};
  if (changes.name             !== undefined) payload.name             = changes.name;
  if (changes.contact          !== undefined) payload.contact          = changes.contact;
  if (changes.terms            !== undefined) payload.terms            = changes.terms;
  if (changes.rating           !== undefined) payload.rating           = changes.rating;
  if (changes.onTimeDelivery   !== undefined) payload.on_time_delivery = changes.onTimeDelivery;

  const { data, error } = await supabase
    .from("suppliers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapSupplier(data);
}

export async function deleteSupplier(id) {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}


// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(mapProduct);
}

export async function createProduct(product) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      sku:           product.sku,
      name:          product.name,
      category:      product.category,
      supplier_id:   product.supplierId || null,
      cost:          product.cost,
      price:         product.price,
      stock:         product.stock,
      reserved:      product.reserved   ?? 0,
      damaged:       product.damaged    ?? 0,
      reorder_level: product.reorderLevel,
      unit:          product.unit,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(id, changes) {
  const payload = {};
  if (changes.name         !== undefined) payload.name          = changes.name;
  if (changes.sku          !== undefined) payload.sku           = changes.sku;
  if (changes.category     !== undefined) payload.category      = changes.category;
  if (changes.supplierId   !== undefined) payload.supplier_id   = changes.supplierId || null;
  if (changes.cost         !== undefined) payload.cost          = changes.cost;
  if (changes.price        !== undefined) payload.price         = changes.price;
  if (changes.stock        !== undefined) payload.stock         = changes.stock;
  if (changes.reserved     !== undefined) payload.reserved      = changes.reserved;
  if (changes.damaged      !== undefined) payload.damaged       = changes.damaged;
  if (changes.reorderLevel !== undefined) payload.reorder_level = changes.reorderLevel;
  if (changes.unit         !== undefined) payload.unit          = changes.unit;

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// Batch-decrement stock after a POS sale
export async function decrementStock(cartItems) {
  // cartItems: [{ productId, qty }]
  await Promise.all(
    cartItems.map(({ productId, qty }) =>
      supabase.rpc("decrement_stock", { p_id: productId, p_qty: qty })
    )
  );
}

// Batch-increment stock after a return or PO receive
export async function incrementStock(items) {
  // items: [{ productId, qty }]
  await Promise.all(
    items.map(({ productId, qty }) =>
      supabase.rpc("increment_stock", { p_id: productId, p_qty: qty })
    )
  );
}


// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCT TRANSACTIONS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, transaction_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapTransaction);
}

// Save a completed POS sale (transaction + items)
export async function saveTransaction(txn) {
  // 1. Insert header
  const { data: header, error: hErr } = await supabase
    .from("transactions")
    .insert({
      date:       txn.date,
      type:       txn.type ?? "sale",
      subtotal:   txn.subtotal,
      tax:        txn.tax,
      discount:   txn.discount,
      total:      txn.total,
      payment:    txn.payment,
      change_due: txn.change,
      method:     txn.method,
    })
    .select()
    .single();
  if (hErr) throw hErr;

  // 2. Insert line items
  const itemRows = txn.items.map((i) => ({
    transaction_id: header.id,
    product_id:     i.productId,
    name:           i.name,
    qty:            i.qty,
    price:          i.price,
  }));
  const { error: iErr } = await supabase.from("transaction_items").insert(itemRows);
  if (iErr) throw iErr;

  // 3. Decrement stock for each item
  await decrementStock(txn.items.map((i) => ({ productId: i.productId, qty: i.qty })));

  return { ...txn, id: header.id };
}


// ══════════════════════════════════════════════════════════════════════════════
//  E-LOAD CATALOG
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchLoadProducts() {
  const { data, error } = await supabase
    .from("load_products")
    .select("*")
    .order("network", { ascending: true })
    .order("denomination", { ascending: true });
  if (error) throw error;
  return data.map(mapLoadProduct);
}

export async function createLoadProduct(lp) {
  const { data, error } = await supabase
    .from("load_products")
    .insert({
      network:      lp.network,
      name:         lp.name,
      denomination: lp.denomination,
      cost_price:   lp.costPrice,
      profit:       lp.profit,
    })
    .select()
    .single();
  if (error) throw error;
  return mapLoadProduct(data);
}

export async function updateLoadProduct(id, changes) {
  const payload = {};
  if (changes.network      !== undefined) payload.network      = changes.network;
  if (changes.name         !== undefined) payload.name         = changes.name;
  if (changes.denomination !== undefined) payload.denomination = changes.denomination;
  if (changes.costPrice    !== undefined) payload.cost_price   = changes.costPrice;
  if (changes.profit       !== undefined) payload.profit       = changes.profit;

  const { data, error } = await supabase
    .from("load_products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapLoadProduct(data);
}

export async function deleteLoadProduct(id) {
  const { error } = await supabase.from("load_products").delete().eq("id", id);
  if (error) throw error;
}


// ══════════════════════════════════════════════════════════════════════════════
//  E-LOAD TRANSACTIONS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchEloadTransactions() {
  const { data, error } = await supabase
    .from("eload_transactions")
    .select("*, eload_transaction_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapEloadTransaction);
}

export async function saveEloadTransaction(txn) {
  const { data: header, error: hErr } = await supabase
    .from("eload_transactions")
    .insert({
      date:         txn.date,
      subtotal:     txn.subtotal,
      total_cost:   txn.totalCost,
      total_profit: txn.totalProfit,
      discount:     txn.discount,
      total:        txn.total,
      payment:      txn.payment,
      change_due:   txn.change,
      method:       txn.method,
    })
    .select()
    .single();
  if (hErr) throw hErr;

  const itemRows = txn.items.map((i) => ({
    eload_transaction_id: header.id,
    load_product_id:      i.loadId,
    name:                 i.name,
    network:              i.network,
    denomination:         i.denomination,
    cost_price:           i.costPrice,
    profit:               i.profit,
    mobile_number:        i.mobileNumber || null,
  }));
  const { error: iErr } = await supabase.from("eload_transaction_items").insert(itemRows);
  if (iErr) throw iErr;

  return { ...txn, id: header.id };
}


// ══════════════════════════════════════════════════════════════════════════════
//  PURCHASE ORDERS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchPurchaseOrders() {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*, purchase_order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapPurchaseOrder);
}

export async function createPurchaseOrder(po) {
  const { data: header, error: hErr } = await supabase
    .from("purchase_orders")
    .insert({
      date:          po.date,
      supplier_id:   po.supplierId,
      status:        "pending",
      total:         po.total,
      expected_date: po.expectedDate || null,
    })
    .select()
    .single();
  if (hErr) throw hErr;

  const itemRows = po.items.map((i) => ({
    purchase_order_id: header.id,
    product_id:        i.productId,
    qty:               i.qty,
    unit_cost:         i.unitCost,
  }));
  const { error: iErr } = await supabase.from("purchase_order_items").insert(itemRows);
  if (iErr) throw iErr;

  return { ...po, id: header.id, status: "pending", receivedDate: null };
}

export async function receivePurchaseOrder(po) {
  // Mark as received
  const { error: pErr } = await supabase
    .from("purchase_orders")
    .update({ status: "received", received_date: new Date().toISOString().slice(0, 10) })
    .eq("id", po.id);
  if (pErr) throw pErr;

  // Increment stock for each item
  await incrementStock(po.items.map((i) => ({ productId: i.productId, qty: i.qty })));
}

export async function updatePurchaseOrderStatus(id, status) {
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}


// ══════════════════════════════════════════════════════════════════════════════
//  ACCOUNTS (PIN-based users)
// ══════════════════════════════════════════════════════════════════════════════

const AVATAR_COLORS = [
  "#4f46e5","#059669","#dc2626","#d97706","#7c3aed",
  "#0891b2","#c2410c","#065f46","#1d4ed8","#9333ea",
];

const mapAccount = (row) => ({
  id:          row.id,
  name:        row.name,
  role:        row.role,
  avatarColor: row.avatar_color ?? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  createdAt:   row.created_at,
  isActive:    row.is_active ?? true,
});

export async function fetchAccounts() {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, role, avatar_color, created_at, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data.map(mapAccount);
}

export async function loginWithPin(pin) {
  // Hash the PIN client-side with a simple approach:
  // We store a bcrypt-like hash in DB, but for simplicity we use
  // a SHA-256 digest via SubtleCrypto (available in all modern browsers).
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  const pinHash    = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const { data: rows, error } = await supabase
    .from("accounts")
    .select("id, name, role, avatar_color, is_active")
    .eq("pin_hash", pinHash)
    .eq("is_active", true)
    .limit(1);

  if (error) throw error;
  if (!rows || rows.length === 0) return null;

  // Update last_login timestamp
  await supabase
    .from("accounts")
    .update({ last_login: new Date().toISOString() })
    .eq("id", rows[0].id);

  return mapAccount(rows[0]);
}

export async function createAccount(account) {
  // Hash PIN
  const encoder = new TextEncoder();
  const data = encoder.encode(account.pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  const pinHash    = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const { data: row, error } = await supabase
    .from("accounts")
    .insert({
      name:         account.name,
      role:         account.role ?? "cashier",
      pin_hash:     pinHash,
      avatar_color: account.avatarColor ?? "#4f46e5",
      is_active:    true,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAccount(row);
}

export async function updateAccountPin(accountId, newPin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(newPin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  const pinHash    = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const { error } = await supabase
    .from("accounts")
    .update({ pin_hash: pinHash })
    .eq("id", accountId);
  if (error) throw error;
}

export async function deactivateAccount(accountId) {
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: false })
    .eq("id", accountId);
  if (error) throw error;
}


// ══════════════════════════════════════════════════════════════════════════════
//  AUDIT LOGS & ACTIVITY HISTORY
// ══════════════════════════════════════════════════════════════════════════════

const mapLog = (row) => ({
  id:        row.id,
  accountId: row.account_id,
  userName:  row.accounts?.name ?? "Unknown",
  userRole:  row.accounts?.role ?? "",
  action:    row.action,
  detail:    row.detail ?? "",
  createdAt: row.created_at,
});

export async function logActivity(accountId, action, detail = "") {
  const { error } = await supabase
    .from("audit_logs")
    .insert({ account_id: accountId, action, detail });
  if (error) console.warn("audit log failed:", error.message);
}

export async function fetchAuditLogs({ accountId, limit = 100 } = {}) {
  let query = supabase
    .from("audit_logs")
    .select("*, accounts(name, role)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (accountId) query = query.eq("account_id", accountId);

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapLog);
}


// ══════════════════════════════════════════════════════════════════════════════
//  CALCULATOR HISTORY
// ══════════════════════════════════════════════════════════════════════════════

const mapCalcEntry = (row) => ({
  id:         row.id,
  expression: row.expression,
  result:     row.result,
  date:       row.created_at,
});

export async function fetchCalcHistory() {
  const { data, error } = await supabase
    .from("calculator_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map(mapCalcEntry);
}

export async function saveCalcHistory(entry) {
  const { data, error } = await supabase
    .from("calculator_history")
    .insert({ expression: entry.expression, result: entry.result })
    .select()
    .single();
  if (error) throw error;
  return mapCalcEntry(data);
}