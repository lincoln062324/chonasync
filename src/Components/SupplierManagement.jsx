import { useState } from "react";
import Icon from "../components/Icon";
import { Btn, Modal, Field } from "../components/Primitives";

/* ─── INTERACTIVE STAR RATING ────────────────────────────────────────────────
   Allows the user to click a star to set the rating (1–5).
   Hovering previews the rating before committing.
   Shows a label ("Poor" → "Excellent") next to the stars.
   ──────────────────────────────────────────────────────────────────────────── */
const RATING_LABELS = {
  0: "",
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const RATING_COLORS = {
  1: "#ef4444",   // red
  2: "#f97316",   // orange
  3: "#eab308",   // yellow
  4: "#22c55e",   // green
  5: "#4f46e5",   // indigo
};

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);

  const display  = hovered || Math.round(value);
  const label    = RATING_LABELS[display] || "";
  const color    = RATING_COLORS[display] || "#f59e0b";

  return (
    <div className="star-rating-wrap">
      <div
        className={`star-rating-stars${readonly ? "" : " star-rating-stars--interactive"}`}
        onMouseLeave={() => !readonly && setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className={`star-btn ${n <= display ? "star-btn--filled" : "star-btn--empty"}`}
            style={n <= display ? { color } : {}}
            onMouseEnter={() => !readonly && setHovered(n)}
            onClick={() => !readonly && onChange(n)}
            disabled={readonly}
            aria-label={`Rate ${n} out of 5`}
          >
            ★
          </button>
        ))}
      </div>

      {!readonly && (
        <span
          className="star-rating-label"
          style={{ color: display ? color : "var(--color-text-muted)" }}
        >
          {display ? `${display}/5 — ${label}` : "Click to rate"}
        </span>
      )}

      {readonly && (
        <span className="star-value">{Number(value).toFixed(1)}</span>
      )}
    </div>
  );
}

/* ─── SUPPLIER MANAGEMENT ────────────────────────────────────────────────── */
export default function SupplierManagement({ suppliers, purchaseOrders, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) {
  const [modal,    setModal]    = useState(null);   // "add" | "edit" | null
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState({});

  const openAdd = () => {
    setForm({
      name: "", terms: "CASH", rating: 0,
    });
    setModal("add");
  };

  const openEdit = s => { setSelected(s); setForm({ ...s }); setModal("edit"); };
  const f        = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const save = async () => {
    if (modal === "add") {
      const newSupplier = {
        ...form,
        id: "s" + Date.now(),
        totalOrders: 0,
        onTimeDelivery: 100,
        deliveryTime: 3,
      };
      if (onAddSupplier) {
        await onAddSupplier(newSupplier);
      }
    } else if (selected) {
      if (onUpdateSupplier) {
        await onUpdateSupplier(selected.id, { ...form });
      }
    }
    setModal(null);
  };

  const del = async id => {
    if (!window.confirm("Delete supplier?")) return;
    if (onDeleteSupplier) {
      await onDeleteSupplier(id);
    }
  };

  /* Update rating directly on the card (without opening edit modal) */
  const updateRatingInline = async (supplierId, newRating) => {
    if (onUpdateSupplier) {
      await onUpdateSupplier(supplierId, { rating: newRating });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Supplier Management</h1>
          <p className="page-header__sub">{suppliers.length} active suppliers</p>
        </div>
        <Btn onClick={openAdd} icon="plus">Add Supplier</Btn>
      </div>

      {/* ── Supplier Cards ── */}
      <div className="supplier-grid">
        {suppliers.map(s => {
          const orders     = purchaseOrders.filter(p => p.supplierId === s.id);
          const totalSpent = orders.reduce((sum, p) => sum + p.total, 0);

          return (
            <div key={s.id} className="supplier-card">

              {/* Header */}
              <div className="supplier-card__header">
                <div>
                  <div className="supplier-card__name">{s.name}</div>
                </div>
                <div className="btn-row">
                  <Btn size="sm" variant="secondary" onClick={() => openEdit(s)}>
                    <Icon name="edit"  size={12} />
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => del(s.id)}>
                    <Icon name="trash" size={12} />
                  </Btn>
                </div>
              </div>

              {/* Meta grid */}
              <div className="supplier-meta-grid">
                {[
                  ["Terms",   s.terms],
                  ["On-Time", `${s.onTimeDelivery}%`],
                ].map(([label, value]) => (
                  <div key={label} className="supplier-meta-item">
                    <div className="supplier-meta-item__label">{label}</div>
                    <div className="supplier-meta-item__value">{value}</div>
                  </div>
                ))}
              </div>

              {/* Footer — interactive star rating */}
              <div className="supplier-card__footer">
                <span className="supplier-card__stats">
                  {orders.length} orders · ₱{totalSpent.toLocaleString()}
                </span>

                {/* Stars are interactive directly on the card */}
                <StarRating
                  value={s.rating}
                  onChange={newRating => updateRatingInline(s.id, newRating)}
                />
              </div>

              {/* Performance badge below footer */}
              {s.rating > 0 && (
                <div className="supplier-card__perf">
                  <span
                    className="supplier-perf-badge"
                    style={{
                      background: s.rating >= 4 ? "#ecfdf5" : s.rating >= 3 ? "#fffbeb" : "#fef2f2",
                      color:      s.rating >= 4 ? "#065f46" : s.rating >= 3 ? "#92400e" : "#991b1b",
                      border:     `1px solid ${s.rating >= 4 ? "#a7f3d0" : s.rating >= 3 ? "#fde68a" : "#fecaca"}`,
                    }}
                  >
                    {s.rating >= 4.5 ? "⭐ Top Performer"
                      : s.rating >= 4  ? "✅ Good Supplier"
                      : s.rating >= 3  ? "⚠️ Average"
                      : "❌ Needs Improvement"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modal === "add" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "add" ? "Add Supplier" : "Edit Supplier"}
      >
        <div className="form-grid-2">
          <Field label="Company Name" required>
            <input className="input" value={form.name    || ""} onChange={f("name")} />
          </Field>
          <Field label="Payment Terms">
            <select className="select" value={form.terms || "CASH"} onChange={f("terms")}>
              {["CASH", "GCASH"].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        {/* Rating picker inside modal */}
        <Field label="Supplier Performance Rating">
          <div className="modal-rating-wrap">
            <StarRating
              value={form.rating || 0}
              onChange={n => setForm(prev => ({ ...prev, rating: n }))}
            />
          </div>
        </Field>

        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>Save Supplier</Btn>
        </div>
      </Modal>
    </div>
  );
}