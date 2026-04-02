import { useState } from "react";
import Icon from "../Components/Icon";
import { Badge, Btn, Modal, Field } from "../Components/Primitives";
import { CATEGORIES, CATEGORY_META } from "../data/constants";

// ── SKU prefix per category ────────────────────────────────────────────────
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

function generateSKU(category, existingProducts) {
  const prefix  = SKU_PREFIX[category] ?? "OTH";
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, "i");
  let max = 0;
  for (const p of existingProducts) {
    const m = p.sku?.match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export default function StockManagement({
  products,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) {
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modal,     setModal]     = useState(null);  // "add" | "edit" | "adjust" | null
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState({});

  // ── Category counts for the sidebar ───────────────────────────────────────
  const categoryCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = products.filter(p => p.category === c).length;
    return acc;
  }, {});
  const totalCount = products.length;

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = products.filter(p =>
    (catFilter === "All" || p.category === catFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // ── Modal openers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    const initialCategory = catFilter !== "All" ? catFilter : "Beverages";
    setForm({
      name: "", sku: generateSKU(initialCategory, products),
      category: initialCategory,
      supplierId: suppliers[0]?.id || "",
      cost: "", price: "", stock: "", reserved: 0, damaged: 0, reorderLevel: 10, unit: "piece",
    });
    setModal("add");
  };

  // Re-generate SKU when category changes in the Add form
  const handleFormChange = (key, value) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      if (key === "category" && modal === "add") {
        updated.sku = generateSKU(value, products);
      }
      return updated;
    });
  };
  const openEdit = p => { setSelected(p); setForm({ ...p }); setModal("edit"); };
  const openAdj  = p => { setSelected(p); setForm({ stock: p.stock, damaged: p.damaged, note: "" }); setModal("adjust"); };

  const f = key => e => handleFormChange(key, e.target.value);

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = async () => {
    if (modal === "add") {
      const newProduct = {
        ...form,
        id: "p" + Date.now(),
        stock:        +form.stock,
        cost:         +form.cost,
        price:        +form.price,
        reserved:     +form.reserved,
        damaged:      +form.damaged,
        reorderLevel: +form.reorderLevel,
        variants: [],
      };
      if (onAddProduct) await onAddProduct(newProduct);
    } else if (modal === "edit") {
      const updatedFields = {
        ...form,
        stock:        +form.stock,
        cost:         +form.cost,
        price:        +form.price,
        reserved:     +form.reserved,
        damaged:      +form.damaged,
        reorderLevel: +form.reorderLevel,
      };
      if (onUpdateProduct && selected) await onUpdateProduct(selected.id, updatedFields);
    } else {
      if (onUpdateProduct && selected)
        await onUpdateProduct(selected.id, { stock: +form.stock, damaged: +form.damaged });
    }
    setModal(null);
  };

  const del = async id => {
    if (!window.confirm("Delete this product?")) return;
    if (onDeleteProduct) await onDeleteProduct(id);
  };

  const stockStatus = p => {
    if (p.stock === 0)             return { label: "Out of Stock", color: "red" };
    if (p.stock <= p.reorderLevel) return { label: "Low Stock",    color: "yellow" };
    return                                { label: "In Stock",     color: "green" };
  };

  const activeMeta = catFilter !== "All" ? CATEGORY_META[catFilter] : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="stock-layout">

      {/* ══ Left: Category Sidebar ══ */}
      <aside className="cat-sidebar">
        <div className="cat-sidebar__title">Categories</div>

        {/* All */}
        <button
          className={`cat-item ${catFilter === "All" ? "cat-item--active" : ""}`}
          onClick={() => setCatFilter("All")}
        >
          <span className="cat-item__emoji">📋</span>
          <span className="cat-item__label">All Products</span>
          <span className="cat-item__count">{totalCount}</span>
        </button>

        {/* Per category */}
        {CATEGORIES.map(c => {
          const meta  = CATEGORY_META[c] ?? CATEGORY_META["Other"];
          const count = categoryCounts[c] ?? 0;
          const active = catFilter === c;
          return (
            <button
              key={c}
              className={`cat-item ${active ? "cat-item--active" : ""}`}
              style={active ? { background: meta.bg, borderColor: meta.border, color: meta.color } : {}}
              onClick={() => setCatFilter(c)}
            >
              <span className="cat-item__emoji">{meta.emoji}</span>
              <span className="cat-item__label">{c}</span>
              <span
                className="cat-item__count"
                style={active ? { background: meta.border, color: meta.color } : {}}
              >
                {count}
              </span>
            </button>
          );
        })}
      </aside>

      {/* ══ Right: Main content ══ */}
      <div className="stock-main">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {activeMeta && <span style={{ fontSize: 22 }}>{activeMeta.emoji}</span>}
              {catFilter === "All" ? "Stock Management" : catFilter}
            </h1>
            <p className="page-header__sub">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              {catFilter !== "All" ? ` in ${catFilter}` : " tracked"}
            </p>
          </div>
          <Btn onClick={openAdd} icon="plus">Add Product</Btn>
        </div>

        {/* Search */}
        <div className="filter-row" style={{ marginBottom: 16 }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <span className="search-wrap__icon"><Icon name="search" size={15} /></span>
            <input
              className="input"
              placeholder={catFilter === "All" ? "Search all products…" : `Search in ${catFilter}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category banner when a category is active */}
        {activeMeta && (
          <div
            className="cat-banner"
            style={{ background: activeMeta.bg, border: `1.5px solid ${activeMeta.border}`, color: activeMeta.color }}
          >
            <span className="cat-banner__emoji">{activeMeta.emoji}</span>
            <div>
              <div className="cat-banner__name">{catFilter}</div>
              <div className="cat-banner__sub">
                {categoryCounts[catFilter] ?? 0} product{categoryCounts[catFilter] !== 1 ? "s" : ""} ·{" "}
                {products.filter(p => p.category === catFilter && p.stock === 0).length} out of stock ·{" "}
                {products.filter(p => p.category === catFilter && p.stock > 0 && p.stock <= p.reorderLevel).length} low stock
              </div>
            </div>
          </div>
        )}

        {/* Table — hidden on mobile via CSS, replaced by cards below */}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {["SKU","Product","Category","Cost","Price","Available","Reserved","Damaged","Status","Actions"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const st   = stockStatus(p);
                const meta = CATEGORY_META[p.category] ?? CATEGORY_META["Other"];
                return (
                  <tr key={p.id}>
                    <td className="td-sku">{p.sku}</td>
                    <td>
                      <div className="td-name">{p.name}</div>
                      <div className="td-sub">{p.unit}</div>
                    </td>
                    <td>
                      <span
                        className="cat-pill"
                        style={{
                          background: meta.bg,
                          border: `1px solid ${meta.border}`,
                          color: meta.color,
                        }}
                      >
                        {meta.emoji} {p.category}
                      </span>
                    </td>
                    <td>₱{p.cost}</td>
                    <td className="td-price">₱{p.price}</td>
                    <td className="td-bold">{p.stock}</td>
                    <td className="stock-qty--reserved">{p.reserved}</td>
                    <td className="stock-qty--damaged">{p.damaged}</td>
                    <td><Badge color={st.color}>{st.label}</Badge></td>
                    <td>
                      <div className="btn-row">
                        <Btn size="sm" variant="secondary" onClick={() => openAdj(p)}><Icon name="refresh" size={12} /></Btn>
                        <Btn size="sm" variant="secondary" onClick={() => openEdit(p)}><Icon name="edit"    size={12} /></Btn>
                        <Btn size="sm" variant="danger"    onClick={() => del(p.id)}>  <Icon name="trash"   size={12} /></Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="table-empty">
              {catFilter !== "All"
                ? `No products in "${catFilter}" yet. Click "Add Product" to add one.`
                : "No products found."}
            </div>
          )}
        </div>

        {/* Mobile card grid — visible only on phones (≤640px) via CSS */}
        {filtered.length === 0 ? (
          <div className="stock-card-empty">
            {catFilter !== "All"
              ? `No products in "${catFilter}" yet. Tap "Add Product" to add one.`
              : "No products found."}
          </div>
        ) : (
          <div className="stock-card-grid">
            {filtered.map(p => {
              const st   = stockStatus(p);
              const meta = CATEGORY_META[p.category] ?? CATEGORY_META["Other"];
              return (
                <div key={p.id + "-card"} className="stock-card">
                  {/* Top: name + status badge */}
                  <div className="stock-card__top">
                    <div>
                      <div className="stock-card__name">{p.name}</div>
                      <div className="stock-card__sku">{p.sku} · {p.unit}</div>
                    </div>
                    <Badge color={st.color}>{st.label}</Badge>
                  </div>

                  {/* Category pill */}
                  <div className="stock-card__meta">
                    <span
                      className="cat-pill"
                      style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
                    >
                      {meta.emoji} {p.category}
                    </span>
                    <div className="stock-card__prices">
                      <span>Cost: <span className="stock-card__price-val">₱{p.cost}</span></span>
                      <span>Price: <span className="stock-card__price-val">₱{p.price}</span></span>
                    </div>
                  </div>

                  {/* Stock stats row */}
                  <div className="stock-card__stats">
                    <div className="stock-card__stat">
                      <div className="stock-card__stat-val">{p.stock}</div>
                      <div className="stock-card__stat-label">Available</div>
                    </div>
                    <div className="stock-card__stat">
                      <div className="stock-card__stat-val stock-card__stat-val--reserved">{p.reserved}</div>
                      <div className="stock-card__stat-label">Reserved</div>
                    </div>
                    <div className="stock-card__stat">
                      <div className="stock-card__stat-val stock-card__stat-val--damaged">{p.damaged}</div>
                      <div className="stock-card__stat-label">Damaged</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="stock-card__actions">
                    <Btn size="sm" variant="secondary" onClick={() => openAdj(p)}>
                      <Icon name="refresh" size={12} /> Adjust
                    </Btn>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(p)}>
                      <Icon name="edit" size={12} /> Edit
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(p.id)}>
                      <Icon name="trash" size={12} />
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ Add / Edit Modal ══ */}
      <Modal
        open={modal === "add" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "add" ? "Add Product" : "Edit Product"}
        maxWidth={640}
      >
        <div className="form-grid-2">
          <Field label="Product Name" required>
            <input className="input" value={form.name || ""} onChange={f("name")} />
          </Field>
          <Field label={modal === "add" ? "SKU (auto-assigned)" : "SKU"} required>
            {modal === "add" ? (
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  value={form.sku || ""}
                  readOnly
                  tabIndex={-1}
                  style={{
                    background: "#f1f5f9", color: "#475569",
                    fontWeight: 700, letterSpacing: "0.04em",
                    cursor: "not-allowed", paddingRight: 72,
                  }}
                />
                <span style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 11, fontWeight: 600, color: "#94a3b8",
                  background: "#e2e8f0", borderRadius: 4, padding: "2px 7px",
                  pointerEvents: "none",
                }}>
                  AUTO
                </span>
              </div>
            ) : (
              <input className="input" value={form.sku || ""} onChange={f("sku")} />
            )}
          </Field>
          <Field label="Category">
            <select className="select" value={form.category || ""} onChange={f("category")}>
              {CATEGORIES.map(c => {
                const meta = CATEGORY_META[c] ?? CATEGORY_META["Other"];
                return <option key={c} value={c}>{meta.emoji} {c}</option>;
              })}
            </select>
          </Field>
          <Field label="Supplier">
            <select className="select" value={form.supplierId || ""} onChange={f("supplierId")}>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Cost Price (₱)">
            <input className="input" type="number" value={form.cost || ""} onChange={f("cost")} />
          </Field>
          <Field label="Selling Price (₱)">
            <input className="input" type="number" value={form.price || ""} onChange={f("price")} />
          </Field>
          <Field label="Opening Stock">
            <input className="input" type="number" value={form.stock || ""} onChange={f("stock")} />
          </Field>
        </div>
        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>Save Product</Btn>
        </div>
      </Modal>

      {/* ══ Stock Adjust Modal ══ */}
      <Modal
        open={modal === "adjust"}
        onClose={() => setModal(null)}
        title={`Adjust Stock — ${selected?.name}`}
      >
        <Field label="Adjusted Stock">
          <input className="input" type="number" value={form.stock || 0} onChange={f("stock")} />
        </Field>
        <Field label="Damaged Units">
          <input className="input" type="number" value={form.damaged || 0} onChange={f("damaged")} />
        </Field>
        <Field label="Reason / Note">
          <input className="input" value={form.note || ""} onChange={f("note")} />
        </Field>
        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>Apply Adjustment</Btn>
        </div>
      </Modal>
    </div>
  );
}