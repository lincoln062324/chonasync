import { useState, useEffect, useCallback } from "react";
import { Btn, Modal, Field, Badge } from "../Components/Primitives";
import Icon from "../Components/Icon";

// ─── DB helpers ───────────────────────────────────────────────────────────────
export async function fetchBottleDeposits() {
  const { supabase } = await import("../lib/supabase.js");
  const { data, error } = await supabase
    .from("bottle_deposits")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBottleDeposit(record) {
  const { supabase } = await import("../lib/supabase.js");
  const { data, error } = await supabase
    .from("bottle_deposits")
    .insert([{
      customer_name:      record.customerName,
      contact:            record.contact           || null,
      bottle_type:        record.bottleType,
      bottle_size:        record.bottleSize,
      qty:                record.qty,
      deposit_per_bottle: record.depositPerBottle,
      total_deposit:      record.qty * record.depositPerBottle,
      notes:              record.notes             || null,
      status:             "borrowed",
      returned_qty:       0,
      date_borrowed:      record.dateBorrowed      || new Date().toISOString().slice(0, 10),
      due_date:           record.dueDate           || null,   // ← NEW
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function returnBottles(id, returnedQty, totalQty) {
  const { supabase } = await import("../lib/supabase.js");
  const status = returnedQty >= totalQty ? "returned" : "partially_returned";
  const { data, error } = await supabase
    .from("bottle_deposits")
    .update({ returned_qty: returnedQty, status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBottleDeposit(id) {
  const { supabase } = await import("../lib/supabase.js");
  const { error } = await supabase.from("bottle_deposits").delete().eq("id", id);
  if (error) throw error;
}

// ─── SQL (run once in Supabase SQL Editor) ────────────────────────────────────
export const BOTTLE_DEPOSITS_SQL = `
-- Run this migration in your Supabase SQL Editor:
alter table bottle_deposits
  add column if not exists due_date date default null;

-- Optional index for overdue queries
create index if not exists idx_bottle_deposits_due_date
  on bottle_deposits(due_date);
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TODAY = () => new Date().toISOString().slice(0, 10);

/** Returns days since borrowed (positive = overdue if no due_date) */
const daysSince = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86_400_000);
};

/** Returns days until/past due_date; negative = overdue */
const daysUntilDue = (dueDateStr) => {
  const diff = new Date(dueDateStr).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
};

export const isOverdue = (r) => {
  if (r.status === "returned") return false;
  if (r.due_date) return daysUntilDue(r.due_date) < 0;
  // Fallback: no due_date → flag if borrowed > 7 days ago
  return daysSince(r.date_borrowed) > 7;
};

const fmt = (n) => `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

// ─── Constants ────────────────────────────────────────────────────────────────
const BOTTLE_TYPES = ["Coke", "Sprite", "Royal", "RC Cola", "Lemon", "Sarsi", "Other"];
const BOTTLE_SIZES = ["Big", "Small", "Other"];

const STATUS_META = {
  borrowed:           { label: "Borrowed",       color: "red",    emoji: "🔴" },
  partially_returned: { label: "Partial Return", color: "yellow", emoji: "🟡" },
  returned:           { label: "Fully Returned", color: "green",  emoji: "🟢" },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BottleDeposit({ deposits = [], setDeposits }) {
  const records    = deposits;
  const setRecords = setDeposits;
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [modal,     setModal]     = useState(null);   // "add"|"return"|"sql"|null
  const [selected,  setSelected]  = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [filter,    setFilter]    = useState("all");  // all|borrowed|partially_returned|returned|overdue
  const [search,    setSearch]    = useState("");
  const [saving,    setSaving]    = useState(false);

  const [form, setForm] = useState({
    customerName: "", contact: "", bottleType: "Coke", bottleSize: "Big",
    qty: 1, depositPerBottle: 10, notes: "",
    dateBorrowed: TODAY(),
    dueDate: "",   // ← NEW
  });

  // ── Realtime subscription ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDeposits(await fetchBottleDeposits());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [setDeposits]);

  useEffect(() => {
    load();

    // Supabase Realtime — auto-refresh on any change
    let channel;
    (async () => {
      const { supabase } = await import("../lib/supabase.js");
      channel = supabase
        .channel("bottle_deposits_changes")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "bottle_deposits" },
          () => load()
        )
        .subscribe();
    })();

    return () => { channel?.unsubscribe(); };
  }, [load]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => {
    setForm({
      customerName: "", contact: "", bottleType: "Coke", bottleSize: "Big",
      qty: 1, depositPerBottle: 10, notes: "",
      dateBorrowed: TODAY(),
      dueDate: "",
    });
    setModal("add");
  };

  const saveDeposit = async () => {
    if (!form.customerName.trim()) { alert("Please enter customer name."); return; }
    if (+form.qty < 1)             { alert("Quantity must be at least 1."); return; }
    if (+form.depositPerBottle < 0){ alert("Deposit cannot be negative."); return; }
    if (form.dueDate && form.dueDate < form.dateBorrowed) {
      alert("Due date cannot be before the borrow date."); return;
    }
    setSaving(true);
    try {
      const record = await createBottleDeposit({
        ...form,
        qty: +form.qty,
        depositPerBottle: +form.depositPerBottle,
        dueDate: form.dueDate || null,
      });
      setRecords(prev => [record, ...prev]);
      setModal(null);
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const openReturn = (rec) => {
    setSelected(rec);
    setReturnQty(rec.qty - rec.returned_qty);
    setModal("return");
  };

  const processReturn = async () => {
    if (!selected) return;
    const newTotal = selected.returned_qty + +returnQty;
    if (newTotal > selected.qty) { alert("Return qty exceeds borrowed qty."); return; }
    setSaving(true);
    try {
      const updated = await returnBottles(selected.id, newTotal, selected.qty);
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      setModal(null);
    } catch (e) { alert("Failed to update: " + e.message); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this deposit record?")) return;
    try {
      await deleteBottleDeposit(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (e) { alert("Delete failed: " + e.message); }
  };

  // ── Derived counts ─────────────────────────────────────────────────────────
  const overdueRecords  = records.filter(isOverdue);
  const activeBorrowed  = records.filter(r => r.status !== "returned");
  const totalDeposit    = activeBorrowed.reduce((s, r) => s + +r.total_deposit, 0);
  const totalBottles    = activeBorrowed.reduce((s, r) => s + r.qty - r.returned_qty, 0);
  const borrowedToday   = records.filter(r => r.date_borrowed === TODAY() && r.status === "borrowed").length;

  // ── Filtered list ──────────────────────────────────────────────────────────
  const visible = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || r.customer_name.toLowerCase().includes(q)
      || r.bottle_type.toLowerCase().includes(q)
      || (r.contact || "").toLowerCase().includes(q);

    let matchStatus;
    if (filter === "overdue")             matchStatus = isOverdue(r);
    else if (filter === "all")            matchStatus = true;
    else                                  matchStatus = r.status === filter;

    return matchStatus && matchSearch;
  });

  // ── Due date display helper ────────────────────────────────────────────────
  const dueDateDisplay = (r) => {
    if (!r.due_date) return null;
    const days = daysUntilDue(r.due_date);
    if (days < 0)  return { text: `${Math.abs(days)}d overdue`, color: "#dc2626", bg: "#fef2f2" };
    if (days === 0) return { text: "Due today!",                 color: "#d97706", bg: "#fffbeb" };
    if (days <= 3) return { text: `Due in ${days}d`,            color: "#d97706", bg: "#fffbeb" };
    return              { text: `Due ${r.due_date}`,            color: "#64748b", bg: "#f8fafc" };
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--color-text-muted)", gap: 10 }}>
      <span style={{ fontSize: 24 }}>🍾</span> Loading bottle deposits…
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, background: "#fef2f2", borderRadius: 12, border: "1.5px solid #fecaca" }}>
      <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>⚠️ Failed to load bottle deposits</div>
      <div style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 12 }}>{error}</div>
      <div style={{ fontSize: 12, color: "#991b1b", background: "#fff", borderRadius: 8, padding: 12, border: "1px solid #fecaca" }}>
        <strong>Make sure to run the migration SQL below:</strong>
        <pre style={{ marginTop: 8, fontSize: 11, overflow: "auto" }}>{BOTTLE_DEPOSITS_SQL}</pre>
      </div>
      <button onClick={() => { setError(null); load(); }}
        style={{ marginTop: 12, padding: "8px 20px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
        Retry
      </button>
    </div>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">🍾 Bottle Deposit Tracker</h1>
          <p className="page-header__sub">Track borrowed bottles & customer deposits</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn icon="plus" onClick={openAdd}>New Deposit</Btn>
        </div>
      </div>

      {/* ── Overdue Banner ── */}
      {overdueRecords.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg,#fef2f2,#fff5f5)",
          border: "1.5px solid #fca5a5", borderRadius: 12, padding: "14px 18px",
          marginBottom: 18, display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 24 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 14 }}>
              {overdueRecords.length} Overdue Bottle Deposit{overdueRecords.length > 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 12, color: "#991b1b", marginTop: 2 }}>
              {overdueRecords.map(r => {
                const d = r.due_date ? Math.abs(daysUntilDue(r.due_date)) : daysSince(r.date_borrowed);
                return `${r.customer_name} (${d}d)`;
              }).join(" · ")}
            </div>
          </div>
          <button
            onClick={() => setFilter("overdue")}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid #dc2626", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            View All →
          </button>
        </div>
      )}

      {/* ── Summary Stats ── */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <span style={{ fontSize: 22 }}>🍾</span>
          </div>
          <div>
            <div className="stat-card__value">{totalBottles}</div>
            <div className="stat-card__label">Bottles Out</div>
            <div className="stat-card__sub">{activeBorrowed.length} customers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: "#fffbeb", color: "#d97706" }}>
            <span style={{ fontSize: 22 }}>💰</span>
          </div>
          <div>
            <div className="stat-card__value">{fmt(totalDeposit)}</div>
            <div className="stat-card__label">Total Deposits Held</div>
            <div className="stat-card__sub">Active deposits only</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("overdue")}>
          <div className="stat-card__icon" style={{ background: overdueRecords.length > 0 ? "#fef2f2" : "#f0fdf4", color: overdueRecords.length > 0 ? "#dc2626" : "#059669" }}>
            <span style={{ fontSize: 22 }}>{overdueRecords.length > 0 ? "⚠️" : "✅"}</span>
          </div>
          <div>
            <div className="stat-card__value" style={{ color: overdueRecords.length > 0 ? "#dc2626" : "inherit" }}>
              {overdueRecords.length}
            </div>
            <div className="stat-card__label">Overdue</div>
            <div className="stat-card__sub">{overdueRecords.length > 0 ? "Click to view" : "All on time!"}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: "#eef2ff", color: "#4f46e5" }}>
            <span style={{ fontSize: 22 }}>📅</span>
          </div>
          <div>
            <div className="stat-card__value">{borrowedToday}</div>
            <div className="stat-card__label">Borrowed Today</div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 180 }}>
          <span className="search-wrap__icon"><Icon name="search" size={15} /></span>
          <input
            className="input"
            placeholder="Search customer, bottle type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {[
          { key: "all",                label: "All",           count: records.length },
          { key: "overdue",            label: "⚠️ Overdue",   count: overdueRecords.length },
          { key: "borrowed",           label: "Borrowed",      count: records.filter(r => r.status === "borrowed").length },
          { key: "partially_returned", label: "Partial",       count: records.filter(r => r.status === "partially_returned").length },
          { key: "returned",           label: "Returned",      count: records.filter(r => r.status === "returned").length },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{
              padding: "7px 14px", borderRadius: 20,
              border: `1.5px solid ${filter === key ? (key === "overdue" ? "#dc2626" : "var(--color-indigo)") : "var(--color-border)"}`,
              fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              background: filter === key ? (key === "overdue" ? "#dc2626" : "var(--color-indigo)") : "var(--color-surface)",
              color: filter === key ? "#fff" : "var(--color-text-secondary)",
            }}
          >
            {label}
            <span style={{
              marginLeft: 5,
              background: filter === key ? "rgba(255,255,255,0.25)" : "var(--color-bg)",
              borderRadius: 99, padding: "1px 6px", fontSize: 10,
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Records Table ── */}
      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--color-text-muted)", background: "var(--color-surface)", borderRadius: 14, border: "1.5px dashed var(--color-border)" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🍾</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
            {filter === "all" && !search ? "No bottle deposits yet" : "No records found"}
          </div>
          <div style={{ fontSize: 13 }}>
            {filter === "all" && !search ? "Click New Deposit to record a borrowed bottle." : "Try adjusting your search or filter."}
          </div>
          {filter === "all" && !search && (
            <button onClick={openAdd}
              style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--color-indigo)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              + New Deposit
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Bottle</th>
                <th>Size</th>
                <th style={{ textAlign: "center" }}>Borrowed</th>
                <th style={{ textAlign: "center" }}>Returned</th>
                <th style={{ textAlign: "right" }}>Deposit/Bottle</th>
                <th style={{ textAlign: "right" }}>Held</th>
                <th>Borrowed On</th>
                <th>Due Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(r => {
                const outstanding = r.qty - r.returned_qty;
                const heldAmt     = outstanding * +r.deposit_per_bottle;
                const sm          = STATUS_META[r.status] || STATUS_META.borrowed;
                const overdue     = isOverdue(r);
                const due         = dueDateDisplay(r);

                return (
                  <tr key={r.id}
                    style={{
                      opacity: r.status === "returned" ? 0.6 : 1,
                      background: overdue ? "rgba(220,38,38,0.03)" : undefined,
                    }}
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {overdue && <span title="Overdue!" style={{ fontSize: 14 }}>🚨</span>}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.customer_name}</div>
                          {r.contact && <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{r.contact}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.bottle_type}</td>
                    <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.bottle_size}</td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "var(--color-indigo)" }}>{r.qty}</td>
                    <td style={{ textAlign: "center" }}>
                      {r.returned_qty > 0
                        ? <span style={{ fontWeight: 700, color: "var(--color-green)" }}>{r.returned_qty}</span>
                        : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                    </td>
                    <td style={{ textAlign: "right" }}>{fmt(r.deposit_per_bottle)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: r.status !== "returned" ? "var(--color-yellow)" : "var(--color-green)" }}>
                      {fmt(heldAmt)}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {r.date_borrowed}
                    </td>
                    <td>
                      {due ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 8px",
                          borderRadius: 20, background: due.bg, color: due.color,
                          whiteSpace: "nowrap",
                        }}>
                          {due.text}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <Badge color={overdue && r.status !== "returned" ? "red" : sm.color}>
                        {overdue && r.status !== "returned" ? "🚨 OVERDUE" : `${sm.emoji} ${sm.label}`}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                        {r.status !== "returned" && (
                          <button className="tbl-icon-btn" onClick={() => openReturn(r)} title="Record Return"
                            style={{ color: "var(--color-green)", borderColor: "var(--color-green-border)", background: "var(--color-green-light)" }}>
                            <Icon name="undo" size={13} />
                          </button>
                        )}
                        <button className="tbl-icon-btn tbl-icon-btn--danger" onClick={() => del(r.id)} title="Delete">
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Deposit Modal ── */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="🍾 New Bottle Deposit">
        <div className="form-grid-2">
          <Field label="Customer Name" required>
            <input className="input" value={form.customerName} onChange={f("customerName")}
              placeholder="e.g. Juan dela Cruz" autoFocus />
          </Field>
          <Field label="Bottle Type">
            <select className="select" value={form.bottleType} onChange={f("bottleType")}>
              {BOTTLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Bottle Size">
            <select className="select" value={form.bottleSize} onChange={f("bottleSize")}>
              {BOTTLE_SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Quantity Borrowed">
            <input className="input" type="number" min={1} value={form.qty} onChange={f("qty")} />
          </Field>
          <Field label="Deposit per Bottle (₱)">
            <input className="input" type="number" min={0} step="0.50"
              value={form.depositPerBottle} onChange={f("depositPerBottle")} />
          </Field>
          <Field label="Date Borrowed">
            <input className="input" type="date" value={form.dateBorrowed} onChange={f("dateBorrowed")} />
          </Field>
          <Field label="Due Date (optional)">
            <input className="input" type="date" value={form.dueDate} onChange={f("dueDate")}
              min={form.dateBorrowed} />
          </Field>
          <Field label="Notes (optional)" style={{ gridColumn: "1 / -1" }}>
            <input className="input" value={form.notes} onChange={f("notes")} placeholder="Any remarks…" />
          </Field>
        </div>

        {/* Preview total */}
        {+form.qty > 0 && (
          <div style={{
            background: "#fffbeb", border: "1.5px solid #fde68a",
            borderRadius: 10, padding: "12px 16px", marginBottom: 12,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Deposit to Collect</div>
              <div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>
                {form.qty} bottle{+form.qty !== 1 ? "s" : ""} × {fmt(form.depositPerBottle)}
                {form.dueDate && <> · Due: <strong>{form.dueDate}</strong></>}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706", fontFamily: "'Sora', sans-serif" }}>
              {fmt(+form.qty * +form.depositPerBottle)}
            </div>
          </div>
        )}

        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={saveDeposit} disabled={saving}>
            {saving ? "Saving…" : "Save Deposit"}
          </Btn>
        </div>
      </Modal>

      {/* ── Return Bottles Modal ── */}
      <Modal open={modal === "return" && !!selected} onClose={() => setModal(null)} title="🔄 Record Bottle Return">
        {selected && (
          <>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", marginBottom: 16, border: "1.5px solid var(--color-border)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {isOverdue(selected) && <span style={{ color: "#dc2626" }}>🚨 OVERDUE — </span>}
                {selected.customer_name}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--color-text-secondary)" }}>
                <span>🍾 {selected.bottle_type} {selected.bottle_size}</span>
                <span>Borrowed: <strong>{selected.qty}</strong></span>
                <span>Returned: <strong style={{ color: "var(--color-green)" }}>{selected.returned_qty}</strong></span>
                <span>Still out: <strong style={{ color: "#dc2626" }}>{selected.qty - selected.returned_qty}</strong></span>
                {selected.due_date && (
                  <span>Due: <strong style={{ color: isOverdue(selected) ? "#dc2626" : "#d97706" }}>{selected.due_date}</strong></span>
                )}
              </div>
            </div>

            <Field label="Bottles Being Returned Now">
              <input
                className="input" type="number" min={1}
                max={selected.qty - selected.returned_qty}
                value={returnQty}
                onChange={e => setReturnQty(+e.target.value)}
                autoFocus
              />
            </Field>

            <div style={{
              background: "#ecfdf5", border: "1.5px solid #a7f3d0",
              borderRadius: 10, padding: "12px 16px", marginBottom: 16,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11, color: "#065f46", fontWeight: 700, textTransform: "uppercase" }}>Deposit to Refund</div>
                <div style={{ fontSize: 11, color: "#065f46", marginTop: 2 }}>
                  {returnQty} bottle{returnQty !== 1 ? "s" : ""} × {fmt(selected.deposit_per_bottle)}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-green)", fontFamily: "'Sora', sans-serif" }}>
                {fmt(returnQty * +selected.deposit_per_bottle)}
              </div>
            </div>

            <div className="modal__footer">
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn onClick={processReturn}
                disabled={saving || returnQty < 1 || returnQty > selected.qty - selected.returned_qty}>
                {saving ? "Saving…" : "Confirm Return"}
              </Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}