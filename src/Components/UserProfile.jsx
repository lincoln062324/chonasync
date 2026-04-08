// src/Components/UserProfile.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Self-service profile page: edit display name, avatar color/photo, and PIN.
// Fully responsive: stacks on mobile, two-column on tablet+, wide on desktop.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { Btn, Field, Modal } from "../Components/Primitives";

/* ─── Inline responsive styles injected once ─────────────────────────────── */
const PROFILE_CSS = `
  /* ── Profile page layout ─────────────────────────────── */
  .profile-page { width: 100%; }

  .profile-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 20px;
    align-items: start;
  }

  .profile-left  { display: flex; flex-direction: column; gap: 16px; }
  .profile-right { display: flex; flex-direction: column; gap: 16px; }

  /* Hero banner shown only on mobile */
  .profile-hero { display: none; }

  /* Avatar preview row */
  .profile-avatar-row {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 18px;
  }

  /* Color swatch strip */
  .profile-swatches {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* Account info rows */
  .profile-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid #f1f5f9;
  }

  /* Action buttons row */
  .profile-actions {
    display: flex;
    gap: 10px;
  }
  .profile-actions .btn { flex: 1; }

  /* Activity log list */
  .profile-log-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 6px;
    border-radius: 8px;
    transition: background 0.1s;
    cursor: default;
  }
  .profile-log-item:hover { background: #f8fafc; }

  /* ── Tablet (≤900px): maintain two col but tighten ───── */
  @media (max-width: 900px) {
    .profile-grid {
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
  }

  /* ── Phablet (≤720px): single column ─────────────────── */
  @media (max-width: 720px) {
    .profile-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    /* Show compact hero on mobile */
    .profile-hero {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 18px;
      box-shadow: var(--shadow-card);
      margin-bottom: 4px;
    }

    .profile-hero__info { flex: 1; min-width: 0; }
    .profile-hero__name {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      font-family: 'Sora', sans-serif;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .profile-hero__role { margin-top: 5px; }
    .profile-hero__edit {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
    }

    /* Compact avatar row on mobile */
    .profile-avatar-row {
      gap: 14px;
      margin-bottom: 14px;
    }

    /* Stack action buttons vertically */
    .profile-actions {
      flex-direction: column;
    }
    .profile-actions .btn { width: 100%; }

    /* Page header simplified */
    .profile-page .page-header {
      margin-bottom: 14px;
    }
  }

  /* ── Small phones (≤480px) ─────────────────────────────── */
  @media (max-width: 480px) {
    .profile-swatches { gap: 6px; }

    .profile-hero {
      gap: 12px;
      padding: 14px;
    }

    .profile-hero__name { font-size: 15px; }

    .profile-grid { gap: 10px; }

    .card--padded { padding: 14px; }
  }

  /* ── Very small phones (≤360px) ───────────────────────── */
  @media (max-width: 360px) {
    .profile-hero { padding: 12px; gap: 10px; }
    .profile-hero__name { font-size: 14px; }
    .profile-swatches { gap: 5px; }
  }

  /* ── Wide screens (≥1280px): let the grid breathe ──────── */
  @media (min-width: 1280px) {
    .profile-grid {
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
      gap: 24px;
    }
  }
`;

function InjectProfileStyles() {
  useEffect(() => {
    const id = "profile-page-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = PROFILE_CSS;
      document.head.appendChild(el);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);
  return null;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  "#4f46e5","#059669","#dc2626","#d97706","#7c3aed",
  "#0891b2","#c2410c","#065f46","#1d4ed8","#9333ea",
];

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
  profile_updated: { icon: "✏️", color: "#7c3aed", bg: "#f5f3ff" },
  pin_changed:     { icon: "🔑", color: "#d97706", bg: "#fffbeb" },
  account_created: { icon: "✨", color: "#4f46e5", bg: "#eef2ff" },
  default:         { icon: "📋", color: "#475569", bg: "#f8fafc" },
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function AvatarDisplay({ user, size = 80 }) {
  const [imgErr, setImgErr] = useState(false);
  const showPhoto = user?.avatarUrl && !imgErr;
  return showPhoto ? (
    <img
      src={user.avatarUrl}
      alt={user.name}
      onError={() => setImgErr(true)}
      style={{
        width: size, height: size, borderRadius: "50%", objectFit: "cover",
        flexShrink: 0, border: `3px solid ${user.avatarColor || "#4f46e5"}`,
      }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: user?.avatarColor || "#4f46e5",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 800, color: "#fff", flexShrink: 0,
      userSelect: "none",
    }}>
      {(user?.name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function RolePill({ rm }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
      background: rm.bg, color: rm.color, border: `1px solid ${rm.border}`,
      textTransform: "capitalize", display: "inline-block",
    }}>
      {rm.label}
    </span>
  );
}

function PinDots({ filled, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 16 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: "50%",
          background: i < filled ? (color || "#4f46e5") : "transparent",
          border: `2.5px solid ${i < filled ? (color || "#4f46e5") : "#cbd5e1"}`,
          transition: "all 0.15s",
          transform: i < filled ? "scale(1.15)" : "scale(1)",
        }} />
      ))}
    </div>
  );
}

