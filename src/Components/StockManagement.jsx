import { useState } from "react";
import Icon from "../components/Icon";
import { Badge, Btn, Modal, Field } from "../components/Primitives";
import { CATEGORIES } from "../data/constants";

export default function StockManagement({ products, setProducts, suppliers }) {
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modal,     setModal]     = useState(null);   // "add" | "edit" | "adjust" | null
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState({});

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = products.filter(p =>
    (catFilter === "All" || p.category === catFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // ── Modal openers ──────────────────────────────────────────────────────────
  const openAdd  = () => {
    setForm({ name: "", sku: "", category: "Beverages", supplierId: suppliers[0]?.id || "", cost: "", price: "", stock: "", reserved: 0, damaged: 0, reorderLevel: 10, unit: "piece" });
    setModal("add");
  };
  const openEdit = p => { setSelected(p); setForm({ ...p }); setModal("edit"); };
  const openAdj  = p => { setSelected(p); setForm({ stock: p.stock, damaged: p.damaged, note: "" }); setModal("adjust"); };

  // ── Generic field updater ──────────────────────────────────────────────────
  const f = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // ── Save (add / edit / adjust) ─────────────────────────────────────────────
  const save = () => {
    if (modal === "add") {
      setProducts(prev => [
        ...prev,
        { ...form, id: "p" + Date.now(), stock: +form.stock, cost: +form.cost, price: +form.price, reserved: +form.reserved, damaged: +form.damaged, reorderLevel: +form.reorderLevel, variants: [] },
      ]);
    } else if (modal === "edit") {
      setProducts(prev =>
        prev.map(p =>
          p.id === selected.id
            ? { ...p, ...form, stock: +form.stock, cost: +form.cost, price: +form.price, reserved: +form.reserved, damaged: +form.damaged, reorderLevel: +form.reorderLevel }
            : p
        )
      );
    } else {
      setProducts(prev =>
        prev.map(p => p.id === selected.id ? { ...p, stock: +form.stock, damaged: +form.damaged } : p)
      );
    }
    setModal(null);
  };

  const del = id => {
    if (window.confirm("Delete this product?"))
      setProducts(prev => prev.filter(p => p.id !== id));
  };

  const stockStatus = p => {
    if (p.stock === 0)             return { label: "Out of Stock", color: "red" };
    if (p.stock <= p.reorderLevel) return { label: "Low Stock",    color: "yellow" };
    return                                { label: "In Stock",     color: "green" };
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Stock Management</h1>
          <p className="page-header__sub">{products.length} products tracked</p>
        </div>
        <Btn onClick={openAdd} icon="plus">Add Product</Btn>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-wrap">
          <span className="search-wrap__icon"><Icon name="search" size={15} /></span>
          <input className="input" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select" style={{ width: 170 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
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
              const st = stockStatus(p);
              return (
                <tr key={p.id}>
                  <td className="td-sku">{p.sku}</td>
                  <td>
                    <div className="td-name">{p.name}</div>
                    <div className="td-sub">{p.unit}</div>
                  </td>
                  <td className="td-muted">{p.category}</td>
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
                      <Btn size="sm" variant="danger"    onClick={() => del(p.id)}> <Icon name="trash"   size={12} /></Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="table-empty">No products found.</div>}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modal === "add" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "add" ? "Add Product" : "Edit Product"}
        maxWidth={640}
      >
        <div className="form-grid-2">
          <Field label="Product Name" required><input className="input" value={form.name         || ""} onChange={f("name")}         /></Field>
          <Field label="SKU"          required><input className="input" value={form.sku          || ""} onChange={f("sku")}          /></Field>
          <Field label="Category">
            <select className="select" value={form.category || ""} onChange={f("category")}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Supplier">
            <select className="select" value={form.supplierId || ""} onChange={f("supplierId")}>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Cost Price (₱)">    <input className="input" type="number" value={form.cost         || ""} onChange={f("cost")}         /></Field>
          <Field label="Selling Price (₱)"> <input className="input" type="number" value={form.price        || ""} onChange={f("price")}        /></Field>
          <Field label="Opening Stock">     <input className="input" type="number" value={form.stock        || ""} onChange={f("stock")}        /></Field>
          <Field label="Reorder Level">     <input className="input" type="number" value={form.reorderLevel || ""} onChange={f("reorderLevel")} /></Field>
          <Field label="Unit">              <input className="input" value={form.unit    || ""} onChange={f("unit")} /></Field>
          <Field label="Damaged Units">     <input className="input" type="number" value={form.damaged      || 0}  onChange={f("damaged")}     /></Field>
        </div>
        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>Save Product</Btn>
        </div>
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal
        open={modal === "adjust"}
        onClose={() => setModal(null)}
        title={`Adjust Stock — ${selected?.name}`}
      >
        <Field label="Adjusted Stock"><input className="input" type="number" value={form.stock   || 0}  onChange={f("stock")}   /></Field>
        <Field label="Damaged Units"> <input className="input" type="number" value={form.damaged || 0}  onChange={f("damaged")} /></Field>
        <Field label="Reason / Note"> <input className="input" value={form.note || ""} onChange={f("note")} /></Field>
        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>Apply Adjustment</Btn>
        </div>
      </Modal>
    </div>
  );
}
