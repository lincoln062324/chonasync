import { useState, useEffect } from "react";
import Icon from "../Components/Icon";
import { NAV_ITEMS } from "../data/constants";

const ROLE_COLORS = {
  admin:    { bg: "#eef2ff", color: "#4f46e5" },
  cashier:  { bg: "#f0fdf4", color: "#059669" },
  staff:    { bg: "#fff7ed", color: "#c2410c" },
  owner:    { bg: "#fdf4ff", color: "#9333ea" },
};

// ── Mobile Top Bar ─────────────────────────────────────────────────────────────
function MobileTopBar({ onOpen, isOpen, lowStockCount, user, onNavigate, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const roleStyle = ROLE_COLORS[user?.role?.toLowerCase()] ?? { bg: "#f1f5f9", color: "#475569" };

  return (
    <>
      <div className="mobile-topbar">
        {/* Hamburger */}
        <button
          className={`hamburger-btn${isOpen ? " hamburger-btn--open" : ""}`}
          onClick={onOpen}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>

        {/* Brand */}
        <div className="mobile-topbar__brand">
          📦 <span>ChonaSync</span>
        </div>

        {/* Right actions */}
        <div className="mobile-topbar__actions">
          <button className="mobile-topbar__icon-btn" onClick={() => onNavigate("alerts")} aria-label="Stock Alerts">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {lowStockCount > 0 && (
              <span className="mobile-topbar__badge">{lowStockCount > 9 ? "9+" : lowStockCount}</span>
            )}
          </button>

          {/* Avatar button → opens dropdown */}
          <button
            className="mobile-topbar__avatar-btn"
            onClick={() => setProfileOpen(v => !v)}
            aria-label="Profile menu"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user?.name} className="mobile-topbar__avatar-img"
                onError={e => { e.currentTarget.style.display = "none"; }} />
            ) : (
              <div className="mobile-topbar__avatar-fallback" style={{ background: user?.avatarColor || "#4f46e5" }}>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Profile dropdown */}
      {profileOpen && (
        <>
          <div className="mobile-profile-overlay" onClick={() => setProfileOpen(false)} />
          <div className="mobile-profile-dropdown">
            <div className="mobile-profile-dropdown__user">
              <div className="mobile-profile-dropdown__avatar" style={{ background: user?.avatarColor || "#4f46e5" }}>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <div className="mobile-profile-dropdown__name">{user?.name || "User"}</div>
                <span className="mobile-profile-dropdown__role" style={{ background: roleStyle.bg, color: roleStyle.color }}>
                  {user?.role || "staff"}
                </span>
              </div>
            </div>

            <div className="mobile-profile-dropdown__divider" />

            {[
              { id: "dashboard",   label: "Dashboard",   emoji: "🏠" },
              { id: "pos",         label: "POS",          emoji: "🧾" },
              { id: "stock",       label: "Stock",        emoji: "📦" },
              { id: "activity",    label: "Accounts",     emoji: "🔐" },
            ].map(item => (
              <button key={item.id} className="mobile-profile-dropdown__item"
                onClick={() => { onNavigate(item.id); setProfileOpen(false); }}>
                <span>{item.emoji}</span>
                {item.label}
              </button>
            ))}

            <div className="mobile-profile-dropdown__divider" />

            <button
              className="mobile-profile-dropdown__item mobile-profile-dropdown__item--danger"
              onClick={() => { setProfileOpen(false); onLogout(); }}>
              <span>🚪</span> Sign Out
            </button>
          </div>
        </>
      )}
    </>
  );
}

// ─── MAIN SIDEBAR ─────────────────────────────────────────────────────────────
export default function Sidebar({ activeModule, setActiveModule, lowStockCount, user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const effectiveModule = activeModule === "saleshistory-eload" ? "saleshistory" : activeModule;
  const roleStyle = ROLE_COLORS[user?.role?.toLowerCase()] ?? { bg: "#f1f5f9", color: "#475569" };

  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [activeModule]);

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
      <MobileTopBar
        onOpen={() => setMobileOpen(v => !v)}
        isOpen={mobileOpen}
        lowStockCount={lowStockCount}
        user={user}
        onNavigate={handleNav}
        onLogout={onLogout}
      />

      <div className={`sidebar-overlay${mobileOpen ? " sidebar-overlay--visible" : ""}`}
        onClick={() => setMobileOpen(false)} />

      <aside className={`sidebar${mobileOpen ? " sidebar--open" : ""}`}>
        {/* Brand */}
        <div className="sidebar__brand">
          <img className="logopaw" src="/paw.png" alt="ChonaSync Logo" />
          <div className="sidebar__brand-name">ChonaSync</div>
          <div className="sidebar__brand-sub">Tindahan System</div>
        </div>

        {/* User card — clickable, navigates to Profile */}
        {user && (
          <button
            onClick={() => handleNav("profile")}
            style={{
              margin: "0 10px 8px", padding: "10px 12px",
              background: activeModule === "profile" ? "#ff94947e" : "#ff94947e",
              borderRadius: 10, border: activeModule === "profile" ? "2px solid #ff9494c9" : "1.5px solid transparent",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", width: "calc(100% - 20px)",
              textAlign: "left", transition: "all 0.15s",
            }}
            title="My Profile"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name}
                style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.15)" }}
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: user.avatarColor || "#4f46e5",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, color: "#faf5ef", flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.1)",
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#faf5ef", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
            {/* Edit icon */}
            <div style={{ fontSize: 16, color: "#475569", flexShrink: 0 }} title="Edit profile">✏️</div>
          </button>
        )}

        {/* Nav items */}
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
                border: "1px solid #faf5efa6", background: "transparent",
                color: "#faf5efa6", fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#faf5ef"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#faf5efa6"; }}
            >
              🚪 Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}