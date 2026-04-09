/**
 * BottomNav — Fixed bottom navigation for mobile phones (≤767px)
 * Shows 5 key shortcuts with active indicator and alert badge.
 * CSS controls visibility: display:none on desktop, flex on mobile.
 */
export default function BottomNav({ activeModule, setActiveModule, lowStockCount = 0 }) {
  const effectiveModule =
    activeModule === "saleshistory-eload" ? "saleshistory" : activeModule;

  const items = [
    { id: "dashboard",   icon: "🏠", label: "Home" },
    { id: "pos",         icon: "🧾", label: "POS" },
    { id: "stock",       icon: "📦", label: "Stock" },
    { id: "saleshistory",icon: "📊", label: "Sales" },
    { id: "alerts",      icon: "🔔", label: "Alerts",  badge: lowStockCount },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Bottom navigation">
      {items.map(item => (
        <button
          key={item.id}
          className={`bottom-nav__item${effectiveModule === item.id ? " bottom-nav__item--active" : ""}`}
          onClick={() => setActiveModule(item.id)}
          aria-current={effectiveModule === item.id ? "page" : undefined}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            {item.icon}
            {item.badge > 0 && (
              <span className="bottom-nav__badge">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </span>
          <span className="bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
