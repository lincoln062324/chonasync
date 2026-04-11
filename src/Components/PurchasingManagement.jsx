import { useState, useRef, useEffect } from "react";
import Icon from "../Components/Icon";
import { Badge, Btn, Modal, Field } from "../Components/Primitives";
import { CATEGORIES, CATEGORY_META } from "../data/constants";

// ── Searchable product autocomplete ───────────────────────────────────────────
function ProductSearchInput({ products, value, onChange, placeholder = "Search product…" }) {
  const [query,   setQuery]   = useState("");
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  const selected = products.find(p => p.id === value) ?? null;

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setFocused(false); setQuery("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const q = query.trim().toLowerCase();
  const suggestions = q.length === 0
    ? products
    : products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku      && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );

  const pick = (prod) => {
    onChange(prod.id);
    setQuery(""); setOpen(false); setFocused(false);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setTimeout(() => { setOpen(true); setFocused(true); inputRef.current?.focus(); }, 0);
  };

  const highlight = (text) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "#fef08a", borderRadius: 2, padding: "0 1px" }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div
        onClick={() => { setOpen(true); setFocused(true); inputRef.current?.focus(); }}
        style={{
          display: "flex", alignItems: "center",
          border: `1.5px solid ${focused ? "var(--color-indigo,#6366f1)" : "var(--color-border,#e2e8f0)"}`,
          borderRadius: "var(--radius-md,8px)", background: "#fff",
          transition: "border-color .15s", overflow: "hidden", cursor: "text",
        }}
      >
        <span style={{ paddingLeft: 10, color: "#94a3b8", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <Icon name="search" size={14} />
        </span>

        {selected && !focused ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "0 6px", minWidth: 0, height: 38 }}>
            <span style={{ fontSize: 16 }}>{(CATEGORY_META[selected.category] ?? CATEGORY_META["Other"]).emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {selected.name}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{selected.sku}</span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={selected ? selected.name : placeholder}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              padding: "9px 8px 9px 6px", fontSize: 13, color: "var(--color-text-primary)",
            }}
          />
        )}

        {selected && (
          <button
            onMouseDown={clearSelection}
            title="Clear"
            style={{
              flexShrink: 0, padding: "0 10px", height: "100%", border: "none",
              background: "transparent", color: "#94a3b8", cursor: "pointer",
              fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center",
            }}
          >×</button>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1.5px solid var(--color-border,#e2e8f0)",
          borderRadius: "var(--radius-md,8px)", boxShadow: "0 8px 24px rgba(0,0,0,.10)",
          zIndex: 9999, maxHeight: 256, overflowY: "auto",
        }}>
          {suggestions.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8" }}>
              No products match "{query}"
            </div>
          ) : suggestions.map(p => {
            const meta     = CATEGORY_META[p.category] ?? CATEGORY_META["Other"];
            const isActive = p.id === value;
            return (
              <div
                key={p.id}
                onMouseDown={() => pick(p)}
                style={{
                  padding: "9px 12px", cursor: "pointer",
                  background: isActive ? "#eef2ff" : "transparent",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", gap: 10,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? "#eef2ff" : "transparent"; }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {highlight(p.name)}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                    {p.sku} · {p.category}
                  </div>
                </div>
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 20,
                  background: p.stock === 0 ? "#fee2e2" : p.stock <= p.reorderLevel ? "#fef9c3" : "#dcfce7",
                  color:      p.stock === 0 ? "#dc2626" : p.stock <= p.reorderLevel ? "#92400e" : "#15803d",
                }}>
                  {p.stock} {p.unit}s
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── SKU prefix per category (mirrors StockManagement) ─────────────────────────
const SKU_PREFIX = {
  "Beverages":        "BEV",
  "Snacks":           "SNK",
  "Canned/Dry Goods": "FD",
  "Household":        "HH",
  "Personal Care":    "PC",
  "Dairy":            "DAI",
  "Condiments":       "COND",
  "Cigarettes":       "CIG",
  "Hygiene":          "HYG",
  "Groceries":        "GRC",
  "Other":            "OTH",
};

function generateSKU(category, existingProducts, pendingItems = []) {
  const prefix  = SKU_PREFIX[category] ?? "OTH";
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, "i");
  let max = 0;
  // Check already-saved DB products
  for (const p of existingProducts) {
    const m = p.sku?.match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  // Also check other pending new-product rows in the current PO
  for (const item of pendingItems) {
    if (item.isNew && item.newSku) {
      const m = item.newSku.match(pattern);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

const fmt = (n) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Blank new-product row ──────────────────────────────────────────────────────
function blankNewProduct(categories) {
  return {
    isNew:        true,
    productId:    "",          // blank = will be created
    newName:      "",
    newCategory:  categories[0] || "Beverages",
    newSku:       "",          // auto-computed
    newCost:      "",
    newPrice:     "",
    newStock:     0,           // opening stock (for new products)
    newUnit:      "piece",
    qty:          1,
    unitCost:     "",
  };
}

export default function PurchasingManagement({
  purchaseOrders,
  products,
  suppliers,
  onCreatePO,
  onReceivePO,
  onAddProduct,
  prefillItems,        // { items, supplierId } from ShoppingList — auto-opens create modal
  onPrefillConsumed,   // clears prefill after modal opens
}) {
  const [modal,     setModal]     = useState(null); // "create" | "view" | "repurchase"
  const [form,      setForm]      = useState({ supplierId: "" });
  const [poItems,   setPoItems]   = useState([{ isNew: false, productId: "", qty: 1, unitCost: 0 }]);
  const [viewPO,    setViewPO]    = useState(null);
  const [saving,    setSaving]    = useState(false);

  // ── Consume prefill from ShoppingList ──────────────────────────────────────
  useEffect(() => {
    if (!prefillItems) return;
    const { items, supplierId } = prefillItems;
    setForm({ supplierId: supplierId || suppliers[0]?.id || "" });
    setPoItems(items.map(it => {
      if (it.productId) {
        // Existing product row
        const prod = products.find(p => p.id === it.productId);
        return {
          isNew:        false,
          productId:    it.productId,
          qty:          it.qty || 1,
          unitCost:     prod?.cost ?? 0,
          currentStock: prod?.stock ?? "",
        };
      }
      // New product row
      return {
        isNew:       true,
        productId:   "",
        newName:     it.newName || it.name || "",
        newCategory: it.newCategory || "Other",
        newSku:      generateSKU(it.newCategory || "Other", products, []),
        newCost:     it.newCost || "",
        newPrice:    it.newPrice || "",
        newStock:    0,
        newUnit:     it.newUnit || it.unit || "piece",
        qty:         it.qty || 1,
        unitCost:    it.newCost || "",
      };
    }));
    setModal("create");
    if (onPrefillConsumed) onPrefillConsumed();
  }, [prefillItems]);

  // ── PO item helpers ────────────────────────────────────────────────────────
  const addExistingItem = () =>
    setPoItems(prev => [...prev, { isNew: false, productId: "", qty: 1, unitCost: 0, currentStock: "" }]);

  const addNewProductItem = () =>
    setPoItems(prev => [
      ...prev,
      { ...blankNewProduct(CATEGORIES), newSku: generateSKU(CATEGORIES[0], products, prev) },
    ]);

  const removeItem = (i) => setPoItems(prev => prev.filter((_, idx) => idx !== i));

  const updateItem = (i, k, v) =>
    setPoItems(prev =>
      prev.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [k]: v };
        // Auto-fill cost AND current stock when selecting an existing product
        if (k === "productId" && !item.isNew) {
          const p = products.find(p => p.id === v);
          if (p) {
            updated.unitCost     = p.cost;
            updated.currentStock = p.stock;  // pre-fill editable current stock
          }
        }
        // Auto-generate SKU when category changes on a new-product row
        if (k === "newCategory" && item.isNew) {
          updated.newSku = generateSKU(v, products, prev);
        }
        // Sync unitCost from newCost on new-product rows
        if (k === "newCost" && item.isNew) {
          updated.unitCost = v;
        }
        return updated;
      })
    );

  // ── Open modals ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm({ supplierId: suppliers[0]?.id || "" });
    setPoItems([{ isNew: false, productId: "", qty: 1, unitCost: 0, currentStock: "" }]);
    setModal("create");
  };

  const openView = (po) => {
    setViewPO(po);
    setModal("view");
  };

  const openRepurchase = (po) => {
    setViewPO(po);
    setForm({
      supplierId:   po.supplierId,
    });
    // Pre-fill items from the original PO
    setPoItems(
      po.items.map(i => {
        const prod = products.find(p => p.id === i.productId);
        return {
          isNew:        false,
          productId:    i.productId,
          qty:          i.qty,
          unitCost:     i.unitCost,
          currentStock: prod?.stock ?? "",
        };
      })
    );
    setModal("repurchase");
  };

  // ── Save PO — auto-received on creation, stock updated immediately ────────
  const savePO = async () => {
    setSaving(true);
    try {
      const resolvedItems  = [];
      const newProductIds  = new Set(); // IDs of newly-created products (stock already set)

      for (const item of poItems) {
        if (item.isNew) {
          if (!item.newName.trim()) { alert("Please enter a product name for all new products."); setSaving(false); return; }

          if (onAddProduct) {
            const orderQty  = +item.qty    || 0;
            const openStock = +item.newStock || 0;
            const newProduct = {
              id:           "p" + Date.now() + Math.random(),
              name:         item.newName.trim(),
              sku:          item.newSku,
              category:     item.newCategory,
              supplierId:   form.supplierId,
              cost:         +item.newCost  || 0,
              price:        +item.newPrice || 0,
              stock:        openStock + orderQty,   // opening stock + order qty already baked in
              reserved:     0,
              damaged:      0,
              reorderLevel: 10,
              unit:         item.newUnit,
              variants:     [],
            };
            const saved      = await onAddProduct(newProduct);
            const resolvedId = saved?.id ?? newProduct.id;
            newProductIds.add(resolvedId);   // mark as already-stocked
            resolvedItems.push({ productId: resolvedId, qty: orderQty, unitCost: +item.unitCost || +item.newCost || 0 });
          }
        } else {
          if (!item.productId) continue;
          const prod        = products.find(p => p.id === item.productId);
          const orderQty    = +item.qty;
          // currentStock is the editable "current stock" field; use it as the base.
          // We pass the delta so onReceivePO (which does p.stock + item.qty) ends up
          // at the correct total: editedCurrentStock + orderQty.
          // Delta = (editedCurrentStock + orderQty) - actualDbStock
          const editedBase  = item.currentStock !== "" ? +item.currentStock : (prod?.stock ?? 0);
          const actualStock = prod?.stock ?? 0;
          const delta       = (editedBase - actualStock) + orderQty;  // net change to apply
          resolvedItems.push({ productId: item.productId, qty: delta, unitCost: +item.unitCost, _orderQty: orderQty });
        }
      }

      if (resolvedItems.length === 0) { alert("Please add at least one item to the PO."); setSaving(false); return; }

      const today = new Date().toISOString().slice(0, 10);
      // For the PO total, use the actual ordered qty (not the stock delta)
      const total = resolvedItems.reduce((s, i) => s + (i._orderQty ?? i.qty) * i.unitCost, 0);
      // Strip internal _orderQty before saving
      const poItemsClean = resolvedItems.map(({ _orderQty, ...rest }) => rest);
      const newPO = {
        id:           "po" + Date.now(),
        date:         today,
        supplierId:   form.supplierId,
        items:        poItemsClean,
        status:       "received",
        total,
        receivedDate: today,
      };

      if (onCreatePO) await onCreatePO(newPO);

      // Only increment stock for existing products — new products already have correct stock
      const existingItems = resolvedItems.filter(ri => !newProductIds.has(ri.productId));
      if (onReceivePO && existingItems.length > 0) {
        // Strip _orderQty for the receive call too
        await onReceivePO({ ...newPO, items: existingItems.map(({ _orderQty, ...rest }) => rest) });
      }

      setModal(null);
    } catch (err) {
      alert("Failed to save PO: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const poRunningTotal = poItems.reduce((s, i) => s + +i.qty * +(i.unitCost || i.newCost || 0), 0);

  // ── Helper: get product name for PO overview ──────────────────────────────
  const productName = (productId) =>
    products.find(p => p.id === productId)?.name ?? productId;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Purchasing Management</h1>
          <p className="page-header__sub">Manage purchase orders and incoming stock</p>
        </div>
        <Btn onClick={openCreate} icon="plus">Create PO</Btn>
      </div>

      {/* ── PO Table ── */}
      <div className="table-wrap4">
        <table className="data-table">
          <thead>
            <tr>
              {["PO #", "Date", "Supplier", "Items", "Total", "Received", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="table-empty">No purchase orders yet. Click "Create PO" to start.</td>
              </tr>
            )}
            {purchaseOrders.map(po => {
              const supplier = suppliers.find(s => s.id === po.supplierId);
              return (
                <tr key={po.id}>
                  <td className="td-id">{po.id.toString().toUpperCase()}</td>
                  <td className="td-small">{po.date}</td>
                  <td className="td-name">{supplier?.name || "—"}</td>
                  <td>{po.items.length} item{po.items.length !== 1 ? "s" : ""}</td>
                  <td className="td-price">{fmt(po.total)}</td>
                  <td className="td-small" style={{ color: "var(--color-green)", fontWeight: 600 }}>
                    ✓ {po.receivedDate || po.date}
                  </td>
                  <td>
                    <div className="btn-row">
                      <Btn size="sm" variant="secondary" onClick={() => openView(po)} title="View details">
                        <Icon name="search" size={12} />
                      </Btn>
                      <Btn size="sm" variant="secondary" onClick={() => openRepurchase(po)} title="Re-purchase">
                        <Icon name="refresh" size={12} />
                      </Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════
          PO OVERVIEW MODAL
      ═══════════════════════════════════════════════════════ */}
      {viewPO && (
        <Modal
          open={modal === "view"}
          onClose={() => setModal(null)}
          title={`PO Overview — ${viewPO.id.toString().toUpperCase()}`}
          maxWidth={600}
        >
          {/* Header info */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20,
            background: "var(--color-indigo-light)", borderRadius: "var(--radius-lg)", padding: "14px 18px",
          }}>
            {[
              { label: "Supplier",      value: suppliers.find(s => s.id === viewPO.supplierId)?.name ?? "—" },
              { label: "Date Created",  value: viewPO.date },
              { label: "Received",      value: viewPO.receivedDate || viewPO.date },
              { label: "Total",         value: fmt(viewPO.total) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Items table */}
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Order Items ({viewPO.items.length})
          </p>
          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {viewPO.items.map((item, i) => {
                  const prod = products.find(p => p.id === item.productId);
                  const meta = prod ? (CATEGORY_META[prod.category] ?? CATEGORY_META["Other"]) : null;
                  return (
                    <tr key={i}>
                      <td className="td-name">{prod?.name ?? item.productId}</td>
                      <td>
                        {meta ? (
                          <span className="cat-pill" style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, fontSize: 11 }}>
                            {meta.emoji} {prod.category}
                          </span>
                        ) : "—"}
                      </td>
                      <td>{item.qty}</td>
                      <td>{fmt(item.unitCost)}</td>
                      <td className="td-price">{fmt(item.qty * item.unitCost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Btn variant="secondary" onClick={() => openRepurchase(viewPO)}>
              <Icon name="refresh" size={13} /> Re-purchase this PO
            </Btn>
            <Btn onClick={() => setModal(null)}>Close</Btn>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════
          CREATE / RE-PURCHASE PO MODAL
      ═══════════════════════════════════════════════════════ */}
      <Modal
        open={modal === "create" || modal === "repurchase"}
        onClose={() => setModal(null)}
        title={modal === "repurchase"
          ? `Re-Purchase — ${viewPO?.id?.toString().toUpperCase()}`
          : "Create Purchase Order"}
        maxWidth={760}
      >
        {modal === "repurchase" && (
          <div style={{
            background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "var(--radius-md)",
            padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1d4ed8", fontWeight: 600,
          }}>
            📋 Pre-filled from original PO. Adjust quantities or costs as needed, then submit.
          </div>
        )}

        {/* Supplier */}
        <div className="form-grid-2 mb-16">
          <Field label="Supplier" required>
            <select
              className="select"
              value={form.supplierId}
              onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
            >
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "#15803d", fontWeight: 600,
          }}>
            ✅ Stock will be updated immediately upon submission
          </div>
        </div>

        {/* ── Order Items ── */}
        <p className="field__label" style={{ marginBottom: 10 }}>Order Items</p>

        {poItems.map((item, i) => (
          <div key={i} style={{
            border: item.isNew ? "1.5px dashed var(--color-indigo-mid)" : "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: 12,
            background: item.isNew ? "var(--color-indigo-light)" : "var(--color-surface)",
          }}>
            {/* Row header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: item.isNew ? "var(--color-indigo)" : "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {item.isNew ? "✨ New Product" : `Item ${i + 1}`}
              </span>
              <button onClick={() => removeItem(i)} className="btn btn--danger btn--sm" style={{ padding: "3px 8px" }}>
                <Icon name="x" size={13} />
              </button>
            </div>

            {item.isNew ? (
              /* ── NEW PRODUCT FIELDS ── */
              <div>
                <div className="form-grid-2" style={{ marginBottom: 10 }}>
                  <Field label="Product Name" required>
                    <input
                      className="input"
                      placeholder="e.g. Coke 500ml"
                      value={item.newName}
                      onChange={e => updateItem(i, "newName", e.target.value)}
                    />
                  </Field>
                  <Field label="Category">
                    <select
                      className="select"
                      value={item.newCategory}
                      onChange={e => updateItem(i, "newCategory", e.target.value)}
                    >
                      {CATEGORIES.map(c => {
                        const meta = CATEGORY_META[c] ?? CATEGORY_META["Other"];
                        return <option key={c} value={c}>{meta.emoji} {c}</option>;
                      })}
                    </select>
                  </Field>
                </div>
                <div className="form-grid-2" style={{ marginBottom: 10 }}>
                  <Field label="SKU (auto-assigned)">
                    <div style={{ position: "relative" }}>
                      <input
                        className="input"
                        value={item.newSku}
                        readOnly
                        tabIndex={-1}
                        style={{ background: "#f1f5f9", color: "#475569", fontWeight: 700, cursor: "not-allowed", paddingRight: 60 }}
                      />
                      <span style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        fontSize: 10, fontWeight: 700, color: "#94a3b8",
                        background: "#e2e8f0", borderRadius: 4, padding: "2px 6px",
                      }}>AUTO</span>
                    </div>
                  </Field>
                  <Field label="Unit">
                    <select className="select" value={item.newUnit} onChange={e => updateItem(i, "newUnit", e.target.value)}>
                      {["piece", "pack", "bottle", "box", "bag", "sachet", "can", "kg", "liter"].map(u =>
                        <option key={u} value={u}>{u}</option>
                      )}
                    </select>
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                  <Field label="Cost Price (₱)" required>
                    <input className="input" type="number" placeholder="0.00" value={item.newCost}
                      onChange={e => updateItem(i, "newCost", e.target.value)} />
                  </Field>
                  <Field label="Selling Price (₱)">
                    <input className="input" type="number" placeholder="0.00" value={item.newPrice}
                      onChange={e => updateItem(i, "newPrice", e.target.value)} />
                  </Field>
                  <Field label="Opening Stock">
                    <input className="input" type="number" placeholder="0" value={item.newStock}
                      onChange={e => updateItem(i, "newStock", e.target.value)} />
                  </Field>
                  <Field label="Order Qty" required>
                    <input className="input" type="number" placeholder="1" value={item.qty}
                      onChange={e => updateItem(i, "qty", e.target.value)} />
                  </Field>
                </div>
              </div>
            ) : (
              /* ── EXISTING PRODUCT FIELDS ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ flex: 2, minWidth: 200 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
                      Product
                    </label>
                    <ProductSearchInput
                      products={products.filter(p => !form.supplierId || p.supplierId === form.supplierId)}
                      value={item.productId}
                      onChange={id => updateItem(i, "productId", id)}
                      placeholder="Search by name, SKU, or category…"
                    />
                  </div>
                  <div style={{ width: 100 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
                      Current Stock
                    </label>
                    <input
                      className="input"
                      type="number"
                      placeholder="—"
                      value={item.currentStock}
                      onChange={e => updateItem(i, "currentStock", e.target.value)}
                      style={{ background: item.productId ? "#fff" : "#f8fafc" }}
                    />
                  </div>
                  <div style={{ width: 80 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
                      Order Qty
                    </label>
                    <input className="input" type="number" placeholder="Qty"
                      value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} />
                  </div>
                  <div style={{ width: 120 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
                      Cost Price (₱)
                    </label>
                    <input className="input" type="number" placeholder="0.00"
                      value={item.unitCost} onChange={e => updateItem(i, "unitCost", e.target.value)} />
                  </div>
                  <div style={{ minWidth: 90, textAlign: "right", paddingBottom: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                      Subtotal
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-indigo)" }}>
                      {fmt(+item.qty * +item.unitCost)}
                    </span>
                  </div>
                </div>

                {/* Stock preview strip */}
                {item.productId && (() => {
                  const prod = products.find(p => p.id === item.productId);
                  if (!prod) return null;
                  const base      = item.currentStock !== "" ? +item.currentStock : prod.stock;
                  const newTotal  = base + (+item.qty || 0);
                  const stockChanged = item.currentStock !== "" && +item.currentStock !== prod.stock;
                  return (
                    <div style={{
                      fontSize: 12, borderRadius: 6, padding: "8px 12px",
                      background: "var(--color-surface-2, #f8fafc)",
                      border: "1px solid var(--color-border)",
                      display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center",
                    }}>
                      <span>
                        Last cost: <strong style={{ color: "var(--color-text-primary)" }}>₱{prod.cost}</strong>
                      </span>
                      <span>
                        Selling price: <strong style={{ color: "var(--color-text-primary)" }}>₱{prod.price}</strong>
                      </span>
                      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                        {stockChanged && (
                          <span style={{ color: "#b45309", fontWeight: 600 }}>
                            DB: {prod.stock} → edited: {+item.currentStock}
                          </span>
                        )}
                        <span style={{ color: "var(--color-text-muted)" }}>
                          After receive:
                        </span>
                        <span style={{
                          fontWeight: 800, fontSize: 13,
                          color: newTotal > prod.stock ? "#15803d" : "var(--color-text-primary)",
                          background: newTotal > prod.stock ? "#dcfce7" : "#f1f5f9",
                          border: `1px solid ${newTotal > prod.stock ? "#86efac" : "#e2e8f0"}`,
                          borderRadius: 5, padding: "2px 8px",
                        }}>
                          {newTotal} {prod.unit}s
                        </span>
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}

        {/* Add item buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Btn variant="secondary" size="sm" onClick={addExistingItem} icon="plus">
            Add Existing Product
          </Btn>
          <Btn variant="secondary" size="sm" onClick={addNewProductItem}>
            ✨ Add New Product
          </Btn>
        </div>

        {/* Total bar */}
        <div className="po-total-bar">
          Total: <strong>{fmt(poRunningTotal)}</strong>
        </div>

        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={savePO} disabled={saving}>
            {saving ? "Saving…" : modal === "repurchase" ? "🔄 Submit Re-Purchase" : "✅ Submit & Add to Stock"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}