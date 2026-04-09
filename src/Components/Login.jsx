import { useState, useEffect, useRef } from "react";

const PIN_LENGTH = 4;

const AVATAR_COLORS = [
  "#dc2626","#b45309","#d97706","#7f1d1d","#92400e",
  "#ea580c","#059669","#0891b2","#7c3aed","#1d4ed8",
];

const ROLES = ["cashier", "staff", "admin", "owner"];

const ROLE_META = {
  owner:   { icon: "👑" },
  admin:   { icon: "🔧" },
  cashier: { icon: "💰" },
  staff:   { icon: "👤" },
};

export default function Login({ onLogin }) {
  const [mode,         setMode]         = useState("login");
  const [pin,          setPin]          = useState("");
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [accounts,     setAccounts]     = useState([]);
  const [fetchErr,     setFetchErr]     = useState(false);
  const [shake,        setShake]        = useState(false);

  // Create-account state
  const [newName,      setNewName]      = useState("");
  const [newRole,      setNewRole]      = useState("cashier");
  const [newColor,     setNewColor]     = useState(AVATAR_COLORS[0]);
  const [newPhoto,     setNewPhoto]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPin,       setNewPin]       = useState("");
  const [newPin2,      setNewPin2]      = useState("");
  const [pinStep,      setPinStep]      = useState(0); // 0=form, 1=set, 2=confirm
  const [createErr,    setCreateErr]    = useState("");
  const [createOk,     setCreateOk]     = useState(false);

  const photoInputRef = useRef(null);

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = () => {
    import("../lib/supabase.js")
      .then(({ fetchAccounts }) => fetchAccounts().then(setAccounts).catch(() => setFetchErr(true)))
      .catch(() => setFetchErr(true));
  };

  // ── Photo picker ─────────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setCreateErr("Photo must be under 5 MB."); return; }
    setNewPhoto(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setNewPhoto(null); setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  // ── Login PIN ─────────────────────────────────────────────────────────────
  const handleKey = (val) => {
    if (loading) return;
    setError("");
    if (val === "⌫") { setPin(p => p.slice(0, -1)); return; }
    if (val === "C")  { setPin(""); return; }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + val;
    setPin(next);
    if (next.length === PIN_LENGTH) setTimeout(() => attemptLogin(next), 80);
  };

  const attemptLogin = async (enteredPin) => {
    setLoading(true);
    try {
      const { loginWithPin, logActivity } = await import("../lib/supabase.js");
      const user = await loginWithPin(enteredPin);
      if (user) { await logActivity(user.id, "login", "Logged in successfully"); onLogin(user); }
      else triggerError("Incorrect PIN. Try again.");
    } catch (err) { triggerError("Login failed: " + err.message); }
    setLoading(false);
  };

  const triggerError = (msg) => {
    setError(msg); setPin(""); setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // ── Create account PIN ────────────────────────────────────────────────────
  const handleCreateKey = (val) => {
    setCreateErr("");
    const isFirst = pinStep === 1;
    const current = isFirst ? newPin : newPin2;
    const setter  = isFirst ? setNewPin : setNewPin2;
    if (val === "⌫") { setter(p => p.slice(0, -1)); return; }
    if (val === "C")  { setter(""); return; }
    if (current.length >= PIN_LENGTH) return;
    const next = current + val;
    setter(next);
    if (next.length === PIN_LENGTH) {
      if (isFirst) setTimeout(() => setPinStep(2), 80);
      else         setTimeout(() => finalizeCreate(next), 80);
    }
  };

  const finalizeCreate = async (confirmPin) => {
    if (newPin !== confirmPin) {
      setCreateErr("PINs don't match. Try again.");
      setNewPin(""); setNewPin2(""); setPinStep(1); return;
    }
    setLoading(true);
    try {
      const { createAccount, logActivity } = await import("../lib/supabase.js");
      const user = await createAccount({
        name: newName, role: newRole, avatarColor: newColor,
        avatarFile: newPhoto, pin: newPin,
      });
      await logActivity(user.id, "account_created", `Account created: ${newName} (${newRole})`);
      setCreateOk(true);
      loadAccounts();
      setTimeout(() => { setMode("login"); setCreateOk(false); resetCreate(); }, 2200);
    } catch (err) {
      setCreateErr("Failed: " + err.message);
      setNewPin(""); setNewPin2(""); setPinStep(1);
    }
    setLoading(false);
  };

  const resetCreate = () => {
    setNewName(""); setNewRole("cashier"); setNewColor(AVATAR_COLORS[0]);
    setNewPhoto(null); setPhotoPreview(null);
    setNewPin(""); setNewPin2(""); setPinStep(0); setCreateErr(""); setCreateOk(false);
  };

  const startCreate = () => { setMode("create"); resetCreate(); setError(""); };
  const backToLogin = () => { setMode("login"); resetCreate(); setPin(""); setError(""); };

  const currentCreatePin = pinStep === 1 ? newPin : newPin2;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #1c0505 0%, #7f1d1d 45%, #92400e 100%)",
      fontFamily: "'DM Sans', sans-serif", padding: "20px 0",
    }}>
      {/* Grid bg */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        background: "#fffbf0", borderRadius: 20, padding: "32px 28px 28px",
        width: "100%", maxWidth: 390,
        boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
        animation: shake ? "shake 0.4s ease" : "none",
        maxHeight: "calc(100vh - 40px)", overflowY: "auto",
      }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <img src="/paw.png" alt="ChonaSync" style={{ width: 50, height: 50, marginBottom: 6 }} />
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>ChonaSync</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tindahan System</div>
        </div>

        {/* ════ LOGIN ════ */}
        {mode === "login" && (
          <>
            {accounts.length > 0 && !fetchErr && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  Who's logging in?
                </div>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
                  {accounts.map(acc => (
                    <div key={acc.id} style={{ textAlign: "center" }}>
                      <div style={{ margin: "0 auto 4px", width: 46, height: 46 }}>
                        {acc.avatarUrl ? (
                          <img src={acc.avatarUrl} alt={acc.name} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "2.5px solid #e2e8f0", display: "block" }} />
                        ) : (
                          <div style={{ width: 46, height: 46, borderRadius: "50%", background: acc.avatarColor || "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", border: "2.5px solid #e2e8f0" }}>
                            {acc.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {acc.name.split(" ")[0]}
                      </div>
                      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1, textTransform: "capitalize" }}>{acc.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginBottom: 12, fontWeight: 500 }}>
              Enter your {PIN_LENGTH}-digit PIN
            </div>

            <PinDots count={PIN_LENGTH} filled={pin.length} color="#4f46e5" />
            <div style={{ minHeight: 18, textAlign: "center", fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 12 }}>{error}</div>
            <Numpad onKey={handleKey} loading={loading} currentLen={pin.length} pinLength={PIN_LENGTH} />

            <div style={{ textAlign: "center", marginTop: 14, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
              <button onClick={startCreate} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#4f46e5",
                fontWeight: 700, fontFamily: "'DM Sans', sans-serif", padding: "6px 14px", borderRadius: 8,
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#eef2ff"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                ＋ Create new account
              </button>
            </div>
          </>
        )}

        {/* ════ CREATE ACCOUNT ════ */}
        {mode === "create" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <button onClick={backToLogin} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>← Back</button>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Create Account</div>
            </div>

            {createOk ? (
              /* ── Success ── */
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <div style={{ marginBottom: 14 }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "4px solid #a7f3d0", boxShadow: "0 0 0 4px #d1fae5" }} />
                    : <div style={{ fontSize: 52 }}>✅</div>
                  }
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#059669" }}>Account created!</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{newName} · {newRole}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Redirecting to login…</div>
              </div>

            ) : pinStep === 0 ? (
              /* ── Step 0: Profile form ── */
              <>
                {/* ── Photo upload zone ── */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  {/* Clickable avatar */}
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    style={{ position: "relative", display: "inline-block", cursor: "pointer" }}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="preview" style={{
                        width: 80, height: 80, borderRadius: "50%", objectFit: "cover",
                        border: `3px solid ${newColor}`, boxShadow: `0 0 0 4px ${newColor}22`, display: "block",
                      }} />
                    ) : (
                      <div style={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: newColor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 32, fontWeight: 800, color: "#fff",
                        border: `3px solid ${newColor}`, boxShadow: `0 0 0 4px ${newColor}22`,
                      }}>
                        {newName ? newName.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                    {/* Camera badge */}
                    <div style={{
                      position: "absolute", bottom: 1, right: 1,
                      width: 26, height: 26, borderRadius: "50%",
                      background: "#1e293b", border: "2.5px solid #fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                    }}>📷</div>
                  </div>

                  {photoPreview ? (
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>✓ Photo selected</span>
                      <button onClick={removePhoto} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#dc2626", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                      Tap avatar to upload a photo <span style={{ color: "#e2e8f0" }}>·</span> <span style={{ color: "#cbd5e1" }}>optional</span>
                    </div>
                  )}

                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handlePhotoChange} />
                </div>

                {/* Color swatches — hide when photo chosen */}
                {!photoPreview && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Avatar color</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 7, flexWrap: "wrap" }}>
                      {AVATAR_COLORS.map(c => (
                        <button key={c} onClick={() => setNewColor(c)} style={{
                          width: 24, height: 24, borderRadius: "50%", background: c, border: "none",
                          cursor: "pointer", outline: newColor === c ? `3px solid ${c}` : "none", outlineOffset: 2,
                          transform: newColor === c ? "scale(1.2)" : "scale(1)", transition: "all 0.1s",
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>Full Name *</label>
                  <input
                    autoFocus placeholder="e.g. Maria Santos" value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { setCreateErr(""); setPinStep(1); } }}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.currentTarget.style.borderColor = newColor || "#f59e0b"}
                    onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                  />
                </div>

                {/* Role */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Role</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {ROLES.map(r => {
                      const active = newRole === r;
                      return (
                        <button key={r} onClick={() => setNewRole(r)} style={{
                          padding: "9px 0", borderRadius: 9,
                          border: `1.5px solid ${active ? newColor : "#e2e8f0"}`,
                          background: active ? newColor + "18" : "#f8fafc",
                          color: active ? newColor : "#475569",
                          fontWeight: active ? 700 : 500, fontSize: 13,
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize", transition: "all 0.15s",
                        }}>
                          {ROLE_META[r]?.icon} {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {createErr && <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 10, textAlign: "center" }}>{createErr}</div>}

                <button
                  onClick={() => { if (!newName.trim()) { setCreateErr("Please enter a name."); return; } setCreateErr(""); setPinStep(1); }}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: newColor, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Continue → Set PIN
                </button>
              </>

            ) : (
              /* ── Step 1 & 2: PIN ── */
              <>
                {/* Profile recap */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, padding: "10px 14px", background: "#fff9e6", borderRadius: 12, border: "1px solid #fcd34d" }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt={newName} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2px solid ${newColor}`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: newColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                      {newName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{newName}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>
                      {ROLE_META[newRole]?.icon} {newRole}
                      {photoPreview && <span style={{ marginLeft: 6, color: "#059669" }}>· 📷</span>}
                    </div>
                  </div>
                  <button onClick={() => setPinStep(0)} style={{ background: "none", border: "none", fontSize: 11, color: newColor, cursor: "pointer", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                </div>

                <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 12, fontWeight: 500 }}>
                  {pinStep === 1 ? "Set a 4-digit PIN" : "Confirm your PIN"}
                </div>

                <PinDots count={PIN_LENGTH} filled={currentCreatePin.length} color={newColor} />
                {createErr && <div style={{ textAlign: "center", fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 10 }}>{createErr}</div>}
                <Numpad onKey={handleCreateKey} loading={loading} currentLen={currentCreatePin.length} pinLength={PIN_LENGTH} />

                {pinStep === 2 && (
                  <button onClick={() => { setPinStep(1); setNewPin(""); setNewPin2(""); setCreateErr(""); }}
                    style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", fontSize: 11, color: "#94a3b8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    ← Re-enter first PIN
                  </button>
                )}
              </>
            )}
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: "#94a3b8" }}>
          {mode === "login" ? "Contact your admin to reset your PIN" : "Admins & owners can manage accounts later"}
        </div>
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#fca5a5;border-radius:99px}
      `}</style>
    </div>
  );
}

function PinDots({ count, filled, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: "50%",
          background: i < filled ? color : "transparent",
          border: `2.5px solid ${i < filled ? color : "#cbd5e1"}`,
          transition: "all 0.15s", transform: i < filled ? "scale(1.15)" : "scale(1)",
        }} />
      ))}
    </div>
  );
}

function Numpad({ onKey, loading, currentLen, pinLength }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
      {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map(key => {
        const isClear = key === "C", isBack = key === "⌫";
        return (
          <button key={key} onClick={() => onKey(key)} disabled={loading} style={{
            padding: "14px 0", borderRadius: 11, border: "1.5px solid #e2e8f0",
            background: isClear ? "#fef2f2" : isBack ? "#fff7ed" : "#f8fafc",
            color: isClear ? "#dc2626" : isBack ? "#c2410c" : "#0f172a",
            fontSize: 17, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.1s", fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1,
          }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.93)"; e.currentTarget.style.background = isClear || isBack ? "#f1f5f9" : "#eef2ff"; }}
            onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = isClear ? "#fef2f2" : isBack ? "#fff7ed" : "#f8fafc"; }}
          >
            {loading && currentLen === pinLength ? "…" : key}
          </button>
        );
      })}
    </div>
  );
}