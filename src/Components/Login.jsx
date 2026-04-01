import { useState, useEffect, useRef } from "react";

const PIN_LENGTH = 4;

const AVATAR_COLORS = [
  "#4f46e5","#059669","#dc2626","#d97706","#7c3aed",
  "#0891b2","#c2410c","#065f46","#1d4ed8","#9333ea",
];

const ROLES = ["cashier", "staff", "admin", "owner"];

export default function Login({ onLogin }) {
  const [mode,       setMode]       = useState("login");   // "login" | "create"
  const [pin,        setPin]        = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [accounts,   setAccounts]   = useState([]);
  const [fetchErr,   setFetchErr]   = useState(false);
  const [shake,      setShake]      = useState(false);

  // Create-account form
  const [newName,    setNewName]    = useState("");
  const [newRole,    setNewRole]    = useState("cashier");
  const [newColor,   setNewColor]   = useState(AVATAR_COLORS[0]);
  const [newPin,     setNewPin]     = useState("");
  const [newPin2,    setNewPin2]    = useState("");
  const [pinStep,    setPinStep]    = useState(0); // 0=form, 1=set pin, 2=confirm pin
  const [createErr,  setCreateErr]  = useState("");
  const [createOk,   setCreateOk]   = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    import("../lib/supabase.js").then(({ fetchAccounts }) => {
      fetchAccounts()
        .then(rows => setAccounts(rows))
        .catch(() => setFetchErr(true));
    }).catch(() => setFetchErr(true));
  };

  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Login PIN pad ──────────────────────────────────────────────────────────
  const handleKey = (val) => {
    if (loading) return;
    setError("");
    if (val === "⌫") { setPin(p => p.slice(0, -1)); return; }
    if (val === "C")  { setPin(""); return; }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + val;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => attemptLogin(next), 80);
    }
  };

  const attemptLogin = async (enteredPin) => {
    setLoading(true);
    try {
      const { loginWithPin, logActivity } = await import("../lib/supabase.js");
      const user = await loginWithPin(enteredPin);
      if (user) {
        await logActivity(user.id, "login", "Logged in successfully");
        onLogin(user);
      } else {
        triggerError("Incorrect PIN. Try again.");
      }
    } catch (err) {
      triggerError("Login failed: " + err.message);
    }
    setLoading(false);
  };

  const triggerError = (msg) => {
    setError(msg);
    setPin("");
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // ── Create Account PIN pad ─────────────────────────────────────────────────
  const handleCreateKey = (val) => {
    setCreateErr("");
    const isFirst  = pinStep === 1;
    const current  = isFirst ? newPin : newPin2;
    const setter   = isFirst ? setNewPin : setNewPin2;

    if (val === "⌫") { setter(p => p.slice(0, -1)); return; }
    if (val === "C")  { setter(""); return; }
    if (current.length >= PIN_LENGTH) return;

    const next = current + val;
    setter(next);

    if (next.length === PIN_LENGTH) {
      if (isFirst) {
        setTimeout(() => setPinStep(2), 80);
      } else {
        setTimeout(() => finalizeCreate(next), 80);
      }
    }
  };

  const finalizeCreate = async (confirmPin) => {
    if (newPin !== confirmPin) {
      setCreateErr("PINs don't match. Try again.");
      setNewPin("");
      setNewPin2("");
      setPinStep(1);
      return;
    }
    setLoading(true);
    try {
      const { createAccount, logActivity } = await import("../lib/supabase.js");
      const user = await createAccount({ name: newName, role: newRole, avatarColor: newColor, pin: newPin });
      await logActivity(user.id, "account_created", `Account created: ${newName} (${newRole})`);
      setCreateOk(true);
      loadAccounts();
      setTimeout(() => {
        setMode("login");
        setCreateOk(false);
        resetCreate();
      }, 2000);
    } catch (err) {
      setCreateErr("Failed: " + err.message);
      setNewPin("");
      setNewPin2("");
      setPinStep(1);
    }
    setLoading(false);
  };

  const resetCreate = () => {
    setNewName(""); setNewRole("cashier"); setNewColor(AVATAR_COLORS[0]);
    setNewPin(""); setNewPin2(""); setPinStep(0); setCreateErr(""); setCreateOk(false);
  };

  const startCreate = () => { setMode("create"); resetCreate(); setError(""); };
  const backToLogin = () => { setMode("login"); resetCreate(); setPin(""); setError(""); };

  // ── Step labels ────────────────────────────────────────────────────────────
  const stepLabel = pinStep === 1 ? `Set a ${PIN_LENGTH}-digit PIN`
                  : pinStep === 2 ? "Confirm your PIN"
                  : "";
  const currentCreatePin = pinStep === 1 ? newPin : newPin2;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#818cf8 1px, transparent 1px), linear-gradient(90deg, #818cf8 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        background: "#fff", borderRadius: 20, padding: "36px 32px 32px",
        width: "100%", maxWidth: 390,
        boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        animation: shake ? "shake 0.4s ease" : "none",
        transition: "all 0.2s",
      }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>📦</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 21, fontWeight: 800, color: "#0f172a" }}>
            ChonaSync
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Tindahan System
          </div>
        </div>

        {/* ══ LOGIN MODE ══ */}
        {mode === "login" && (
          <>
            {accounts.length > 0 && !fetchErr && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  Who's logging in?
                </div>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
                  {accounts.map(acc => (
                    <div key={acc.id} style={{ textAlign: "center" }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: acc.avatarColor || "#4f46e5",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 17, fontWeight: 700, color: "#fff",
                        margin: "0 auto 4px", border: "2.5px solid #e2e8f0",
                      }}>
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, maxWidth: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {acc.name.split(" ")[0]}
                      </div>
                      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>{acc.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 14, fontWeight: 500 }}>
              Enter your {PIN_LENGTH}-digit PIN
            </div>

            {/* PIN dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 18 }}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div key={i} style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: i < pin.length ? "#4f46e5" : "transparent",
                  border: `2.5px solid ${i < pin.length ? "#4f46e5" : "#cbd5e1"}`,
                  transition: "all 0.15s",
                  transform: i < pin.length ? "scale(1.15)" : "scale(1)",
                }} />
              ))}
            </div>

            <div style={{ minHeight: 20, textAlign: "center", fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 14 }}>
              {error}
            </div>

            <Numpad onKey={handleKey} loading={loading} pinLength={PIN_LENGTH} currentLen={pin.length} />

            {/* Create account link */}
            <div style={{ textAlign: "center", marginTop: 18, borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
              <button
                onClick={startCreate}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "#4f46e5", fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif", padding: "6px 12px",
                  borderRadius: 8, transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#eef2ff"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                ＋ Create new account
              </button>
            </div>
          </>
        )}

        {/* ══ CREATE ACCOUNT MODE ══ */}
        {mode === "create" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <button onClick={backToLogin} style={{
                background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 10px",
                cursor: "pointer", fontSize: 14, color: "#64748b", fontFamily: "'DM Sans', sans-serif",
              }}>← Back</button>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Create Account</div>
            </div>

            {createOk ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#059669" }}>Account created!</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Redirecting to login…</div>
              </div>
            ) : pinStep === 0 ? (
              /* ── Step 0: Fill in details ── */
              <>
                {/* Avatar preview */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%", background: newColor,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 10,
                    border: "3px solid #e2e8f0",
                  }}>
                    {newName ? newName.charAt(0).toUpperCase() : "?"}
                  </div>
                  {/* Color picker */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
                    {AVATAR_COLORS.map(c => (
                      <button key={c} onClick={() => setNewColor(c)} style={{
                        width: 22, height: 22, borderRadius: "50%", background: c, border: "none",
                        cursor: "pointer", outline: newColor === c ? `3px solid ${c}` : "none",
                        outlineOffset: 2, transition: "all 0.1s",
                      }} />
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>
                    Full Name *
                  </label>
                  <input
                    autoFocus
                    placeholder="e.g. Maria Santos"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                      fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"}
                    onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                  />
                </div>

                {/* Role */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>
                    Role
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {ROLES.map(r => (
                      <button key={r} onClick={() => setNewRole(r)} style={{
                        padding: "9px 0", borderRadius: 9, border: `1.5px solid ${newRole === r ? "#4f46e5" : "#e2e8f0"}`,
                        background: newRole === r ? "#eef2ff" : "#f8fafc",
                        color: newRole === r ? "#4f46e5" : "#475569",
                        fontWeight: newRole === r ? 700 : 500, fontSize: 13,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        textTransform: "capitalize", transition: "all 0.15s",
                      }}>
                        {r === "owner" ? "👑" : r === "admin" ? "🔧" : r === "cashier" ? "💰" : "👤"} {r}
                      </button>
                    ))}
                  </div>
                </div>

                {createErr && (
                  <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 12, textAlign: "center" }}>
                    {createErr}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!newName.trim()) { setCreateErr("Please enter a name."); return; }
                    setCreateErr("");
                    setPinStep(1);
                  }}
                  style={{
                    width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                    background: "#4f46e5", color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Continue → Set PIN
                </button>
              </>
            ) : (
              /* ── Step 1 & 2: Set / Confirm PIN ── */
              <>
                {/* Mini avatar recap */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", background: newColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0,
                  }}>
                    {newName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{newName}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>{newRole}</div>
                  </div>
                  <button onClick={() => setPinStep(0)} style={{
                    marginLeft: "auto", background: "none", border: "none", fontSize: 11,
                    color: "#4f46e5", cursor: "pointer", fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  }}>Edit</button>
                </div>

                <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 14, fontWeight: 500 }}>
                  {stepLabel}
                </div>

                {/* PIN dots */}
                <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 18 }}>
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <div key={i} style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: i < currentCreatePin.length ? newColor : "transparent",
                      border: `2.5px solid ${i < currentCreatePin.length ? newColor : "#cbd5e1"}`,
                      transition: "all 0.15s",
                      transform: i < currentCreatePin.length ? "scale(1.15)" : "scale(1)",
                    }} />
                  ))}
                </div>

                {createErr && (
                  <div style={{ minHeight: 20, textAlign: "center", fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 12 }}>
                    {createErr}
                  </div>
                )}

                <Numpad onKey={handleCreateKey} loading={loading} pinLength={PIN_LENGTH} currentLen={currentCreatePin.length} accentColor={newColor} />

                {pinStep === 2 && (
                  <button onClick={() => { setPinStep(1); setNewPin(""); setNewPin2(""); setCreateErr(""); }}
                    style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", fontSize: 11, color: "#94a3b8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    ← Re-enter first PIN
                  </button>
                )}
              </>
            )}
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#94a3b8" }}>
          {mode === "login" ? "Contact your admin to reset your PIN" : "Admins & owners can manage accounts later"}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  );
}

/* ── Reusable Numpad ── */
function Numpad({ onKey, loading, pinLength, currentLen, accentColor = "#4f46e5" }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
      {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map(key => {
        const isClear  = key === "C";
        const isBack   = key === "⌫";
        const isAction = isClear || isBack;
        return (
          <button
            key={key}
            onClick={() => onKey(key)}
            disabled={loading}
            style={{
              padding: "15px 0", borderRadius: 12,
              border: "1.5px solid #e2e8f0",
              background: isClear ? "#fef2f2" : isBack ? "#fff7ed" : "#f8fafc",
              color: isClear ? "#dc2626" : isBack ? "#c2410c" : "#0f172a",
              fontSize: 18, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.1s",
              fontFamily: "'DM Sans', sans-serif",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseDown={e => {
              e.currentTarget.style.transform = "scale(0.94)";
              e.currentTarget.style.background = isAction ? "#f1f5f9" : "#eef2ff";
            }}
            onMouseUp={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = isClear ? "#fef2f2" : isBack ? "#fff7ed" : "#f8fafc";
            }}
          >
            {loading && currentLen === pinLength ? "…" : key}
          </button>
        );
      })}
    </div>
  );
}