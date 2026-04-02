import { useState, useEffect } from "react";
import Icon from "../Components/Icon";
import { NAV_ITEMS } from "../data/constants";

const ROLE_COLORS = {
  admin:    { bg: "#eef2ff", color: "#4f46e5" },
  cashier:  { bg: "#f0fdf4", color: "#059669" },
  staff:    { bg: "#fff7ed", color: "#c2410c" },
  owner:    { bg: "#fdf4ff", color: "#9333ea" },
};

// ── Mobile Top Bar (hidden on desktop via CSS) ─────────────────
function MobileTopBar({ onOpen, isOpen, lowStockCount }) {
  return (
    <div className="mobile-topbar">
      <button
        className={`hamburger-btn${isOpen ? " hamburger-btn--open" : ""}`}
        onClick={onOpen}
        aria-label="Toggle navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <div className="mobile-topbar__brand">
        📦 <span>ChonaSync</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {lowStockCount > 0 && (
          <span style={{
            background: "#dc2626", color: "#fff",
            borderRadius: 99, fontSize: 10, fontWeight: 700,
            padding: "2px 7px", minWidth: 20, textAlign: "center",
          }}>
            {lowStockCount}
          </span>
        )}
        <div style={{ width: 36 }} />
      </div>
    </div>
  );
}

export default function Sidebar({ activeModule, setActiveModule, lowStockCount, user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const effectiveModule = activeModule === "saleshistory-eload" ? "saleshistory" : activeModule;
  const roleStyle = ROLE_COLORS[user?.role?.toLowerCase()] ?? { bg: "#f1f5f9", color: "#475569" };

  // Close drawer on resize
  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [activeModule]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleNav = (id) => {
    setActiveModule(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <MobileTopBar
        onOpen={() => setMobileOpen(v => !v)}
        isOpen={mobileOpen}
        lowStockCount={lowStockCount}
      />

      {/* Overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? " sidebar-overlay--visible" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar Drawer */}
      <aside className={`sidebar${mobileOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <img className="logopaw" src="/paw.png" alt="ChonaSync Logo" />
          <div className="sidebar__brand-name"> ChonaSync</div>
          <div className="sidebar__brand-sub">Tindahan System</div>
        </div>

        {user && (
          <div style={{
            margin: "0 10px 8px", padding: "10px 12px",
            background: "#1e293b", borderRadius: 10,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  objectFit: "cover", flexShrink: 0,
                  border: "2px solid rgba(255,255,255,0.15)",
                }}
                onError={e => {
                  e.currentTarget.style.display = "none";
                  const fallback = document.createElement("div");
                  fallback.textContent = user.name.charAt(0).toUpperCase();
                  Object.assign(fallback.style, {
                    width: "34px", height: "34px", borderRadius: "50%",
                    background: user.avatarColor || "#4f46e5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "15px", fontWeight: "800", color: "#fff", flexShrink: "0",
                  });
                  e.currentTarget.parentNode.insertBefore(fallback, e.currentTarget);
                }}
              />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: user.avatarColor || "#4f46e5",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, color: "#fff", flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.1)",
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: "#f1f5f9",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.name}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                background: roleStyle.bg, color: roleStyle.color,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`sidebar__nav-item${effectiveModule === item.id ? " sidebar__nav-item--active" : ""}`}
            >
              {item.emoji ? (
                <span style={{ fontSize: 14, lineHeight: 1 }}>{item.emoji}</span>
              ) : (
                <Icon name={item.icon} size={16} />
              )}
              {item.label}
              {item.id === "alerts" && lowStockCount > 0 && (
                <span className="sidebar__nav-badge">{lowStockCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__footer-store">Quezon City Store</div>
          <div className="sidebar__footer-version">v1.0.0</div>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                marginTop: 10, width: "100%", padding: "7px 0", borderRadius: 8,
                border: "1px solid #334155", background: "transparent",
                color: "#64748b", fontSize: 12, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6, transition: "all 0.15s",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
            >
              🚪 Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}