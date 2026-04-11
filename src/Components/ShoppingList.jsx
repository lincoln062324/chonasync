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

// ─── Searchable product autocomplete (same pattern as PurchasingManagement) ──
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
            const meta = CATEGORY_META[p.category] ?? CATEGORY_META["Other"];
            return (
              <div key={p.id} onMouseDown={() => pick(p)}
                style={{ padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{highlight(p.name)}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{p.sku} · {p.category}</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: p.stock === 0 ? "#fee2e2" : p.stock <= p.reorderLevel ? "#fef9c3" : "#dcfce7", color: p.stock === 0 ? "#dc2626" : p.stock <= p.reorderLevel ? "#92400e" : "#15803d" }}>
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

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  available: { label: "Available",  color: "green",  bg: "#dcfce7", border: "#86efac", text: "#15803d", emoji: "✅" },
  pending:   { label: "Pending",    color: "yellow", bg: "#fef9c3", border: "#fde047", text: "#92400e", emoji: "⏳" },
};

// ─── Blank list item ──────────────────────────────────────────────────────────
function blankItem(supplierId = "") {
  return {
    id:         uid(),
    productId:  "",      // linked existing product (optional)
    name:       "",      // free-text name (if not linked)
    qty:        1,
    unit:       "piece",
    supplierId,
    status:     "pending",
    note:       "",
    checked:    false,   // checked = user confirmed it's available to purchase
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ShoppingList({
  products,
  suppliers,
  setActiveModule,
  onSendToPurchasing,   // (items, supplierId) → void — navigates to Purchasing with prefill
}) {
  // Persist lists in localStorage so they survive page reloads
  const [lists, setLists] = useState(() => {
    try {
      const saved = localStorage.getItem("chona_shopping_lists");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [activeList,   setActiveList]   = useState(null);  // currently open list id
  const [modal,        setModal]        = useState(null);  // "newList" | "editList" | "addItem" | "editItem" | "send"
  const [listForm,     setListForm]     = useState({ name: "", supplierId: "" });
  const [itemForm,     setItemForm]     = useState(blankItem());
  const [editItemId,   setEditItemId]   = useState(null);
  const [sendPreview,  setSendPreview]  = useState([]);
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "available" | "pending"

  // Persist on every change
  useEffect(() => {
    localStorage.setItem("chona_shopping_lists", JSON.stringify(lists));
  }, [lists]);

  // ── List CRUD ──────────────────────────────────────────────────────────────
  const createList = () => {
    if (!listForm.name.trim()) { alert("Please enter a list name."); return; }
    const newList = {
      id:         uid(),
      name:       listForm.name.trim(),
      supplierId: listForm.supplierId,
      createdAt:  new Date().toISOString().slice(0, 10),
      items:      [],
    };
    setLists(prev => [newList, ...prev]);
    setActiveList(newList.id);
    setModal(null);
  };

  const updateList = () => {
    setLists(prev => prev.map(l => l.id === activeList
      ? { ...l, name: listForm.name.trim(), supplierId: listForm.supplierId }
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
    setLists(prev => prev.map(l => {
      if (l.id !== activeList) return l;
      if (editItemId) {
        return { ...l, items: l.items.map(it => it.id === editItemId ? { ...itemForm, id: editItemId } : it) };
      }
      return { ...l, items: [...l.items, { ...itemForm, id: uid() }] };
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

  const toggleCheck = (listId, itemId) => {
    setLists(prev => prev.map(l => l.id === listId
      ? { ...l, items: l.items.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it) }
      : l
    ));
  };

  const setItemStatus = (listId, itemId, status) => {
    setLists(prev => prev.map(l => l.id === listId
      ? { ...l, items: l.items.map(it => it.id === itemId ? { ...it, status } : it) }
      : l
    ));
  };

  // ── Select / deselect all visible available items ─────────────────────────
  const toggleSelectAll = () => {
    if (!currentList) return;
    // Only available items in the current filter view can be selected
    const visibleAvailIds = currentList.items
      .filter(it => it.status === "available" && (statusFilter === "all" || statusFilter === "available"))
      .map(it => it.id);
    const allChecked = visibleAvailIds.every(id =>
      currentList.items.find(it => it.id === id)?.checked
    );
    setLists(prev => prev.map(l => l.id === activeList
      ? { ...l, items: l.items.map(it =>
          visibleAvailIds.includes(it.id) ? { ...it, checked: !allChecked } : it
        )}
      : l
    ));
  };

  // ── Send checked Available items to Purchasing ─────────────────────────────
  const openSend = () => {
    const list    = lists.find(l => l.id === activeList);
    if (!list) return;
    const checked = list.items.filter(it => it.checked && it.status === "available");
    if (checked.length === 0) {
      alert("No items are checked as Available. Check at least one available item to send to Purchasing.");
      return;
    }
    setSendPreview(checked);
    setModal("send");
  };

  const confirmSend = () => {
    const list    = lists.find(l => l.id === activeList);
    if (!list) return;
    // Build PO items: link to existing product if productId set, else use name
    const poItems = sendPreview.map(it => ({
      isNew:      !it.productId,
      productId:  it.productId || "",
      name:       it.name || (products.find(p => p.id === it.productId)?.name ?? ""),
      qty:        +it.qty || 1,
      unitCost:   0,
      supplierId: it.supplierId || list.supplierId,
      // new product fields (if no productId)
      newName:    it.name,
      newCategory:"Other",
      newCost:    "",
      newPrice:   "",
      newStock:   0,
      newUnit:    it.unit || "piece",
    }));

    // Remove only checked+available items from the list; pending stay
    setLists(prev => prev.map(l => l.id === activeList
      ? { ...l, items: l.items.filter(it => !(it.checked && it.status === "available")) }
      : l
    ));

    setModal(null);
    if (onSendToPurchasing) onSendToPurchasing(poItems, list.supplierId);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentList    = lists.find(l => l.id === activeList) ?? null;
  const checkedCount   = currentList?.items.filter(it => it.checked && it.status === "available").length ?? 0;
  const pendingCount   = currentList?.items.filter(it => it.status === "pending").length ?? 0;
  const availableCount = currentList?.items.filter(it => it.status === "available").length ?? 0;

  // Items that can be batch-selected (available + within current filter view)
  const selectableIds = currentList?.items
    .filter(it => it.status === "available" && (statusFilter === "all" || statusFilter === "available"))
    .map(it => it.id) ?? [];
  const allSelectableChecked = selectableIds.length > 0 &&
    selectableIds.every(id => currentList.items.find(it => it.id === id)?.checked);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: 0, height: "100%", minHeight: 0 }}>

      {/* ══ Left panel: list of shopping lists ══ */}
      <div style={{
        width: 260, flexShrink: 0, borderRight: "1px solid var(--color-border)",
        display: "flex", flexDirection: "column", background: "var(--color-surface)",
      }}>
        <div style={{ padding: "16px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            📋 Buy Lists
          </div>
          <Btn size="sm" onClick={() => { setListForm({ name: "", supplierId: suppliers[0]?.id || "" }); setModal("newList"); }} icon="plus">
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
            const sup        = suppliers.find(s => s.id === l.supplierId);
            const avail      = l.items.filter(it => it.status === "available").length;
            const pend       = l.items.filter(it => it.status === "pending").length;
            const isActive   = l.id === activeList;
            return (
              <div
                key={l.id}
                onClick={() => { setActiveList(l.id); setStatusFilter("all"); }}
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 3 }}>{l.name}</div>
                  <button
                    onMouseDown={e => { e.stopPropagation(); deleteList(l.id); }}
                    style={{ border: "none", background: "transparent", color: "#cbd5e1", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 0 0 6px" }}
                    title="Delete list"
                  >×</button>
                </div>
                {sup && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>🏪 {sup.name}</div>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {avail > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "#dcfce7", color: "#15803d" }}>✅ {avail} available</span>}
                  {pend  > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "#fef9c3", color: "#92400e" }}>⏳ {pend} pending</span>}
                  {l.items.length === 0 && <span style={{ fontSize: 11, color: "#cbd5e1" }}>Empty</span>}
                </div>
                <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>{l.createdAt}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ Right panel: selected list items ══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {!currentList ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#94a3b8" }}>
            <div style={{ fontSize: 48 }}>🛒</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Select or create a buy list</div>
            <div style={{ fontSize: 13 }}>Plan your next purchases without committing to a PO yet.</div>
            <Btn onClick={() => { setListForm({ name: "", supplierId: suppliers[0]?.id || "" }); setModal("newList"); }} icon="plus">
              Create First List
            </Btn>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="page-header" style={{ borderBottom: "1px solid var(--color-border)", padding: "14px 20px", marginBottom: 0 }}>
              <div>
                <h1 className="page-header__title" style={{ fontSize: 18 }}>{currentList.name}</h1>
                <p className="page-header__sub">
                  {currentList.items.length} item{currentList.items.length !== 1 ? "s" : ""} ·{" "}
                  <span style={{ color: "#15803d" }}>✅ {availableCount} available</span> ·{" "}
                  <span style={{ color: "#92400e" }}>⏳ {pendingCount} pending</span>
                  {suppliers.find(s => s.id === currentList.supplierId) && (
                    <> · 🏪 {suppliers.find(s => s.id === currentList.supplierId)?.name}</>
                  )}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="secondary" size="sm" onClick={() => {
                  setListForm({ name: currentList.name, supplierId: currentList.supplierId });
                  setModal("editList");
                }}>
                  <Icon name="edit" size={13} /> Edit
                </Btn>
                <Btn size="sm" onClick={() => { setItemForm(blankItem(currentList.supplierId)); setEditItemId(null); setModal("addItem"); }} icon="plus">
                  Add Item
                </Btn>
                {checkedCount > 0 && (
                  <Btn size="sm" variant="success" onClick={openSend}>
                    🛍️ Send {checkedCount} to Purchasing
                  </Btn>
                )}
              </div>
            </div>

            {/* Legend */}
            <div style={{ padding: "8px 20px", background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", gap: 16, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
              <span>☑️ Check items that are <strong>available</strong> to purchase now</span>
              <span>· Pending items stay for next time</span>
              <span>· Only checked Available items go to Purchasing</span>
            </div>

            {/* ── Filter bar ── */}
            <div style={{
              padding: "10px 20px", borderBottom: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              background: "#fff",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginRight: 4 }}>Show:</span>
              {[
                { key: "all",       label: "All Items",       emoji: "📋", activeBg: "#eef2ff", activeBorder: "#c7d2fe", activeText: "#4338ca" },
                { key: "available", label: "Available Only",  emoji: "✅", activeBg: "#dcfce7", activeBorder: "#86efac", activeText: "#15803d" },
                { key: "pending",   label: "Pending Only",    emoji: "⏳", activeBg: "#fef9c3", activeBorder: "#fde047", activeText: "#92400e" },
              ].map(({ key, label, emoji, activeBg, activeBorder, activeText }) => {
                const isActive = statusFilter === key;
                // compute counts for badges
                const count = key === "all"
                  ? currentList.items.length
                  : currentList.items.filter(it => it.status === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", transition: "all .15s",
                      border: `1.5px solid ${isActive ? activeBorder : "var(--color-border,#e2e8f0)"}`,
                      background: isActive ? activeBg : "#f8fafc",
                      color: isActive ? activeText : "#64748b",
                      boxShadow: isActive ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                    }}
                  >
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

              {/* Select All / Deselect All — only shown when there are selectable available items */}
              {selectableIds.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  style={{
                    marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 13px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all .15s",
                    border: `1.5px solid ${allSelectableChecked ? "#fca5a5" : "#a5b4fc"}`,
                    background: allSelectableChecked ? "#fef2f2" : "#eef2ff",
                    color: allSelectableChecked ? "#dc2626" : "#4338ca",
                  }}
                  title={allSelectableChecked ? "Deselect all available items" : "Select all available items"}
                >
                  <span>{allSelectableChecked ? "☐" : "☑"}</span>
                  <span>{allSelectableChecked ? "Deselect All" : "Select All"}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "1px 5px", borderRadius: 99,
                    background: allSelectableChecked ? "rgba(220,38,38,.12)" : "rgba(99,102,241,.12)",
                    color: allSelectableChecked ? "#dc2626" : "#4338ca",
                  }}>{selectableIds.length}</span>
                </button>
              )}
            </div>

            {/* Items list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
              {(() => {
                const filteredItems = currentList.items.filter(it =>
                  statusFilter === "all" ? true : it.status === statusFilter
                );
                const allEmpty = currentList.items.length === 0;
                const filterEmpty = !allEmpty && filteredItems.length === 0;
                return allEmpty ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No items yet</div>
                    <div style={{ fontSize: 13, marginBottom: 16 }}>Add products you plan to purchase.</div>
                    <Btn onClick={() => { setItemForm(blankItem(currentList.supplierId)); setEditItemId(null); setModal("addItem"); }} icon="plus">
                      Add First Item
                    </Btn>
                  </div>
                ) : filterEmpty ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>
                      {statusFilter === "available" ? "✅" : "⏳"}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      No {statusFilter === "available" ? "available" : "pending"} items
                    </div>
                    <div style={{ fontSize: 13, marginBottom: 16 }}>
                      {statusFilter === "available"
                        ? "Mark items as Available to see them here."
                        : "All items are marked as Available — great!"}
                    </div>
                    <button
                      onClick={() => setStatusFilter("all")}
                      style={{
                        fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 8,
                        border: "1.5px solid #c7d2fe", background: "#eef2ff", color: "#4338ca",
                        cursor: "pointer",
                      }}
                    >Show All Items</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Sort: available first, then pending */}
                  {[...filteredItems]
                    .sort((a, b) => {
                      if (a.status === b.status) return 0;
                      return a.status === "available" ? -1 : 1;
                    })
                    .map(item => {
                      const prod   = products.find(p => p.id === item.productId);
                      const sup    = suppliers.find(s => s.id === item.supplierId);
                      const meta   = prod ? (CATEGORY_META[prod.category] ?? CATEGORY_META["Other"]) : CATEGORY_META["Other"];
                      const sMeta  = STATUS_META[item.status];
                      const isAvail = item.status === "available";

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            padding: "12px 14px", borderRadius: 10,
                            background: item.checked ? "#f0fdf4" : "var(--color-surface)",
                            border: `1.5px solid ${item.checked ? "#86efac" : "var(--color-border)"}`,
                            opacity: item.status === "pending" ? 0.85 : 1,
                            transition: "all .15s",
                          }}
                        >
                          {/* Checkbox — only enabled for available items */}
                          <div style={{ paddingTop: 2, flexShrink: 0 }}>
                            <input
                              type="checkbox"
                              checked={item.checked}
                              disabled={!isAvail}
                              onChange={() => isAvail && toggleCheck(currentList.id, item.id)}
                              title={isAvail ? "Check to include in purchase" : "Mark as Available first"}
                              style={{ width: 17, height: 17, cursor: isAvail ? "pointer" : "not-allowed", accentColor: "#22c55e" }}
                            />
                          </div>

                          {/* Emoji */}
                          <span style={{ fontSize: 22, flexShrink: 0, paddingTop: 1 }}>{meta.emoji}</span>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{
                                fontSize: 14, fontWeight: 700,
                                color: item.checked ? "#15803d" : "var(--color-text-primary)",
                                textDecoration: item.checked ? "none" : "none",
                              }}>
                                {prod ? prod.name : item.name || "—"}
                              </span>
                              {prod && <span style={{ fontSize: 11, color: "#94a3b8" }}>{prod.sku}</span>}
                              {/* Status badge */}
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                                background: sMeta.bg, color: sMeta.text, border: `1px solid ${sMeta.border}`,
                              }}>
                                {sMeta.emoji} {sMeta.label}
                              </span>
                            </div>

                            <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                              <span>Qty: <strong>{item.qty} {item.unit}s</strong></span>
                              {sup && <span>🏪 {sup.name}</span>}
                              {item.note && <span style={{ fontStyle: "italic" }}>"{item.note}"</span>}
                              {prod && (
                                <span>
                                  Current stock:{" "}
                                  <strong style={{ color: prod.stock === 0 ? "#dc2626" : prod.stock <= prod.reorderLevel ? "#92400e" : "#15803d" }}>
                                    {prod.stock}
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                            {/* Toggle status */}
                            <button
                              onClick={() => setItemStatus(currentList.id, item.id, isAvail ? "pending" : "available")}
                              title={isAvail ? "Mark as Pending" : "Mark as Available"}
                              style={{
                                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                                border: `1px solid ${isAvail ? "#fde047" : "#86efac"}`,
                                background: isAvail ? "#fef9c3" : "#dcfce7",
                                color: isAvail ? "#92400e" : "#15803d",
                                cursor: "pointer",
                              }}
                            >
                              {isAvail ? "⏳ Pending" : "✅ Available"}
                            </button>
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
                );
              })()}
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
        <Field label="List Name" required>
          <input
            className="input"
            placeholder="e.g. Weekly Restocking, Cigarette Run…"
            value={listForm.name}
            onChange={e => setListForm(f => ({ ...f, name: e.target.value }))}
            autoFocus
          />
        </Field>
        <Field label="Default Supplier">
          <select
            className="select"
            value={listForm.supplierId}
            onChange={e => setListForm(f => ({ ...f, supplierId: e.target.value }))}
          >
            <option value="">— No supplier —</option>
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
            onChange={(id, name) => setItemForm(f => ({
              ...f,
              productId: id,
              name:      id ? (products.find(p => p.id === id)?.name ?? name) : f.name,
              unit:      id ? (products.find(p => p.id === id)?.unit ?? f.unit) : f.unit,
            }))}
            placeholder="Link to existing product (optional)…"
          />
        </Field>

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

        <div className="form-grid-2">
          <Field label="Supplier">
            <select className="select" value={itemForm.supplierId}
              onChange={e => setItemForm(f => ({ ...f, supplierId: e.target.value }))}>
              <option value="">— inherit from list —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="select" value={itemForm.status}
              onChange={e => setItemForm(f => ({ ...f, status: e.target.value }))}>
              <option value="pending">⏳ Pending</option>
              <option value="available">✅ Available</option>
            </select>
          </Field>
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
          🛍️ These <strong>{sendPreview.length}</strong> checked Available item{sendPreview.length !== 1 ? "s" : ""} will be sent to Purchasing as a new PO. Pending items stay in the list.
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
                    Qty: {it.qty} {it.unit}s
                    {sup && ` · ${sup.name}`}
                    {prod && ` · Stock: ${prod.stock}`}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#dcfce7", color: "#15803d" }}>✅ Available</span>
              </div>
            );
          })}
        </div>

        <div style={{
          background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8,
          padding: "8px 12px", fontSize: 12, color: "#92400e", marginBottom: 16,
        }}>
          ⏳ Pending items will remain in this list for your next purchasing session.
        </div>

        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={confirmSend}>✅ Confirm & Open Purchasing</Btn>
        </div>
      </Modal>
    </div>
  );
}