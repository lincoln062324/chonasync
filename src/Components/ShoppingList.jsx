import { useState, useRef, useEffect } from "react";
import Icon from "../Components/Icon";
import { Badge, Btn, Modal, Field } from "../Components/Primitives";
import { CATEGORIES, CATEGORY_META } from "../data/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function uid() {
  return "sl" + Date.now() + Math.random().toString(36).slice(2, 7);
}

// ─── Searchable product autocomplete ─────────────────────────────────────────
function ProductSearchInput({ products, value, onChange, placeholder = "Search or type a product name…" }) {
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

  const pick = (prod) => { onChange(prod.id, prod.name); setQuery(""); setOpen(false); setFocused(false); };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange("", "");
    setQuery("");
    setTimeout(() => { setOpen(true); setFocused(true); inputRef.current?.focus(); }, 0);
  };

  const highlight = (text) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (<>{text.slice(0, idx)}<mark style={{ background: "#fef08a", borderRadius: 2, padding: "0 1px" }}>{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>);
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
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.name}</span>
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
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", padding: "9px 8px 9px 6px", fontSize: 13, color: "var(--color-text-primary)" }}
          />
        )}
        {selected && (
          <button onMouseDown={clearSelection} title="Clear"
            style={{ flexShrink: 0, padding: "0 10px", height: "100%", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center" }}>×</button>
        )}
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1.5px solid var(--color-border,#e2e8f0)",
          borderRadius: "var(--radius-md,8px)", boxShadow: "0 8px 24px rgba(0,0,0,.10)",
          zIndex: 9999, maxHeight: 220, overflowY: "auto",
        }}>
          {suggestions.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8" }}>No match for "{query}"</div>
          ) : suggestions.map(p => {
            const meta       = CATEGORY_META[p.category] ?? CATEGORY_META["Other"];
            const stockColor = p.stock === 0 ? "#dc2626" : p.stock <= p.reorderLevel ? "#92400e" : "#15803d";
            const stockBg    = p.stock === 0 ? "#fee2e2" : p.stock <= p.reorderLevel ? "#fef9c3" : "#dcfce7";
            return (
              <div key={p.id} onMouseDown={() => pick(p)}
                style={{ padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {highlight(p.name)}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                    {p.sku} · {p.category} · <span style={{ color: "#64748b" }}>{p.unit}</span>
                  </div>
                </div>
                {/* Stock + unit pill */}
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: stockBg, color: stockColor }}>
                  {p.stock === 0 ? "Out" : p.stock <= p.reorderLevel ? "⚠ " + p.stock : p.stock} {p.unit}s
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stock level pill ─────────────────────────────────────────────────────────
function StockPill({ prod }) {
  if (!prod) return null;
  const isOut = prod.stock === 0;
  const isLow = !isOut && prod.stock <= prod.reorderLevel;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
      background: isOut ? "#fee2e2" : isLow ? "#fef9c3" : "#dcfce7",
      color:      isOut ? "#dc2626" : isLow ? "#92400e" : "#15803d",
      border:     `1px solid ${isOut ? "#fca5a5" : isLow ? "#fde047" : "#86efac"}`,
    }}>
      {isOut ? "🔴 Out of stock" : isLow ? `⚠️ Low: ${prod.stock} ${prod.unit}s` : `${prod.stock} ${prod.unit}s`}
    </span>
  );
}

// ─── Blank list item ──────────────────────────────────────────────────────────
function blankItem(supplierId = "") {
  return {
    id:         uid(),
    productId:  "",
    name:       "",
    qty:        1,
    unit:       "piece",
    supplierId,
    purchased:  false,   // true = purchased / ready to order
    note:       "",
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ShoppingList({
  products,
  suppliers,
  purchaseOrders = [],
  currentUser,
  setActiveModule,
  onSendToPurchasing,
}) {
  const [lists, setLists] = useState(() => {
    try {
      const saved = localStorage.getItem("chona_shopping_lists");
      if (!saved) return [];
      // Migrate old items (status + checked) → purchased boolean
      const parsed = JSON.parse(saved);
      return parsed.map(l => ({
        ...l,
        items: l.items.map(it => ({
          ...it,
          purchased: it.purchased !== undefined
            ? it.purchased
            : (it.status === "available" && it.checked === true),
        })),
      }));
    } catch { return []; }
  });

  const [activeList,   setActiveList]   = useState(null);
  const [modal,        setModal]        = useState(null); // "newList"|"editList"|"addItem"|"send"
  const [listForm,     setListForm]     = useState({ supplierId: "" });
  const [itemForm,     setItemForm]     = useState(blankItem());
  const [editItemId,   setEditItemId]   = useState(null);
  const [sendPreview,  setSendPreview]  = useState([]);
  const [filter,       setFilter]       = useState("all"); // "all"|"purchased"|"pending"
  const [showLowStock, setShowLowStock] = useState(true);

  useEffect(() => {
    localStorage.setItem("chona_shopping_lists", JSON.stringify(lists));
  }, [lists]);

  // ── Low-stock / out-of-stock products ─────────────────────────────────────
  const lowStockProducts = products
    .filter(p => p.stock === 0 || p.stock <= p.reorderLevel)
    .sort((a, b) => a.stock - b.stock);

  // ── List CRUD ──────────────────────────────────────────────────────────────
  const createList = () => {
    if (!listForm.supplierId) { alert("Please select a supplier."); return; }
    const creatorName = currentUser?.name || currentUser?.email || "User";
    const today       = new Date().toISOString().slice(0, 10);
    const newList = {
      id:          uid(),
      name:        creatorName,          // creator's name is the list name
      supplierId:  listForm.supplierId,
      createdAt:   today,
      createdBy:   creatorName,
      items:       [],
    };
    setLists(prev => [newList, ...prev]);
    setActiveList(newList.id);
    setModal(null);
  };

  const updateList = () => {
    if (!listForm.supplierId) { alert("Please select a supplier."); return; }
    setLists(prev => prev.map(l => l.id === activeList
      ? { ...l, supplierId: listForm.supplierId }
      : l
    ));
    setModal(null);
  };

  const deleteList = (id) => {
    if (!window.confirm("Delete this shopping list?")) return;
    setLists(prev => prev.filter(l => l.id !== id));
    if (activeList === id) setActiveList(null);
  };

  // ── Item CRUD ──────────────────────────────────────────────────────────────
  const saveItem = () => {
    if (!itemForm.name.trim() && !itemForm.productId) {
      alert("Please enter a product name or select an existing product."); return;
    }
    // Auto-set purchased=true if this product has been ordered before (has PO history)
    const hasPurchaseHistory = itemForm.productId
      ? purchaseOrders.some(po => po.items?.some(i => i.productId === itemForm.productId))
      : false;

    setLists(prev => prev.map(l => {
      if (l.id !== activeList) return l;
      const finalItem = {
        ...itemForm,
        purchased: editItemId ? itemForm.purchased : hasPurchaseHistory,
      };
      if (editItemId) {
        return { ...l, items: l.items.map(it => it.id === editItemId ? { ...finalItem, id: editItemId } : it) };
      }
      return { ...l, items: [...l.items, { ...finalItem, id: uid() }] };
    }));
    setModal(null);
    setEditItemId(null);
  };

  const deleteItem = (listId, itemId) => {
    setLists(prev => prev.map(l => l.id === listId
      ? { ...l, items: l.items.filter(it => it.id !== itemId) }
      : l
    ));
  };

  const togglePurchased = (listId, itemId) => {
    setLists(prev => prev.map(l => l.id === listId
      ? { ...l, items: l.items.map(it => it.id === itemId ? { ...it, purchased: !it.purchased } : it) }
      : l
    ));
  };

  const toggleSelectAll = () => {
    if (!currentList) return;
    const visibleIds    = filteredItems.map(it => it.id);
    const allPurchased  = visibleIds.every(id => currentList.items.find(it => it.id === id)?.purchased);
    setLists(prev => prev.map(l => l.id === activeList
      ? { ...l, items: l.items.map(it => visibleIds.includes(it.id) ? { ...it, purchased: !allPurchased } : it) }
      : l
    ));
  };

  // Quick-add a low-stock product to the current list
  const quickAddLowStock = (prod) => {
    if (!activeList) { alert("Please select or create a list first."); return; }
    const list = lists.find(l => l.id === activeList);
    if (list?.items.some(it => it.productId === prod.id)) {
      alert(`"${prod.name}" is already in this list.`); return;
    }
    const hasPurchaseHistory = purchaseOrders.some(po =>
      po.items?.some(i => i.productId === prod.id)
    );
    const suggestQty = Math.max(1, (prod.reorderLevel ?? 0) - prod.stock + 1);
    setLists(prev => prev.map(l => l.id === activeList
      ? { ...l, items: [...l.items, {
          id:         uid(),
          productId:  prod.id,
          name:       prod.name,
          qty:        suggestQty,
          unit:       prod.unit,
          supplierId: prod.supplierId || list?.supplierId || "",
          purchased:  hasPurchaseHistory,
          note:       "",
        }]}
      : l
    ));
  };

  // ── Send checked items to Purchasing ──────────────────────────────────────
  const openSend = () => {
    const list = lists.find(l => l.id === activeList);
    if (!list) return;
    const checked = list.items.filter(it => it.purchased);
    if (checked.length === 0) {
      alert("No items are checked. Tick at least one item to send to Purchasing.");
      return;
    }
    setSendPreview(checked);
    setModal("send");
  };

  const confirmSend = () => {
    const list = lists.find(l => l.id === activeList);
    if (!list) return;
    const poItems = sendPreview.map(it => ({
      isNew:       !it.productId,
      productId:   it.productId || "",
      name:        it.name || (products.find(p => p.id === it.productId)?.name ?? ""),
      qty:         +it.qty || 1,
      unitCost:    0,
      supplierId:  it.supplierId || list.supplierId,
      newName:     it.name,
      newCategory: "Other",
      newCost:     "",
      newPrice:    "",
      newStock:    0,
      newUnit:     it.unit || "piece",
    }));
    // Remove sent items; keep unchecked ones
    setLists(prev => prev.map(l => l.id === activeList
      ? { ...l, items: l.items.filter(it => !it.purchased) }
      : l
    ));
    setModal(null);
    if (onSendToPurchasing) onSendToPurchasing(poItems, list.supplierId);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentList    = lists.find(l => l.id === activeList) ?? null;
  const purchasedCount = currentList?.items.filter(it => it.purchased).length  ?? 0;
  const pendingCount   = currentList?.items.filter(it => !it.purchased).length ?? 0;

  const filteredItems = currentList
    ? currentList.items.filter(it =>
        filter === "all"       ? true
      : filter === "purchased" ? it.purchased
      :                          !it.purchased
      )
    : [];

  const allFilteredPurchased = filteredItems.length > 0 &&
    filteredItems.every(it => it.purchased);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: 0, height: "100%", minHeight: 0 }}>

      {/* ══ Left panel: list sidebar ══ */}
      <div style={{
        width: 260, flexShrink: 0, borderRight: "1px solid var(--color-border)",
        display: "flex", flexDirection: "column", background: "var(--color-surface)",
      }}>
        <div style={{ padding: "16px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            📋 Check Lists
          </div>
          <Btn size="sm" onClick={() => { setListForm({ supplierId: suppliers[0]?.id || "" }); setModal("newList"); }} icon="plus">
            New
          </Btn>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
          {lists.length === 0 && (
            <div style={{ padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              No lists yet.<br />Create one to start planning purchases.
            </div>
          )}
          {lists.map(l => {
            const sup      = suppliers.find(s => s.id === l.supplierId);
            const done     = l.items.filter(it => it.purchased).length;
            const pending  = l.items.filter(it => !it.purchased).length;
            const isActive = l.id === activeList;
            return (
              <div
                key={l.id}
                onClick={() => { setActiveList(l.id); setFilter("all"); }}
                style={{
                  padding: "10px 12px", borderRadius: 10, marginBottom: 4, cursor: "pointer",
                  background: isActive ? "#eef2ff" : "transparent",
                  border: isActive ? "1.5px solid #c7d2fe" : "1.5px solid transparent",
                  transition: "all .15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
                    🏪 {sup?.name || "No Supplier"}
                  </div>
                  <button
                    onMouseDown={e => { e.stopPropagation(); deleteList(l.id); }}
                    style={{ border: "none", background: "transparent", color: "#cbd5e1", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 0 0 6px" }}
                    title="Delete list"
                  >×</button>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                  👤 {l.createdBy || l.name}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {done    > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "#dcfce7", color: "#15803d" }}>✅ {done} purchased</span>}
                  {pending > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "#fef9c3", color: "#92400e" }}>⏳ {pending} pending</span>}
                  {l.items.length === 0 && <span style={{ fontSize: 11, color: "#cbd5e1" }}>Empty</span>}
                </div>
                <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>{l.createdAt}</div>
              </div>
            );
          })}
        </div>

        {/* ── Low Stock Suggestions Panel ── */}
        {lowStockProducts.length > 0 && (
          <div style={{ borderTop: "1px solid var(--color-border)", background: "#fffbeb" }}>
            <button
              onClick={() => setShowLowStock(v => !v)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 14px", border: "none", background: "transparent",
                cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#92400e",
              }}
            >
              <span>⚠️ Low Stock ({lowStockProducts.length})</span>
              <span style={{ fontSize: 10, color: "#b45309" }}>{showLowStock ? "▲" : "▼"}</span>
            </button>
            {showLowStock && (
              <div style={{ maxHeight: 200, overflowY: "auto", padding: "0 8px 10px" }}>
                <div style={{ fontSize: 10, color: "#b45309", padding: "0 6px 6px", fontWeight: 600 }}>
                  Tap + to add to active list
                </div>
                {lowStockProducts.map(prod => {
                  const meta   = CATEGORY_META[prod.category] ?? CATEGORY_META["Other"];
                  const inList = currentList?.items.some(it => it.productId === prod.id);
                  return (
                    <div key={prod.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 8px", borderRadius: 8, marginBottom: 3,
                      background: inList ? "#f0fdf4" : "#fff",
                      border: `1px solid ${inList ? "#86efac" : "#fde68a"}`,
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{meta.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: prod.stock === 0 ? "#dc2626" : "#92400e" }}>
                          {prod.stock === 0 ? "Out of stock" : `${prod.stock} ${prod.unit}s left`}
                        </div>
                      </div>
                      {inList ? (
                        <span style={{ fontSize: 10, color: "#15803d", fontWeight: 700, flexShrink: 0 }}>✓ In list</span>
                      ) : (
                        <button
                          onClick={() => quickAddLowStock(prod)}
                          disabled={!activeList}
                          title={activeList ? `Add "${prod.name}" to current list` : "Select a list first"}
                          style={{
                            flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                            border: "none",
                            background: activeList ? "#f59e0b" : "#e2e8f0",
                            color: activeList ? "#fff" : "#94a3b8",
                            cursor: activeList ? "pointer" : "not-allowed",
                            fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 900, lineHeight: 1,
                          }}
                        >+</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ Right panel: list detail ══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {!currentList ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#94a3b8" }}>
            <div style={{ fontSize: 48 }}>🛒</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Select or create a buy list</div>
            <div style={{ fontSize: 13 }}>Plan your next purchases without committing to a PO yet.</div>
            <Btn onClick={() => { setListForm({ supplierId: suppliers[0]?.id || "" }); setModal("newList"); }} icon="plus">
              Create First List
            </Btn>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="page-header" style={{ borderBottom: "1px solid var(--color-border)", padding: "14px 20px", marginBottom: 0 }}>
              <div>
                <h1 className="page-header__title" style={{ fontSize: 18 }}>
                  🏪 {suppliers.find(s => s.id === currentList.supplierId)?.name || "No Supplier"}
                </h1>
                <p className="page-header__sub">
                  👤 {currentList.createdBy || currentList.name} · {currentList.createdAt} ·{" "}
                  {currentList.items.length} item{currentList.items.length !== 1 ? "s" : ""} ·{" "}
                  <span style={{ color: "#15803d" }}>✅ {purchasedCount} purchased</span> ·{" "}
                  <span style={{ color: "#92400e" }}>⏳ {pendingCount} pending</span>
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="secondary" size="sm" onClick={() => {
                  setListForm({ supplierId: currentList.supplierId });
                  setModal("editList");
                }}>
                  <Icon name="edit" size={13} /> Edit
                </Btn>
                <Btn size="sm" onClick={() => { setItemForm(blankItem(currentList.supplierId)); setEditItemId(null); setModal("addItem"); }} icon="plus">
                  Add Item
                </Btn>
                {purchasedCount > 0 && (
                  <Btn size="sm" variant="success" onClick={openSend}>
                    🛍️ Send {purchasedCount} to Purchasing
                  </Btn>
                )}
              </div>
            </div>

            {/* Legend */}
            <div style={{ padding: "8px 20px", background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", gap: 16, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
              <span>☑️ <strong>Check</strong> items that are purchased or ready to order</span>
              <span>· Unchecked items stay for next session</span>
              <span>· Only checked items go to Purchasing</span>
            </div>

            {/* Filter bar */}
            <div style={{
              padding: "10px 20px", borderBottom: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: "#fff",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginRight: 4 }}>Show:</span>
              {[
                { key: "all",       label: "All Items",         emoji: "📋", activeBg: "#eef2ff", activeBorder: "#c7d2fe", activeText: "#4338ca" },
                { key: "purchased", label: "Purchased / Ready", emoji: "✅", activeBg: "#dcfce7", activeBorder: "#86efac", activeText: "#15803d" },
                { key: "pending",   label: "Still Needed",      emoji: "⏳", activeBg: "#fef9c3", activeBorder: "#fde047", activeText: "#92400e" },
              ].map(({ key, label, emoji, activeBg, activeBorder, activeText }) => {
                const isActive = filter === key;
                const count = key === "all" ? currentList.items.length : key === "purchased" ? purchasedCount : pendingCount;
                return (
                  <button key={key} onClick={() => setFilter(key)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all .15s",
                    border: `1.5px solid ${isActive ? activeBorder : "var(--color-border,#e2e8f0)"}`,
                    background: isActive ? activeBg : "#f8fafc",
                    color: isActive ? activeText : "#64748b",
                    boxShadow: isActive ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  }}>
                    <span>{emoji}</span>
                    <span>{label}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, minWidth: 17, textAlign: "center",
                      padding: "1px 5px", borderRadius: 99,
                      background: isActive ? "rgba(0,0,0,.08)" : "#e2e8f0",
                      color: isActive ? activeText : "#475569",
                    }}>{count}</span>
                  </button>
                );
              })}

              {/* Select All / Deselect All */}
              {filteredItems.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  style={{
                    marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 13px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all .15s",
                    border: `1.5px solid ${allFilteredPurchased ? "#fca5a5" : "#a5b4fc"}`,
                    background: allFilteredPurchased ? "#fef2f2" : "#eef2ff",
                    color: allFilteredPurchased ? "#dc2626" : "#4338ca",
                  }}
                >
                  <span>{allFilteredPurchased ? "☐" : "☑"}</span>
                  <span>{allFilteredPurchased ? "Uncheck All" : "Check All"}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "1px 5px", borderRadius: 99,
                    background: allFilteredPurchased ? "rgba(220,38,38,.12)" : "rgba(99,102,241,.12)",
                    color: allFilteredPurchased ? "#dc2626" : "#4338ca",
                  }}>{filteredItems.length}</span>
                </button>
              )}
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
              {currentList.items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>No items yet</div>
                  <div style={{ fontSize: 13, marginBottom: 16 }}>Add products you plan to purchase.</div>
                  <Btn onClick={() => { setItemForm(blankItem(currentList.supplierId)); setEditItemId(null); setModal("addItem"); }} icon="plus">
                    Add First Item
                  </Btn>
                </div>
              ) : filteredItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{filter === "purchased" ? "✅" : "⏳"}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    No {filter === "purchased" ? "purchased" : "pending"} items
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 16 }}>
                    {filter === "purchased"
                      ? "Check items to mark them as purchased / ready."
                      : "All items are checked — ready to send to Purchasing!"}
                  </div>
                  <button
                    onClick={() => setFilter("all")}
                    style={{ fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 8, border: "1.5px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", cursor: "pointer" }}
                  >Show All Items</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Unchecked (pending) first, checked (purchased) last */}
                  {[...filteredItems]
                    .sort((a, b) => Number(a.purchased) - Number(b.purchased))
                    .map(item => {
                      const prod       = products.find(p => p.id === item.productId);
                      const sup        = suppliers.find(s => s.id === item.supplierId);
                      const meta       = prod ? (CATEGORY_META[prod.category] ?? CATEGORY_META["Other"]) : CATEGORY_META["Other"];
                      const isOut      = prod && prod.stock === 0;
                      const isLow      = prod && !isOut && prod.stock <= prod.reorderLevel;

                      return (
                        <div key={item.id} style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "12px 14px", borderRadius: 10,
                          background: item.purchased
                            ? "#f0fdf4"
                            : isOut ? "#fff5f5"
                            : isLow ? "#fffbeb"
                            : "var(--color-surface)",
                          border: `1.5px solid ${
                            item.purchased ? "#86efac"
                            : isOut ? "#fca5a5"
                            : isLow ? "#fde68a"
                            : "var(--color-border)"
                          }`,
                          opacity: item.purchased ? 0.72 : 1,
                          transition: "all .15s",
                        }}>

                          {/* ── Checkbox only — replaces the old Available/Pending button ── */}
                          <div style={{ paddingTop: 3, flexShrink: 0 }}>
                            <input
                              type="checkbox"
                              checked={!!item.purchased}
                              onChange={() => togglePurchased(currentList.id, item.id)}
                              title={item.purchased
                                ? "Uncheck — still needed"
                                : "Check — purchased / ready to order"}
                              style={{ width: 17, height: 17, cursor: "pointer", accentColor: "#22c55e" }}
                            />
                          </div>

                          {/* Emoji */}
                          <span style={{ fontSize: 22, flexShrink: 0, paddingTop: 1 }}>{meta.emoji}</span>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{
                                fontSize: 14, fontWeight: 700,
                                color: item.purchased ? "#15803d" : "var(--color-text-primary)",
                                textDecoration: item.purchased ? "line-through" : "none",
                              }}>
                                {prod ? prod.name : item.name || "—"}
                              </span>
                              {prod && <span style={{ fontSize: 11, color: "#94a3b8" }}>{prod.sku}</span>}
                              {/* Stock pill — always shown for linked products */}
                              {prod && <StockPill prod={prod} />}
                            </div>

                            {/* Details row */}
                            <div style={{ display: "flex", gap: 12, marginTop: 5, fontSize: 12, color: "#64748b", flexWrap: "wrap", alignItems: "center" }}>
                              <span>Qty: <strong>{item.qty} {item.unit}{item.qty !== 1 ? "s" : ""}</strong></span>
                              {prod && (
                                <span>Unit: <strong>{prod.unit}</strong></span>
                              )}
                              {/* Current stock — always visible for linked products */}
                              {prod && (
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  Stock:{" "}
                                  <strong style={{ color: isOut ? "#dc2626" : isLow ? "#92400e" : "#15803d" }}>
                                    {prod.stock} {prod.unit}s
                                  </strong>
                                  {isOut && (
                                    <span style={{ fontSize: 10, background: "#fee2e2", color: "#dc2626", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>
                                      OUT
                                    </span>
                                  )}
                                  {isLow && (
                                    <span style={{ fontSize: 10, background: "#fef9c3", color: "#92400e", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>
                                      LOW
                                    </span>
                                  )}
                                </span>
                              )}
                              {sup && <span>🏪 {sup.name}</span>}
                              {item.note && <span style={{ fontStyle: "italic" }}>"{item.note}"</span>}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                            <Btn size="sm" variant="secondary" onClick={() => {
                              setItemForm({ ...item });
                              setEditItemId(item.id);
                              setModal("addItem");
                            }}>
                              <Icon name="edit" size={12} />
                            </Btn>
                            <Btn size="sm" variant="danger" onClick={() => deleteItem(currentList.id, item.id)}>
                              <Icon name="trash" size={12} />
                            </Btn>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ══ New / Edit List Modal ══ */}
      <Modal
        open={modal === "newList" || modal === "editList"}
        onClose={() => setModal(null)}
        title={modal === "newList" ? "New Buy List" : "Edit List"}
        maxWidth={440}
      >
        {/* Auto-name preview banner */}
        {modal === "newList" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 8, marginBottom: 16,
            background: "#eef2ff", border: "1px solid #c7d2fe",
            fontSize: 13, color: "#4338ca",
          }}>
            <span style={{ fontSize: 18 }}>👤</span>
            <div>
              <div style={{ fontWeight: 700 }}>
                List name: <span style={{ color: "#4f46e5" }}>{currentUser?.name || currentUser?.email || "User"}</span>
              </div>
              <div style={{ fontSize: 11, color: "#6366f1", marginTop: 1 }}>
                Automatically set to your name
              </div>
            </div>
          </div>
        )}

        <Field label="Supplier" required>
          <select
            className="select"
            value={listForm.supplierId}
            onChange={e => setListForm(f => ({ ...f, supplierId: e.target.value }))}
            autoFocus
          >
            <option value="">— Select a supplier —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={modal === "newList" ? createList : updateList}>
            {modal === "newList" ? "Create List" : "Save Changes"}
          </Btn>
        </div>
      </Modal>

      {/* ══ Add / Edit Item Modal ══ */}
      <Modal
        open={modal === "addItem"}
        onClose={() => { setModal(null); setEditItemId(null); }}
        title={editItemId ? "Edit Item" : "Add Item to List"}
        maxWidth={520}
      >
        <Field label="Product (existing)">
          <ProductSearchInput
            products={products}
            value={itemForm.productId}
            onChange={(id, name) => {
              const prod = products.find(p => p.id === id);
              setItemForm(f => ({
                ...f,
                productId: id,
                name:      id ? (prod?.name ?? name) : f.name,
                unit:      id ? (prod?.unit ?? f.unit) : f.unit,
              }));
            }}
            placeholder="Link to existing product (optional)…"
          />
        </Field>

        {/* Linked product stock preview */}
        {itemForm.productId && (() => {
          const prod  = products.find(p => p.id === itemForm.productId);
          if (!prod) return null;
          const isOut = prod.stock === 0;
          const isLow = !isOut && prod.stock <= prod.reorderLevel;
          return (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8, marginBottom: 4,
              background: isOut ? "#fff5f5" : isLow ? "#fffbeb" : "#f0fdf4",
              border: `1px solid ${isOut ? "#fca5a5" : isLow ? "#fde68a" : "#86efac"}`,
              fontSize: 12,
            }}>
              <span style={{ fontSize: 18 }}>{(CATEGORY_META[prod.category] ?? CATEGORY_META["Other"]).emoji}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{prod.name}</span>
                <span style={{ color: "#64748b" }}> · {prod.unit} · {prod.sku}</span>
              </div>
              <StockPill prod={prod} />
            </div>
          );
        })()}

        {!itemForm.productId && (
          <Field label="Product Name" required>
            <input
              className="input"
              placeholder="e.g. San Mig Light 1L"
              value={itemForm.name}
              onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
            />
          </Field>
        )}

        <div className="form-grid-2">
          <Field label="Quantity">
            <input className="input" type="number" min={1} value={itemForm.qty}
              onChange={e => setItemForm(f => ({ ...f, qty: e.target.value }))} />
          </Field>
          <Field label="Unit">
            <select className="select" value={itemForm.unit}
              onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))}>
              {["piece", "pack", "bottle", "box", "bag", "sachet", "can", "kg", "liter"].map(u =>
                <option key={u} value={u}>{u}</option>
              )}
            </select>
          </Field>
        </div>

        <Field label="Supplier">
          <select className="select" value={itemForm.supplierId}
            onChange={e => setItemForm(f => ({ ...f, supplierId: e.target.value }))}>
            <option value="">— inherit from list —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        {/* Purchased checkbox */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 8, marginBottom: 4,
          background: itemForm.purchased ? "#f0fdf4" : "#f8fafc",
          border: `1px solid ${itemForm.purchased ? "#86efac" : "#e2e8f0"}`,
        }}>
          <input
            type="checkbox"
            id="item-purchased"
            checked={!!itemForm.purchased}
            onChange={e => setItemForm(f => ({ ...f, purchased: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#22c55e" }}
          />
          <label htmlFor="item-purchased" style={{
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            color: itemForm.purchased ? "#15803d" : "var(--color-text-primary)",
          }}>
            {itemForm.purchased ? "✅ Purchased / ready to order" : "⏳ Still needed (pending)"}
          </label>
        </div>

        <Field label="Note (optional)">
          <input className="input" placeholder="e.g. needs restocking asap"
            value={itemForm.note}
            onChange={e => setItemForm(f => ({ ...f, note: e.target.value }))} />
        </Field>

        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => { setModal(null); setEditItemId(null); }}>Cancel</Btn>
          <Btn onClick={saveItem}>{editItemId ? "Save Changes" : "Add to List"}</Btn>
        </div>
      </Modal>

      {/* ══ Send to Purchasing Preview Modal ══ */}
      <Modal
        open={modal === "send"}
        onClose={() => setModal(null)}
        title="Send to Purchasing"
        maxWidth={560}
      >
        <div style={{
          background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 8,
          padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1d4ed8", fontWeight: 600,
        }}>
          🛍️ <strong>{sendPreview.length}</strong> checked item{sendPreview.length !== 1 ? "s" : ""} will be sent to Purchasing as a new PO. Unchecked items stay in the list.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {sendPreview.map(it => {
            const prod = products.find(p => p.id === it.productId);
            const sup  = suppliers.find(s => s.id === (it.supplierId || currentList?.supplierId));
            const meta = prod ? (CATEGORY_META[prod.category] ?? CATEGORY_META["Other"]) : CATEGORY_META["Other"];
            return (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{prod ? prod.name : it.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Qty: {it.qty} {it.unit}{it.qty !== 1 ? "s" : ""}
                    {sup  && ` · ${sup.name}`}
                    {prod && ` · Stock: ${prod.stock} ${prod.unit}s`}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#dcfce7", color: "#15803d" }}>✅ Ready</span>
              </div>
            );
          })}
        </div>

        <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400e", marginBottom: 16 }}>
          ⏳ Unchecked items will remain in this list for your next purchasing session.
        </div>

        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={confirmSend}>✅ Confirm & Open Purchasing</Btn>
        </div>
      </Modal>
    </div>
  );
}