import { useState } from "react";
import Icon from "../components/Icon";
import { Btn, Modal, Field } from "../components/Primitives";

// ── Default load products if none exist ──────────────────────────────────────
export const DEFAULT_LOAD_PRODUCTS = [
  { id: "lp1", network: "Globe",  name: "Globe ₱10",   denomination: 10,  costPrice: 9,   profit: 1  },
  { id: "lp2", network: "Globe",  name: "Globe ₱20",   denomination: 20,  costPrice: 18,  profit: 2  },
  { id: "lp3", network: "Globe",  name: "Globe ₱50",   denomination: 50,  costPrice: 47,  profit: 3  },
  { id: "lp4", network: "Globe",  name: "Globe ₱100",  denomination: 100, costPrice: 95,  profit: 5  },
  { id: "lp5", network: "Smart",  name: "Smart ₱10",   denomination: 10,  costPrice: 9,   profit: 1  },
  { id: "lp6", network: "Smart",  name: "Smart ₱20",   denomination: 20,  costPrice: 18,  profit: 2  },
  { id: "lp7", network: "Smart",  name: "Smart ₱50",   denomination: 50,  costPrice: 47,  profit: 3  },
  { id: "lp8", network: "Smart",  name: "Smart ₱100",  denomination: 100, costPrice: 95,  profit: 5  },
  { id: "lp9", network: "TNT",    name: "TNT ₱10",     denomination: 10,  costPrice: 9,   profit: 1  },
  { id: "lp10",network: "TNT",    name: "TNT ₱20",     denomination: 20,  costPrice: 18,  profit: 2  },
  { id: "lp11",network: "DITO",   name: "DITO ₱20",    denomination: 20,  costPrice: 18,  profit: 2  },
  { id: "lp12",network: "DITO",   name: "DITO ₱50",    denomination: 50,  costPrice: 47,  profit: 3  },
];

const NETWORKS = ["Globe", "Smart", "TNT", "DITO", "Sun", "TM", "Other"];

