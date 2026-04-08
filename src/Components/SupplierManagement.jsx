import { useState } from "react";
import Icon from "../Components/Icon";
import { Btn, Modal, Field } from "../Components/Primitives";

// ─── CSS injected once ────────────────────────────────────────────────────────
const SUPPLIER_CSS = `
  /* ── Supplier grid ── */
  .supplier-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  /* ── Supplier card ── */
  .supplier-card {
    background: #fff7ed;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: box-shadow 0.15s;
  }
  .supplier-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }

  .supplier-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 16px 0;
    gap: 10px;
  }

  .supplier-card__name {
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.3;
  }

  .supplier-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px 16px;
  }

  .supplier-meta-item {
    background: #d670046b;
    border-radius: var(--radius-md);
    padding: 8px 10px;
  }

  .supplier-meta-item__label {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 3px;
  }

  .supplier-meta-item__value {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .supplier-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px 10px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .supplier-card__stats {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .supplier-card__perf {
    padding: 0 16px 12px;
  }

  .supplier-perf-badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    margin-top: 7px;
    margin-bottom: -5px;
  }

  /* ── Notes section on card ── */
  .supplier-notes-section {
    border-top: 1px solid var(--color-border-soft);
    padding: 10px 16px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .supplier-notes-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .supplier-notes-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .supplier-notes-body {
    font-size: 12.5px;
    color: var(--color-text-secondary);
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .supplier-notes-empty {
    font-size: 12px;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .supplier-notes-add-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-indigo);
    padding: 2px 6px;
    border-radius: 6px;
    transition: background 0.12s;
    white-space: nowrap;
  }
  .supplier-notes-add-btn:hover { background: var(--color-indigo-light); }

  /* ── Inline note editor ── */
  .supplier-note-editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .supplier-note-textarea {
    width: 100%;
    min-height: 80px;
    max-height: 180px;
    padding: 9px 11px;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px;
    color: var(--color-text-primary);
    background: var(--color-bg);
    resize: vertical;
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .supplier-note-textarea:focus { border-color: var(--color-indigo); background: #fff; }

  .supplier-note-char {
    font-size: 10px;
    color: var(--color-text-muted);
    text-align: right;
    margin-top: -4px;
  }
  .supplier-note-char--warn { color: var(--color-yellow); }
  .supplier-note-char--over { color: var(--color-red); }

  .supplier-note-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  /* ── Notes modal (view all notes) ── */
  .notes-modal-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .notes-modal-current {
    background: var(--color-bg);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 14px;
    font-size: 13px;
    color: #44290d;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 60px;
  }

  .notes-modal-textarea {
    width: 100%;
    min-height: 140px;
    padding: 12px 14px;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--color-text-primary);
    background: #fff;
    resize: vertical;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }
  .notes-modal-textarea:focus {
    border-color: var(--color-indigo);
    box-shadow: var(--shadow-focus);
  }

  /* ── Star rating ── */
  .star-rating-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .star-rating-stars { display: flex; gap: 2px; }
  .star-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 1px 2px;
    line-height: 1;
    transition: transform 0.1s;
    color: #d1d5db;
  }
  .star-btn--filled { color: #f59e0b; }
  .star-rating-stars--interactive .star-btn:hover { transform: scale(1.25); }
  .star-btn:disabled { cursor: default; }
  .star-rating-label { font-size: 12px; font-weight: 600; }
  .star-value { font-size: 12px; font-weight: 700; color: var(--color-text-secondary); }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .supplier-grid { grid-template-columns: 1fr; gap: 12px; }
    .supplier-card__footer { flex-direction: column; align-items: flex-start; }
  }
`;