function Numpad({ onKey, color }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, maxWidth: 280, margin: "0 auto" }}>
      {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map(key => {
        const isClear = key === "C", isBack = key === "⌫";
        return (
          <button key={key} onClick={() => onKey(key)}
            style={{
              padding: "14px 0", borderRadius: 10, border: "1.5px solid #e2e8f0",
              background: isClear ? "#fef2f2" : isBack ? "#fff7ed" : "#f8fafc",
              color: isClear ? "#dc2626" : isBack ? "#c2410c" : "#0f172a",
              fontSize: 18, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.1s",
              touchAction: "manipulation",
            }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            onTouchStart={e => e.currentTarget.style.transform = "scale(0.93)"}
            onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function UserProfile({ currentUser, onUserUpdate }) {
  // ── Profile form state ─────────────────────────────────────────────────
  const [name,         setName]         = useState(currentUser?.name        || "");
  const [avatarColor,  setAvatarColor]  = useState(currentUser?.avatarColor || "#4f46e5");
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(currentUser?.avatarUrl   || null);
  const [saving,       setSaving]       = useState(false);
  const [profileMsg,   setProfileMsg]   = useState(null);

  // ── PIN change state ───────────────────────────────────────────────────
  const [pinModal, setPinModal] = useState(false);
  const [pinStep,  setPinStep]  = useState(1);
  const [pinA,     setPinA]     = useState("");
  const [pinB,     setPinB]     = useState("");
  const [pinErr,   setPinErr]   = useState("");
  const [pinOk,    setPinOk]    = useState(false);

  // ── Activity log ───────────────────────────────────────────────────────
  const [myLogs,      setMyLogs]      = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const photoRef = useRef(null);
  const rm = ROLE_META[currentUser?.role?.toLowerCase()] ?? ROLE_META.staff;

  // Sync fields on user change
  useEffect(() => {
    setName(currentUser?.name        || "");
    setAvatarColor(currentUser?.avatarColor || "#4f46e5");
    setPhotoPreview(currentUser?.avatarUrl   || null);
  }, [currentUser?.id]);

  // Load activity log
  const loadMyLogs = useCallback(async () => {
    if (!currentUser?.id) return;
    setLogsLoading(true);
    try {
      const { fetchAuditLogs } = await import("../lib/supabase.js");
      const data = await fetchAuditLogs({ accountId: currentUser.id, limit: 30 });
      setMyLogs(data);
    } catch { /* ignore */ }
    setLogsLoading(false);
  }, [currentUser?.id]);

  useEffect(() => { loadMyLogs(); }, [loadMyLogs]);

  // ── Photo handlers ─────────────────────────────────────────────────────
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: "err", text: "Photo must be under 5 MB." });
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(currentUser?.avatarUrl || null);
    if (photoRef.current) photoRef.current.value = "";
  };

  // ── Save profile ───────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!name.trim()) { setProfileMsg({ type: "err", text: "Name cannot be empty." }); return; }
    setSaving(true);
    setProfileMsg(null);

    const changes = [];
    if (name.trim() !== currentUser?.name)       changes.push("name");
    if (avatarColor !== currentUser?.avatarColor) changes.push("avatar color");
    if (photoFile)                                changes.push("profile photo");

    if (changes.length === 0) {
      setProfileMsg({ type: "ok", text: "No changes to save." });
      setSaving(false);
      return;
    }

    try {
      const { supabase, uploadAvatar, logActivity } = await import("../lib/supabase.js");
      const payload = { name: name.trim(), avatar_color: avatarColor };
      if (photoFile) {
        const url = await uploadAvatar(photoFile, currentUser.id);
        payload.avatar_url = url;
      }
      const { data, error } = await supabase
        .from("accounts")
        .update(payload)
        .eq("id", currentUser.id)
        .select()
        .single();
      if (error) throw error;

      const updatedUser = {
        ...currentUser,
        name:        data.name,
        avatarColor: data.avatar_color,
        avatarUrl:   data.avatar_url ?? currentUser.avatarUrl,
      };
      await logActivity(currentUser.id, "profile_updated", `Updated profile: ${changes.join(", ")}`);
      onUserUpdate(updatedUser);
      setPhotoFile(null);
      setProfileMsg({ type: "ok", text: `✅ Profile updated! (${changes.join(", ")})` });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err) {
      setProfileMsg({ type: "err", text: "Failed: " + err.message });
    }
    setSaving(false);
  };

  // ── PIN change ─────────────────────────────────────────────────────────
  const openPinModal = () => {
    setPinStep(1); setPinA(""); setPinB(""); setPinErr(""); setPinOk(false);
    setPinModal(true);
  };

  const handlePinKey = (val) => {
    setPinErr("");
    const current = pinStep === 1 ? pinA : pinB;
    const setter  = pinStep === 1 ? setPinA : setPinB;

    if (val === "⌫") { setter(p => p.slice(0, -1)); return; }
    if (val === "C")  { setter(""); return; }
    if (current.length >= 4) return;

    const next = current + val;
    setter(next);

    if (next.length === 4) {
      if (pinStep === 1) {
        setTimeout(() => setPinStep(2), 80);
      } else {
        setTimeout(async () => {
          if (pinA !== next) {
            setPinErr("PINs don't match. Try again.");
            setPinA(""); setPinB(""); setPinStep(1);
            return;
          }
          try {
            const { updateAccountPin, logActivity } = await import("../lib/supabase.js");
            await updateAccountPin(currentUser.id, pinA);
            await logActivity(currentUser.id, "pin_changed", "Changed own PIN");
            setPinOk(true);
            setTimeout(() => { setPinModal(false); setPinOk(false); }, 1800);
          } catch (err) {
            setPinErr("Failed: " + err.message);
            setPinA(""); setPinB(""); setPinStep(1);
          }
        }, 80);
      }
    }
  };

  const currentPin = pinStep === 1 ? pinA : pinB;
  const previewUser = { ...currentUser, name, avatarColor, avatarUrl: photoPreview };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="profile-page">
      <InjectProfileStyles />

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">My Profile</h1>
          <p className="page-header__sub">Manage your name, photo, and PIN</p>
        </div>
      </div>

      {/* ── Mobile hero card (hidden on desktop) ── */}
      <div className="profile-hero">
        <div style={{ position: "relative", flexShrink: 0 }}>
          <AvatarDisplay user={previewUser} size={64} />
          <button
            onClick={() => photoRef.current?.click()}
            title="Change photo"
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: 22, height: 22, borderRadius: "50%",
              background: avatarColor, border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 11,
            }}
          >📷</button>
        </div>
        <div className="profile-hero__info">
          <div className="profile-hero__name">{name || currentUser?.name}</div>
          <div className="profile-hero__role"><RolePill rm={rm} /></div>
          <div className="profile-hero__edit">Tap below to edit your profile</div>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="profile-grid">

        {/* ════════ LEFT COLUMN ════════ */}
        <div className="profile-left">

          {/* ── Avatar card ── */}
          <div className="card card--padded">
            <h3 style={S.cardTitle}>Profile Photo &amp; Color</h3>

            <div className="profile-avatar-row">
              {/* Avatar with camera overlay */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <AvatarDisplay user={previewUser} size={80} />
                <button
                  onClick={() => photoRef.current?.click()}
                  title="Change photo"
                  style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: "50%",
                    background: avatarColor, border: "2px solid #fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 12,
                  }}
                >📷</button>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: 5,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {name || currentUser?.name}
                </div>
                <RolePill rm={rm} />
                {photoFile && (
                  <div style={{ fontSize: 11, color: "#059669", marginTop: 7, fontWeight: 600 }}>
                    📷 New photo selected
                    <button onClick={removePhoto} style={{
                      marginLeft: 8, background: "none", border: "none",
                      color: "#dc2626", cursor: "pointer", fontSize: 11, fontWeight: 700,
                    }}>✕ Remove</button>
                  </div>
                )}
              </div>
            </div>

            {/* Color swatches */}
            {!photoFile && (
              <div>
                <div style={{ fontSize: 11, color: "#44290d", marginBottom: 8,
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Avatar Color
                </div>
                <div className="profile-swatches">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => setAvatarColor(c)}
                      title={c}
                      style={{
                        width: 28, height: 28, borderRadius: "50%", background: c,
                        border: "none", cursor: "pointer",
                        outline: avatarColor === c ? `3px solid ${c}` : "none",
                        outlineOffset: 3,
                        transform: avatarColor === c ? "scale(1.2)" : "scale(1)",
                        transition: "all 0.12s",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }} onChange={handlePhoto} />
          </div>

          {/* ── Display name card ── */}
          <div className="card card--padded">
            <h3 style={S.cardTitle}>Display Name</h3>
            <Field label="Full Name" required>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your display name"
                maxLength={50}
              />
            </Field>
            <div style={{ fontSize: 11, color: "#c8b6a6", marginTop: 6 }}>
              This name is shown in the sidebar, login screen, and activity logs.
            </div>
          </div>

          {/* ── Status message ── */}
          {profileMsg && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, fontWeight: 600, fontSize: 13,
              background: profileMsg.type === "ok" ? "#ecfdf5" : "#fef2f2",
              border: `1px solid ${profileMsg.type === "ok" ? "#a7f3d0" : "#fecaca"}`,
              color: profileMsg.type === "ok" ? "#065f46" : "#dc2626",
            }}>
              {profileMsg.text}
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="profile-actions">
            <Btn onClick={saveProfile} disabled={saving}>
              {saving ? "Saving…" : "💾 Save Profile"}
            </Btn>
            <Btn variant="secondary" onClick={openPinModal}>
              🔑 Change PIN
            </Btn>
          </div>
        </div>

        {/* ════════ RIGHT COLUMN ════════ */}
        <div className="profile-right">

          {/* ── Account details card ── */}
          <div className="card card--padded">
            <h3 style={S.cardTitle}>Account Details</h3>

            {[
              { label: "Account ID", value: currentUser?.id?.slice(0, 8) + "…" },
              { label: "Role", value: <RolePill rm={rm} /> },
              { label: "PIN", value: <span style={{ letterSpacing: 4, fontSize: 14 }}>● ● ● ●</span> },
              { label: "Session", value: "Active" },
            ].map(({ label, value }) => (
              <div key={label} className="profile-info-row">
                <span style={{ fontSize: 12, color: "#885620a4", fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13, color: "#44290d", fontWeight: 600 }}>{value}</span>
              </div>
            ))}

            <button
              onClick={openPinModal}
              style={{
                marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 9,
                border: "1.5px #44290d2a", background: "#44290d",
                color: "#faf5ef", fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#44290d";
                e.currentTarget.style.border = "2px solid";
                e.currentTarget.style.color = avatarColor;
                e.currentTarget.style.background = "transparent";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#44290d2a";
                e.currentTarget.style.color = "#faf5ef";
                e.currentTarget.style.background = "#44290d";
              }}
            >
              🔑 Change my PIN
            </button>
          </div>

          {/* ── Recent activity card ── */}
          <div className="card card--padded">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ ...S.cardTitle, marginBottom: 0 }}>My Recent Activity</h3>
              <button
                onClick={loadMyLogs}
                title="Refresh"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#44290d", lineHeight: 1 }}
              >↻</button>
            </div>

            {logsLoading ? (
              <div style={S.logEmpty}>Loading…</div>
            ) : myLogs.length === 0 ? (
              <div style={S.logEmpty}>No activity yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {myLogs.slice(0, 12).map(log => {
                  const meta = ACTION_META[log.action] ?? ACTION_META.default;
                  return (
                    <div key={log.id} className="profile-log-item">
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, background: meta.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, flexShrink: 0,
                      }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "capitalize" }}>
                          {log.action.replace(/_/g, " ")}
                        </div>
                        {log.detail && (
                          <div style={{ fontSize: 11, color: "#44290d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.detail}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "#885620f3", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {timeAgo(log.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PIN Change Modal ── */}
      <Modal open={pinModal} onClose={() => setPinModal(false)} title="🔑 Change PIN" maxWidth={360}>
        {pinOk ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#059669", fontSize: 17 }}>PIN updated!</div>
          </div>
        ) : (
          <>
            {/* User recap */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", background: "#f8fafc",
              borderRadius: 10, marginBottom: 20,
            }}>
              <AvatarDisplay user={{ ...currentUser, avatarColor }} size={40} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{currentUser?.name}</div>
                <div style={{ fontSize: 11, color: "#44290d" }}>
                  {pinStep === 1 ? "Enter a new 4-digit PIN" : "Confirm your new PIN"}
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  height: 4, flex: 1, borderRadius: 99,
                  background: pinStep >= s ? (avatarColor || "#e59b46") : "#e2e8f0",
                  transition: "background 0.2s",
                }} />
              ))}
            </div>

            <PinDots filled={currentPin.length} color={avatarColor} />

            {pinErr && (
              <div style={{ textAlign: "center", fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 12 }}>
                {pinErr}
              </div>
            )}

            <Numpad onKey={handlePinKey} color={avatarColor} />

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setPinModal(false)}>Cancel</Btn>
              {pinStep === 2 && (
                <Btn variant="secondary" onClick={() => { setPinA(""); setPinB(""); setPinStep(1); setPinErr(""); }}>
                  ← Re-enter
                </Btn>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/* ─── Shared style objects ───────────────────────────────────────────────── */
const S = {
  cardTitle: {
    fontSize: 13, fontWeight: 700, color: "#44290d",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16,
  },
  logEmpty: {
    textAlign: "center", padding: "20px 0", color: "#44290d", fontSize: 13,
  },
};