const NETWORK_COLORS = {
  Globe:  { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6" },
  Smart:  { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e" },
  TNT:    { bg: "#fef3c7", border: "#fde68a", text: "#92400e", dot: "#f59e0b" },
  DITO:   { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", dot: "#8b5cf6" },
  Sun:    { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", dot: "#f97316" },
  TM:     { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", dot: "#10b981" },
  Other:  { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", dot: "#94a3b8" },
};

const blank = () => ({
  id: "",
  network: "Globe",
  name: "",
  denomination: "",
  costPrice: "",
  profit: "",
});

export default function ELoading({ loadProducts, onAdd, onUpdate, onDelete }) {
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null); // null = add new
  const [form,    setForm]    = useState(blank());
  const [filterNet, setFilterNet] = useState("All");
  const [delConfirm, setDelConfirm] = useState(null);

  const openAdd = () => {
    setEditing(null);
    setForm(blank());
    setModal(true);
  };

  const openEdit = (lp) => {
    setEditing(lp.id);
    setForm({ ...lp });
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditing(null); setForm(blank()); };

  const field = (key, val) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      // Auto-compute name when network or denomination changes
      if ((key === "network" || key === "denomination") && next.denomination) {
        if (!editing || !prev.name || prev.name === `${prev.network} ₱${prev.denomination}`) {
          next.name = `${next.network} ₱${next.denomination}`;
        }
      }
      return next;
    });
  };

  const save = async () => {
    if (!form.network || !form.denomination || !form.name) {
      alert("Please fill in Network, Denomination and Name."); return;
    }
    if (editing) {
      if (onUpdate) {
        await onUpdate(editing, { ...form });
      }
    } else {
      const newLp = { ...form, id: "lp" + Date.now() };
      if (onAdd) {
        await onAdd(newLp);
      }
    }
    closeModal();
  };

  const remove = async (id) => {
    if (onDelete) {
      await onDelete(id);
    }
    setDelConfirm(null);
  };

  const networks = ["All", ...NETWORKS.filter(n => loadProducts.some(lp => lp.network === n))];
  const visible  = filterNet === "All" ? loadProducts : loadProducts.filter(lp => lp.network === filterNet);

  // Summary stats
  const totalProducts = loadProducts.length;
  const totalNetworks = [...new Set(loadProducts.map(lp => lp.network))].length;
  const avgProfit     = loadProducts.length
    ? (loadProducts.reduce((s, lp) => s + +lp.profit, 0) / loadProducts.length).toFixed(2)
    : 0;

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">E-Loading Management</h1>
          <p className="page-header__sub">Manage prepaid load denominations, cost prices & profit margins</p>
        </div>
        <Btn icon="plus" onClick={openAdd}>Add Load Product</Btn>
      </div>

      {/* ── Summary Stats ── */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: "#eff6ff" }}>
            <span style={{ fontSize: 20 }}>📱</span>
          </div>
          <div>
            <div className="stat-card__value">{totalProducts}</div>
            <div className="stat-card__label">Load Products</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: "#f0fdf4" }}>
            <span style={{ fontSize: 20 }}>🌐</span>
          </div>
          <div>
            <div className="stat-card__value">{totalNetworks}</div>
            <div className="stat-card__label">Networks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: "#fef3c7" }}>
            <span style={{ fontSize: 20 }}>💰</span>
          </div>
          <div>
            <div className="stat-card__value">₱{avgProfit}</div>
            <div className="stat-card__label">Avg. Profit / Load</div>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="eload-filter-tabs">
        {networks.map(n => (
          <button
            key={n}
            className={`eload-filter-tab ${filterNet === n ? "eload-filter-tab--active" : ""}`}
            onClick={() => setFilterNet(n)}
          >
            {n !== "All" && (
              <span
                className="eload-net-dot"
                style={{ background: NETWORK_COLORS[n]?.dot ?? "#94a3b8" }}
              />
            )}
            {n}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Network</th>
              <th>Name / Label</th>
              <th style={{ textAlign: "right" }}>Denomination</th>
              <th style={{ textAlign: "right" }}>Cost Price</th>
              <th style={{ textAlign: "right" }}>Profit</th>
              <th style={{ textAlign: "right" }}>Selling Price</th>
              <th style={{ textAlign: "right" }}>Margin %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty">No load products found.</td>
              </tr>
            ) : (
              visible.map(lp => {
                const sellingPrice = +lp.denomination; // denomination IS the selling price
                const margin = lp.denomination > 0
                  ? ((+lp.profit / +lp.denomination) * 100).toFixed(1)
                  : 0;
                const nc = NETWORK_COLORS[lp.network] ?? NETWORK_COLORS.Other;
                return (
                  <tr key={lp.id}>
                    <td>
                      <span
                        className="eload-badge"
                        style={{ background: nc.bg, border: `1px solid ${nc.border}`, color: nc.text }}
                      >
                        <span className="eload-net-dot" style={{ background: nc.dot }} />
                        {lp.network}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{lp.name}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-indigo)" }}>
                      ₱{(+lp.denomination).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
                      ₱{(+lp.costPrice).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--color-green)", fontWeight: 700 }}>
                      ₱{(+lp.profit).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      ₱{sellingPrice.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        className="eload-margin-pill"
                        style={{
                          background: +margin >= 5 ? "var(--color-green-light)" : "var(--color-yellow-light)",
                          color: +margin >= 5 ? "var(--color-green)" : "var(--color-yellow)",
                        }}
                      >
                        {margin}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="tbl-icon-btn" onClick={() => openEdit(lp)} title="Edit">
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          className="tbl-icon-btn tbl-icon-btn--danger"
                          onClick={() => setDelConfirm(lp.id)}
                          title="Delete"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal open={modal} onClose={closeModal} title={editing ? "Edit Load Product" : "Add Load Product"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Network">
            <select
              className="input"
              value={form.network}
              onChange={e => field("network", e.target.value)}
            >
              {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Denomination (₱) = Selling Price">
            <input
              className="input"
              type="number"
              placeholder="e.g. 50"
              value={form.denomination}
              onChange={e => field("denomination", e.target.value)}
            />
          </Field>
          <Field label="Display Name / Label" style={{ gridColumn: "1 / -1" }}>
            <input
              className="input"
              placeholder="e.g. Globe ₱50"
              value={form.name}
              onChange={e => field("name", e.target.value)}
            />
          </Field>
          <Field label="Cost Price (₱) — what you pay">
            <input
              className="input"
              type="number"
              placeholder="e.g. 47"
              value={form.costPrice}
              onChange={e => field("costPrice", e.target.value)}
            />
          </Field>
          <Field label="Profit (₱) — your earnings">
            <input
              className="input"
              type="number"
              placeholder="e.g. 3"
              value={form.profit}
              onChange={e => field("profit", e.target.value)}
            />
          </Field>
        </div>

        {/* Live preview */}
        {form.denomination > 0 && (
          <div className="eload-preview-box">
            <div className="eload-preview-row">
              <span>Selling Price</span>
              <span style={{ fontWeight: 700, color: "var(--color-indigo)" }}>
                ₱{(+form.denomination || 0).toFixed(2)}
              </span>
            </div>
            <div className="eload-preview-row">
              <span>Cost Price</span>
              <span>₱{(+form.costPrice || 0).toFixed(2)}</span>
            </div>
            <div className="eload-preview-row" style={{ borderTop: "1.5px solid var(--color-border)", paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontWeight: 700 }}>Your Profit</span>
              <span style={{ fontWeight: 800, color: "var(--color-green)", fontSize: 16 }}>
                ₱{(+form.profit || 0).toFixed(2)}
              </span>
            </div>
            <div className="eload-preview-row">
              <span style={{ color: "var(--color-text-muted)" }}>Margin</span>
              <span style={{ color: "var(--color-text-muted)" }}>
                {form.denomination > 0
                  ? ((+form.profit / +form.denomination) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Btn onClick={save}>{editing ? "Save Changes" : "Add Product"}</Btn>
          <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        open={!!delConfirm}
        onClose={() => setDelConfirm(null)}
        title="Delete Load Product"
      >
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 20 }}>
          Are you sure you want to delete this load product? This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="danger" onClick={() => remove(delConfirm)}>Yes, Delete</Btn>
          <Btn variant="secondary" onClick={() => setDelConfirm(null)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
}