function InjectSupplierStyles() {
  const id = "supplier-mgmt-styles";
  if (typeof document !== "undefined" && !document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = SUPPLIER_CSS;
    document.head.appendChild(el);
  }
  return null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const NOTE_MAX = 500;

const RATING_LABELS  = { 0:"", 1:"Poor", 2:"Fair", 3:"Good", 4:"Very Good", 5:"Excellent" };
const RATING_COLORS  = { 1:"#ef4444", 2:"#f97316", 3:"#eab308", 4:"#22c55e", 5:"#4f46e5" };

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || Math.round(value);
  const label   = RATING_LABELS[display] || "";
  const color   = RATING_COLORS[display] || "#f59e0b";

  return (
    <div className="star-rating-wrap">
      <div
        className={`star-rating-stars${readonly ? "" : " star-rating-stars--interactive"}`}
        onMouseLeave={() => !readonly && setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button"
            className={`star-btn ${n <= display ? "star-btn--filled" : "star-btn--empty"}`}
            style={n <= display ? { color } : {}}
            onMouseEnter={() => !readonly && setHovered(n)}
            onClick={() => !readonly && onChange(n)}
            disabled={readonly}
            aria-label={`Rate ${n} out of 5`}
          >★</button>
        ))}
      </div>

      {!readonly && (
        <span className="star-rating-label" style={{ color: display ? color : "var(--color-text-muted)" }}>
          {display ? `${display}/5 — ${label}` : "Click to rate"}
        </span>
      )}
      {readonly && <span className="star-value">{Number(value).toFixed(1)}</span>}
    </div>
  );
}

