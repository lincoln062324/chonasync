import Icon from "./Icon";
import { NAV_ITEMS } from "../data/constants";

export default function Sidebar({ activeModule, setActiveModule, lowStockCount }) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__brand-name">📦 StoreIQ</div>
        <div className="sidebar__brand-sub">Inventory System</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`sidebar__nav-item${activeModule === item.id ? " sidebar__nav-item--active" : ""}`}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
            {item.id === "alerts" && lowStockCount > 0 && (
              <span className="sidebar__nav-badge">{lowStockCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__footer-store">Quezon City Store</div>
        <div className="sidebar__footer-version">v1.0.0</div>
      </div>
    </aside>
  );
}
