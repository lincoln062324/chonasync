import { useState, useEffect, useCallback } from "react";
import { Btn, Modal, Field, Badge } from "../Components/Primitives";
import Icon from "../Components/Icon";

const AVATAR_COLORS = [
  "#4f46e5","#059669","#dc2626","#d97706","#7c3aed",
  "#0891b2","#c2410c","#065f46","#1d4ed8","#9333ea",
];

const ROLES = ["cashier", "staff", "admin", "owner"];

const ROLE_META = {
  owner:   { label: "👑 Owner",   bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  admin:   { label: "🔧 Admin",   bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
  cashier: { label: "💰 Cashier", bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
  staff:   { label: "👤 Staff",   bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
};

const ACTION_META = {
  login:           { icon: "🔐", color: "#059669", bg: "#ecfdf5" },
  logout:          { icon: "🚪", color: "#64748b", bg: "#f1f5f9" },
  navigate:        { icon: "🧭", color: "#0891b2", bg: "#ecfeff" },
  sale:            { icon: "🛒", color: "#d97706", bg: "#fffbeb" },
  stock_adjust:    { icon: "📦", color: "#7c3aed", bg: "#f5f3ff" },
  account_created: { icon: "✨", color: "#4f46e5", bg: "#eef2ff" },
  // ── Profile self-service actions ──────────────────────────────────────────
  profile_updated: { icon: "✏️", color: "#7c3aed", bg: "#f5f3ff" },
  pin_changed:     { icon: "🔑", color: "#d97706", bg: "#fffbeb" },
  pin_reset:       { icon: "🔑", color: "#dc2626", bg: "#fef2f2" },  // admin-reset
  account_deactivated: { icon: "🚫", color: "#dc2626", bg: "#fef2f2" },
  default:         { icon: "📋", color: "#475569", bg: "#f8fafc" },
};

const TABS = [
  { id: "activity",  label: "Activity Feed",   icon: "📡" },
  { id: "logins",    label: "Login History",   icon: "🔐" },
  { id: "accounts",  label: "Accounts",         icon: "👥" },
  { id: "audit",     label: "Audit Logs",       icon: "📋" },
];

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Avatar({ name, color, url, size = 36 }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img src={url} alt={name} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
          border: `2px solid ${color || "#4f46e5"}` }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color || "#4f46e5",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 800, color: "#fff", flexShrink: 0,
    }}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function AccountsActivity({ currentUser }) {
  const [tab,      setTab]      = useState("activity");
  const [logs,     setLogs]     = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // Account modal state
  const [modal,      setModal]      = useState(null);  // "add" | "edit" | "pin" | null
  const [selAcc,     setSelAcc]     = useState(null);
  const [form,       setForm]       = useState({});
  const [pinStep,    setPinStep]    = useState(1);
  const [pinA,       setPinA]       = useState("");
  const [pinB,       setPinB]       = useState("");
  const [pinErr,     setPinErr]     = useState("");
  const [actionMsg,  setActionMsg]  = useState("");

  // Filters
  const [filterAction, setFilterAction] = useState("All");
  const [filterUser,   setFilterUser]   = useState("All");

  const canManage = ["admin","owner"].includes(currentUser?.role?.toLowerCase());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { fetchAuditLogs, fetchAccounts } = await import("../lib/supabase.js");
      const [logsData, accsData] = await Promise.all([
        fetchAuditLogs({ limit: 200 }),
        fetchAccounts(),
      ]);
      setLogs(logsData);
      setAccounts(accsData);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const loginLogs   = logs.filter(l => l.action === "login");
  const actionTypes = ["All", ...new Set(logs.map(l => l.action))];
  const userList    = ["All", ...new Set(logs.map(l => l.userName).filter(Boolean))];

  const filteredLogs = logs.filter(l =>
    (filterAction === "All" || l.action === filterAction) &&
    (filterUser   === "All" || l.userName === filterUser)
  );

  // ── Profile-change events summary ─────────────────────────────────────────
  const profileChangeLogs = logs.filter(l =>
    l.action === "profile_updated" || l.action === "pin_changed" || l.action === "pin_reset"
  );

  // ── Account CRUD ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ name: "", role: "cashier", avatarColor: AVATAR_COLORS[0] });
    setPinA(""); setPinB(""); setPinStep(1); setPinErr("");
    setModal("add");
  };

  const openPin = (acc) => {
    setSelAcc(acc);
    setPinA(""); setPinB(""); setPinStep(1); setPinErr("");
    setModal("pin");
  };

  const saveAccount = async () => {
    if (!form.name?.trim()) { setPinErr("Name is required."); return; }
    if (pinA.length < 4)    { setPinErr("Set a 4-digit PIN first."); return; }
    try {
      const { createAccount, logActivity } = await import("../lib/supabase.js");
      const acc = await createAccount({ name: form.name, role: form.role, avatarColor: form.avatarColor, pin: pinA });
      await logActivity(currentUser?.id, "account_created", `Created account: ${acc.name} (${acc.role})`);
      setActionMsg(`✅ Account "${acc.name}" created!`);
      setModal(null);
      load();
      setTimeout(() => setActionMsg(""), 3500);
    } catch (err) { setPinErr(err.message); }
  };

  const savePin = async () => {
    if (pinA !== pinB) { setPinErr("PINs don't match."); setPinB(""); setPinStep(1); return; }
    if (pinA.length !== 4) { setPinErr("PIN must be 4 digits."); return; }
    try {
      const { updateAccountPin, logActivity } = await import("../lib/supabase.js");
      await updateAccountPin(selAcc.id, pinA);
      await logActivity(currentUser?.id, "pin_reset", `Admin reset PIN for: ${selAcc.name}`);
      setActionMsg(`✅ PIN reset for "${selAcc.name}".`);
      setModal(null);
      setTimeout(() => setActionMsg(""), 3500);
    } catch (err) { setPinErr(err.message); }
  };

  const deactivate = async (acc) => {
    if (!window.confirm(`Deactivate account "${acc.name}"? They won't be able to log in.`)) return;
    try {
      const { deactivateAccount, logActivity } = await import("../lib/supabase.js");
      await deactivateAccount(acc.id);
      await logActivity(currentUser?.id, "account_deactivated", `Deactivated: ${acc.name}`);
      setActionMsg(`⚠️ "${acc.name}" has been deactivated.`);
      load();
      setTimeout(() => setActionMsg(""), 3500);
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Accounts &amp; Activity</h1>
          <p className="page-header__sub">
            {accounts.length} accounts · {logs.length} activity records
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" onClick={load} icon="refresh">Refresh</Btn>
          {canManage && <Btn onClick={openAdd} icon="plus">Add Account</Btn>}
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div style={{
          background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10,
          padding: "10px 16px", marginBottom: 16, color: "#065f46", fontWeight: 600, fontSize: 13,
        }}>
          {actionMsg}
        </div>
      )}

      {/* ── Profile change summary banner ── */}
      {profileChangeLogs.length > 0 && (
        <div style={{
          background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: 12,
          padding: "12px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 22 }}>✏️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#7c3aed", fontSize: 13 }}>
              {profileChangeLogs.length} Profile Change{profileChangeLogs.length !== 1 ? "s" : ""} Recorded
            </div>
            <div style={{ fontSize: 12, color: "#6d28d9", marginTop: 2 }}>
              {profileChangeLogs.slice(0, 3).map(l => `${l.userName} (${l.action.replace(/_/g, " ")})`).join(" · ")}
              {profileChangeLogs.length > 3 && ` +${profileChangeLogs.length - 3} more`}
            </div>
          </div>
          <button onClick={() => { setTab("audit"); setFilterAction("profile_updated"); }}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #7c3aed", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            View →
          </button>
        </div>
      )}

      {/* Summary stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", marginBottom: 20 }}>
        {[
          { label: "Total Accounts",   value: accounts.length,          icon: "👥", bg: "#eef2ff", color: "#4f46e5" },
          { label: "Total Logins",     value: loginLogs.length,         icon: "🔐", bg: "#ecfdf5", color: "#059669" },
          { label: "Activity Records", value: logs.length,              icon: "📋", bg: "#fffbeb", color: "#d97706" },
          { label: "Profile Changes",  value: profileChangeLogs.length, icon: "✏️", bg: "#f5f3ff", color: "#7c3aed" },
          { label: "Active Today",
            value: [...new Set(logs.filter(l => {
              const d = new Date(l.createdAt), t = new Date();
              return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
            }).map(l => l.accountId))].length,
            icon: "🟢", bg: "#f0fdf4", color: "#15803d",
          },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card__icon" style={{ background: s.bg, color: s.color, fontSize: 20 }}>{s.icon}</div>
            <div>
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="report-tabs" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`report-tab${tab === t.id ? " report-tab--active" : ""}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>Loading…</div>}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
          ⚠️ {error}
          <button onClick={load} style={{ marginLeft: 12, background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {/* ── ACTIVITY FEED ── */}
      {!loading && tab === "activity" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <select className="select" value={filterUser}   onChange={e => setFilterUser(e.target.value)}   style={{ minWidth: 140 }}>
              {userList.map(u => <option key={u}>{u}</option>)}
            </select>
            <select className="select" value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ minWidth: 140 }}>
              {actionTypes.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div className="card card--padded">
            {filteredLogs.length === 0 ? (
              <p className="alert-empty">No activity records found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {filteredLogs.map(log => {
                  const meta = ACTION_META[log.action] ?? ACTION_META.default;
                  const isProfileChange = log.action === "profile_updated" || log.action === "pin_changed";
                  return (
                    <div key={log.id}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "10px 12px", borderRadius: 8, transition: "background 0.1s",
                        background: isProfileChange ? `${meta.bg}80` : "transparent",
                        border: isProfileChange ? `1px solid ${meta.color}30` : "1px solid transparent",
                      }}
                      onMouseEnter={e => { if (!isProfileChange) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (!isProfileChange) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, background: meta.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, flexShrink: 0,
                      }}>
                        {meta.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {log.userName || "Unknown"}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                            background: meta.bg, color: meta.color,
                            textTransform: "uppercase", letterSpacing: "0.05em",
                          }}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </div>
                        {log.detail && (
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{log.detail}</div>
                        )}
                      </div>

                      <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {timeAgo(log.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOGIN HISTORY ── */}
      {!loading && tab === "logins" && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>When</th><th>Date &amp; Time</th></tr>
            </thead>
            <tbody>
              {loginLogs.length === 0 ? (
                <tr><td colSpan={4} className="table-empty">No login records found.</td></tr>
              ) : loginLogs.map(log => {
                const rm = ROLE_META[log.userRole] ?? ROLE_META.staff;
                return (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>
                          {(log.userName || "?").charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{log.userName || "Unknown"}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: rm.bg, color: rm.color, border: `1px solid ${rm.border}`, textTransform: "capitalize" }}>
                        {log.userRole}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{timeAgo(log.createdAt)}</td>
                    <td style={{ fontSize: 12, color: "#475569" }}>{formatDateTime(log.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ACCOUNTS ── */}
      {!loading && tab === "accounts" && (
        <div>
          <div className="supplier-grid">
            {accounts.map(acc => {
              const rm = ROLE_META[acc.role?.toLowerCase()] ?? ROLE_META.staff;
              const accLogs   = logs.filter(l => l.accountId === acc.id);
              const lastLogin = loginLogs.find(l => l.accountId === acc.id);
              const profileChanges = accLogs.filter(l => l.action === "profile_updated" || l.action === "pin_changed");

              return (
                <div key={acc.id} className="supplier-card">
                  <div className="supplier-card__header">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={acc.name} color={acc.avatarColor} url={acc.avatarUrl} size={40} />
                      <div>
                        <div className="supplier-card__name">{acc.name}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: rm.bg, color: rm.color, border: `1px solid ${rm.border}`, textTransform: "capitalize" }}>
                          {rm.label}
                        </span>
                      </div>
                    </div>
                    {canManage && (
                      <div className="btn-row">
                        <Btn size="sm" variant="secondary" onClick={() => openPin(acc)} title="Reset PIN">🔑</Btn>
                        {acc.id !== currentUser?.id && (
                          <Btn size="sm" variant="danger" onClick={() => deactivate(acc)}>
                            <Icon name="trash" size={12} />
                          </Btn>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="supplier-meta-grid">
                    {[
                      ["Activity",       `${accLogs.length} records`],
                      ["Last Login",     lastLogin ? timeAgo(lastLogin.createdAt) : "Never"],
                      ["Profile Edits",  profileChanges.length > 0 ? `${profileChanges.length} time${profileChanges.length > 1 ? "s" : ""}` : "None"],
                    ].map(([label, value]) => (
                      <div key={label} className="supplier-meta-item">
                        <div className="supplier-meta-item__label">{label}</div>
                        <div className="supplier-meta-item__value">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Last activity */}
                  {accLogs[0] && (
                    <div style={{ fontSize: 11, color: "#b15b00c4", padding: "8px 0 0", borderTop: "1px solid #f1f5f9", marginTop: 8 }}>
                      Last: <span style={{ color: "rgba(121, 63, 1, 0.9)" }}>{accLogs[0].action.replace(/_/g, " ")}</span>
                      {" · "}{timeAgo(accLogs[0].createdAt)}
                    </div>
                  )}

                  {/* Profile change history for this account */}
                  {profileChanges.length > 0 && (
                    <div style={{ marginTop: 8, padding: "8px 10px", background: "#f5f3ff", borderRadius: 8, border: "1px solid #ddd6fe" }}>
                      <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 4 }}>
                        ✏️ Recent profile changes
                      </div>
                      {profileChanges.slice(0, 2).map(l => (
                        <div key={l.id} style={{ fontSize: 11, color: "#6d28d9", display: "flex", justifyContent: "space-between" }}>
                          <span>{l.action.replace(/_/g, " ")} — {l.detail || "—"}</span>
                          <span style={{ color: "#a78bfa", marginLeft: 8, flexShrink: 0 }}>{timeAgo(l.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {acc.id === currentUser?.id && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: 99 }}>
                        🟢 You
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AUDIT LOGS ── */}
      {!loading && tab === "audit" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <select className="select" value={filterUser}   onChange={e => setFilterUser(e.target.value)}   style={{ minWidth: 140 }}>
              {userList.map(u => <option key={u}>{u}</option>)}
            </select>
            <select className="select" value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ minWidth: 140 }}>
              {actionTypes.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>User</th><th>Role</th><th>Action</th><th>Detail</th><th>When</th><th>Date &amp; Time</th></tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={6} className="table-empty">No records found.</td></tr>
                ) : filteredLogs.map(log => {
                  const meta = ACTION_META[log.action] ?? ACTION_META.default;
                  const rm   = ROLE_META[log.userRole] ?? ROLE_META.staff;
                  const isProfileChange = log.action === "profile_updated" || log.action === "pin_changed";
                  return (
                    <tr key={log.id} style={{ background: isProfileChange ? `${meta.bg}60` : undefined }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>
                            {(log.userName || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="td-name">{log.userName || "Unknown"}</span>
                        </div>
                      </td>
                      <td>
                        {log.userRole && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: rm.bg, color: rm.color, border: `1px solid ${rm.border}`, textTransform: "capitalize" }}>
                            {log.userRole}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: meta.bg, color: meta.color }}>
                          {meta.icon} {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#64748b", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.detail || "—"}
                      </td>
                      <td style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(log.createdAt)}</td>
                      <td style={{ fontSize: 11, color: "#475569" }}>{formatDateTime(log.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ Add Account Modal ══ */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="Add New Account" maxWidth={480}>
        {pinStep === 0 ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Avatar name={form.name || "?"} color={form.avatarColor || "#4f46e5"} size={56} />
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {AVATAR_COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, avatarColor: c }))} style={{
                    width: 22, height: 22, borderRadius: "50%", background: c, border: "none",
                    cursor: "pointer", outline: form.avatarColor === c ? `3px solid ${c}` : "none", outlineOffset: 2,
                  }} />
                ))}
              </div>
            </div>

            <div className="form-grid-2">
              <Field label="Full Name" required style={{ gridColumn: "1/-1" }}>
                <input className="input" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </Field>
              <Field label="Role" style={{ gridColumn: "1/-1" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {ROLES.map(r => {
                    const rm2 = ROLE_META[r] ?? ROLE_META.staff;
                    return (
                      <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))} style={{
                        padding: "9px 0", borderRadius: 9,
                        border: `1.5px solid ${form.role === r ? rm2.color : "#e2e8f0"}`,
                        background: form.role === r ? rm2.bg : "#f8fafc",
                        color: form.role === r ? rm2.color : "#475569",
                        fontWeight: form.role === r ? 700 : 500, fontSize: 12,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize", transition: "all 0.15s",
                      }}>
                        {rm2.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            {pinErr && <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, margin: "8px 0" }}>{pinErr}</div>}

            <div className="modal__footer">
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn onClick={() => {
                if (!form.name?.trim()) { setPinErr("Name is required."); return; }
                setPinErr(""); setPinStep(1); setPinA(""); setPinB("");
              }}>Continue → Set PIN</Btn>
            </div>
          </>
        ) : (
          <ModalPinSetup
            step={pinStep} setStep={setPinStep}
            pinA={pinA} setPinA={setPinA}
            pinB={pinB} setPinB={setPinB}
            error={pinErr} setError={setPinErr}
            name={form.name} color={form.avatarColor}
            onComplete={saveAccount}
            onBack={() => setPinStep(0)}
          />
        )}
      </Modal>

      {/* ══ Admin PIN Reset Modal ══ */}
      <Modal open={modal === "pin"} onClose={() => setModal(null)} title={`Reset PIN — ${selAcc?.name}`} maxWidth={380}>
        {selAcc && (
          <ModalPinSetup
            step={pinStep} setStep={setPinStep}
            pinA={pinA} setPinA={setPinA}
            pinB={pinB} setPinB={setPinB}
            error={pinErr} setError={setPinErr}
            name={selAcc.name} color={selAcc.avatarColor}
            onComplete={savePin}
            onBack={() => setModal(null)}
            backLabel="Cancel"
          />
        )}
      </Modal>
    </div>
  );
}

/* ── PIN Setup sub-component (shared between add & admin-reset) ── */
function ModalPinSetup({ step, setStep, pinA, setPinA, pinB, setPinB, error, setError, name, color, onComplete, onBack, backLabel = "← Back" }) {
  const isCurrent = step === 1 ? pinA : pinB;
  const currentSetter = step === 1 ? setPinA : setPinB;

  const handleKey = (val) => {
    setError("");
    if (val === "⌫") { currentSetter(p => p.slice(0, -1)); return; }
    if (val === "C")  { currentSetter(""); return; }
    if (isCurrent.length >= 4) return;
    const next = isCurrent + val;
    currentSetter(next);
    if (next.length === 4) {
      if (step === 1) {
        setTimeout(() => setStep(2), 80);
      } else {
        setTimeout(() => {
          if (pinA !== next) {
            setError("PINs don't match. Try again.");
            setPinA(""); setPinB(""); setStep(1);
          } else {
            onComplete(next);
          }
        }, 80);
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: color || "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>
          {(name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{name}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{step === 1 ? "Set a 4-digit PIN" : "Confirm your PIN"}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ height: 4, flex: 1, borderRadius: 99, background: step >= s ? (color || "#4f46e5") : "#e2e8f0", transition: "background 0.2s" }} />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: "50%",
            background: i < isCurrent.length ? (color || "#4f46e5") : "transparent",
            border: `2.5px solid ${i < isCurrent.length ? (color || "#4f46e5") : "#cbd5e1"}`,
            transition: "all 0.15s", transform: i < isCurrent.length ? "scale(1.15)" : "scale(1)",
          }} />
        ))}
      </div>

      {error && <div style={{ textAlign: "center", fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 14 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map(key => {
          const isClear = key === "C", isBack = key === "⌫";
          return (
            <button key={key} onClick={() => handleKey(key)} style={{
              padding: "13px 0", borderRadius: 10, border: "1.5px solid #e2e8f0",
              background: isClear ? "#fef2f2" : isBack ? "#fff7ed" : "#f8fafc",
              color: isClear ? "#dc2626" : isBack ? "#c2410c" : "#0f172a",
              fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.1s",
            }}>
              {key}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Btn variant="secondary" onClick={onBack}>{backLabel}</Btn>
        {step === 2 && <Btn variant="secondary" onClick={() => { setPinA(""); setPinB(""); setStep(1); setError(""); }}>← Re-enter</Btn>}
      </div>
    </div>
  );
}