// ─── Inline Note Editor (shown directly on the card) ──────────────────────────
function InlineNoteEditor({ initial, onSave, onCancel, saving }) {
  const [text, setText] = useState(initial || "");
  const over  = text.length > NOTE_MAX;
  const warn  = text.length > NOTE_MAX * 0.85 && !over;

  return (
    <div className="supplier-note-editor">
      <textarea
        className="supplier-note-textarea"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your feedback, observations, or reminders about this supplier…"
        maxLength={NOTE_MAX + 50}   // allow slightly over so char counter shows red
        autoFocus
      />
      <div className={`supplier-note-char${over ? " supplier-note-char--over" : warn ? " supplier-note-char--warn" : ""}`}>
        {text.length}/{NOTE_MAX}
      </div>
      <div className="supplier-note-actions">
        <Btn size="sm" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Btn>
        <Btn size="sm" onClick={() => !over && onSave(text)} disabled={saving || over}>
          {saving ? "Saving…" : "💾 Save Note"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Notes Modal (full-screen view + edit) ────────────────────────────────────
function NotesModal({ open, onClose, supplier, onSave }) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState(supplier?.notes || "");
  const [saving,  setSaving]    = useState(false);

  // Reset when supplier changes or modal opens
  const handleOpen = () => {
    setDraft(supplier?.notes || "");
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  const over = draft.length > NOTE_MAX;
  const warn = draft.length > NOTE_MAX * 0.85 && !over;

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`📝 Notes — ${supplier?.name}`}
      maxWidth={480}
      onAfterOpen={handleOpen}
    >
      <div className="notes-modal-body">

        {!editing ? (
          <>
            {/* Current note display */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#44290d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Current Note
              </div>
              <div className="notes-modal-current">
                {supplier?.notes
                  ? supplier.notes
                  : <span style={{ color: "#44290d", fontStyle: "italic" }}>No note written yet. Click "Edit" to add one.</span>
                }
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={onClose}>Close</Btn>
              <Btn onClick={() => { setDraft(supplier?.notes || ""); setEditing(true); }}>
                ✏️ Edit Note
              </Btn>
            </div>
          </>
        ) : (
          <>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#44290d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Edit Note
              </div>
              <textarea
                className="notes-modal-textarea"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Write your thoughts, experiences, or reminders about this supplier…"
                maxLength={NOTE_MAX + 50}
                autoFocus
              />
              <div style={{
                fontSize: 11, textAlign: "right", marginTop: 5,
                color: over ? "#dc2626" : warn ? "#d97706" : "#44290d",
                fontWeight: over || warn ? 700 : 400,
              }}>
                {draft.length}/{NOTE_MAX} characters
              </div>
            </div>

            {/* Quick suggestion chips */}
            <div>
              <div style={{ fontSize: 11, color: "#44290d", marginBottom: 6 }}>Quick starters:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  "✅ Reliable supplier.",
                  "⚠️ Deliveries often late.",
                  "💬 Great communication.",
                  "❌ Quality issues noted.",
                  "📦 Always accurate orders.",
                  "🤝 Good pricing deals.",
                ].map(chip => (
                  <button key={chip}
                    onClick={() => setDraft(prev => prev ? prev + "\n" + chip : chip)}
                    style={{
                      background: "#f1f5f9", border: "1px solid #e2e8f0",
                      borderRadius: 99, padding: "4px 10px",
                      fontSize: 11, fontWeight: 600, color: "#475569",
                      cursor: "pointer", transition: "all 0.12s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.borderColor = "#818cf8"; e.currentTarget.style.color = "#4f46e5"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Btn>
              {supplier?.notes && (
                <Btn variant="danger" onClick={() => { setDraft(""); }} disabled={saving}>
                  🗑 Clear
                </Btn>
              )}
              <Btn onClick={handleSave} disabled={saving || over}>
                {saving ? "Saving…" : "💾 Save Note"}
              </Btn>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SupplierManagement({
  suppliers, purchaseOrders,
  onAddSupplier, onUpdateSupplier, onDeleteSupplier,
}) {
  InjectSupplierStyles();

  const [modal,    setModal]    = useState(null);   // "add" | "edit" | null
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState({});

  // ── Notes state ─────────────────────────────────────────────────────────────
  // noteTarget: supplier object currently open in the Notes modal
  const [noteTarget,    setNoteTarget]    = useState(null);
  // inlineEditing: supplierId whose inline editor is open on the card
  const [inlineEditing, setInlineEditing] = useState(null);
  const [inlineSaving,  setInlineSaving]  = useState(false);

  // ── Supplier form handlers ───────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ name: "", terms: "CASH", rating: 0, notes: "" });
    setModal("add");
  };

  const openEdit = s => {
    setSelected(s);
    setForm({ ...s });
    setModal("edit");
  };

  const f = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const save = async () => {
    if (modal === "add") {
      await onAddSupplier?.({
        ...form,
        id: "s" + Date.now(),
        totalOrders: 0,
        onTimeDelivery: 100,
        deliveryTime: 3,
      });
    } else if (selected) {
      await onUpdateSupplier?.(selected.id, { ...form });
    }
    setModal(null);
  };

  const del = async id => {
    if (!window.confirm("Delete this supplier? This cannot be undone.")) return;
    await onDeleteSupplier?.(id);
  };

  const updateRatingInline = async (supplierId, newRating) => {
    await onUpdateSupplier?.(supplierId, { rating: newRating });
  };

  // ── Note save (from both inline and modal) ───────────────────────────────────
  const saveNote = async (supplierId, noteText) => {
    await onUpdateSupplier?.(supplierId, { notes: noteText });
  };

  // Inline card save
  const handleInlineSave = async (supplier, text) => {
    setInlineSaving(true);
    await saveNote(supplier.id, text);
    setInlineSaving(false);
    setInlineEditing(null);
  };

  // Modal save — also updates noteTarget so the modal re-renders fresh
  const handleModalSave = async (text) => {
    await saveNote(noteTarget.id, text);
    // Reflect the new note in the modal's supplier object
    setNoteTarget(prev => ({ ...prev, notes: text }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Supplier Management</h1>
          <p className="page-header__sub">{suppliers.length} active supplier{suppliers.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn onClick={openAdd} icon="plus">Add Supplier</Btn>
      </div>

      {/* ── Supplier Cards ── */}
      <div className="supplier-grid">
        {suppliers.map(s => {
          const orders     = purchaseOrders.filter(p => p.supplierId === s.id);
          const totalSpent = orders.reduce((sum, p) => sum + p.total, 0);
          const isInlineOpen = inlineEditing === s.id;
          const hasNote = s.notes && s.notes.trim().length > 0;

          return (
            <div key={s.id} className="supplier-card">

              {/* ── Card header ── */}
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

              {/* ── Meta grid ── */}
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

              {/* ── Footer row ── */}
              <div className="supplier-card__footer">
                <span className="supplier-card__stats">
                  {orders.length} orders · ₱{totalSpent.toLocaleString()}
                </span>
                <StarRating
                  value={s.rating}
                  onChange={newRating => updateRatingInline(s.id, newRating)}
                />
              </div>

              {/* ── Performance badge ── */}
              {s.rating > 0 && (
                <div className="supplier-card__perf">
                  <span className="supplier-perf-badge" style={{
                    background: s.rating >= 4 ? "#ecfdf5" : s.rating >= 3 ? "#fffbeb" : "#fef2f2",
                    color:      s.rating >= 4 ? "#065f46" : s.rating >= 3 ? "#92400e" : "#991b1b",
                    border:     `1px solid ${s.rating >= 4 ? "#a7f3d0" : s.rating >= 3 ? "#fde68a" : "#fecaca"}`,
                  }}>
                    {s.rating >= 4.5 ? "⭐ Top Performer"
                      : s.rating >= 4  ? "✅ Good Supplier"
                      : s.rating >= 3  ? "⚠️ Average"
                      : "❌ Needs Improvement"}
                  </span>
                </div>
              )}

              {/* ══════════════════════════════════════════════════
                  ── NOTES SECTION ──
                  Shows preview on card; full editor in modal.
                  ══════════════════════════════════════════════════ */}
              <div className="supplier-notes-section">
                <div className="supplier-notes-header">
                  <div className="supplier-notes-label">
                    📝 Notes
                    {hasNote && (
                      <span style={{
                        background: "#eef2ff", color: "#4f46e5",
                        border: "1px solid #c7d2fe",
                        borderRadius: 99, fontSize: 9, fontWeight: 800,
                        padding: "1px 6px", letterSpacing: "0.03em",
                      }}>
                        HAS NOTE
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 4 }}>
                    {/* Open full modal */}
                    <button
                      className="supplier-notes-add-btn"
                      onClick={() => { setNoteTarget(s); setInlineEditing(null); }}
                      title="Open full notes editor"
                    >
                      {hasNote ? "✏️ Edit" : "＋ Add note"}
                    </button>
                  </div>
                </div>

                {/* Inline editor OR preview */}
                {isInlineOpen ? (
                  <InlineNoteEditor
                    initial={s.notes || ""}
                    onSave={text => handleInlineSave(s, text)}
                    onCancel={() => setInlineEditing(null)}
                    saving={inlineSaving}
                  />
                ) : (
                  hasNote ? (
                    <div
                      className="supplier-notes-body"
                      onClick={() => setNoteTarget(s)}
                      title="Click to view / edit full note"
                      style={{ cursor: "pointer" }}
                    >
                      {/* Show max 3 lines as preview */}
                      {s.notes.length > 140
                        ? s.notes.slice(0, 140) + "…"
                        : s.notes}
                    </div>
                  ) : (
                    <div className="supplier-notes-empty">
                      No notes yet. Share your feedback about this supplier.
                    </div>
                  )
                )}
              </div>
              {/* ── end notes section ── */}

            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          ── ADD / EDIT SUPPLIER MODAL ──
          ══════════════════════════════════════════════════════ */}
      <Modal
        open={modal === "add" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "add" ? "➕ Add Supplier" : "✏️ Edit Supplier"}
      >
        <div className="form-grid-2">
          <Field label="Company Name" required>
            <input className="input" value={form.name || ""} onChange={f("name")} placeholder="e.g. FreshGoods Co." />
          </Field>
          <Field label="Payment Terms">
            <select className="select" value={form.terms || "CASH"} onChange={f("terms")}>
              {["CASH", "GCASH", "Net 7", "Net 15", "Net 30", "COD"].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Rating inside modal */}
        <Field label="Supplier Performance Rating">
          <div className="modal-rating-wrap">
            <StarRating
              value={form.rating || 0}
              onChange={n => setForm(prev => ({ ...prev, rating: n }))}
            />
          </div>
        </Field>

        {/* Notes field inside add/edit modal */}
        <Field label="Notes / Feedback (optional)">
          <textarea
            className="notes-modal-textarea"
            value={form.notes || ""}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any observations, feedback, or reminders about this supplier…"
            maxLength={NOTE_MAX + 50}
            style={{ minHeight: 90 }}
          />
          <div style={{
            fontSize: 11, textAlign: "right", marginTop: 4,
            color: (form.notes?.length || 0) > NOTE_MAX ? "#dc2626"
              : (form.notes?.length || 0) > NOTE_MAX * 0.85 ? "#d97706"
              : "#94a3b8",
          }}>
            {form.notes?.length || 0}/{NOTE_MAX}
          </div>
        </Field>

        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>Save Supplier</Btn>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          ── NOTES MODAL (full note editor per supplier) ──
          ══════════════════════════════════════════════════════ */}
      <NotesModal
        open={!!noteTarget}
        onClose={() => setNoteTarget(null)}
        supplier={noteTarget}
        onSave={handleModalSave}
      />
    </div>
  );
}