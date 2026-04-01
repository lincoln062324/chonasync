import Icon from "../Components/Icon";
import { Badge } from "../Components/Primitives";

export default function StockAlerts({ products }) {
  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock   = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel);
  const healthy    = products.filter(p => p.stock > p.reorderLevel);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Stock Alerts &amp; Notifications</h1>
          <p className="page-header__sub">{outOfStock.length + lowStock.length} items need attention</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="alert-stat-grid">
        <div className="alert-stat-card alert-stat-card--red">
          <div className="alert-stat-card__num">{outOfStock.length}</div>
          <div className="alert-stat-card__label">Out of Stock</div>
          <div className="alert-stat-card__sub">Immediate action required</div>
        </div>
        <div className="alert-stat-card alert-stat-card--yellow">
          <div className="alert-stat-card__num">{lowStock.length}</div>
          <div className="alert-stat-card__label">Low Stock</div>
          <div className="alert-stat-card__sub">At or below reorder level</div>
        </div>
        <div className="alert-stat-card alert-stat-card--green">
          <div className="alert-stat-card__num">{healthy.length}</div>
          <div className="alert-stat-card__label">Healthy Stock</div>
          <div className="alert-stat-card__sub">Above reorder level</div>
        </div>
      </div>

      {/* Out of stock list */}
      {outOfStock.length > 0 && (
        <div>
          <h3 className="alert-section-title alert-section-title--red">
            <Icon name="x" size={14} /> Out of Stock Items
          </h3>
          <div className="alert-panel alert-panel--red">
            {outOfStock.map(p => (
              <div key={p.id} className="alert-panel-row">
                <div>
                  <div className="alert-panel-row__name">{p.name}</div>
                  <div className="alert-panel-row__sku">{p.sku} · {p.category}</div>
                </div>
                <div className="alert-panel-row__right">
                  <Badge color="red">OUT OF STOCK</Badge>
                  <span className="alert-panel-row__reorder">Reorder: {p.reorderLevel} units</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low stock list */}
      {lowStock.length > 0 && (
        <div>
          <h3 className="alert-section-title alert-section-title--yellow">
            <Icon name="warning" size={14} /> Low Stock Items
          </h3>
          <div className="alert-panel alert-panel--yellow">
            {lowStock.map(p => {
              const pct = Math.min(100, (p.stock / (p.reorderLevel * 2)) * 100);
              return (
                <div
                  key={p.id}
                  className="alert-panel-row"
                  style={{ flexDirection: "column", alignItems: "stretch" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <div className="alert-panel-row__name">{p.name}</div>
                      <div className="alert-panel-row__sku">{p.sku} · {p.category}</div>
                    </div>
                    <div className="alert-panel-row__right">
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#d97706" }}>{p.stock} left</span>
                      <Badge color="yellow">LOW STOCK</Badge>
                    </div>
                  </div>
                  <div className="stock-progress__bar">
                    <div className="stock-progress__fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="stock-progress__hint">Reorder point: {p.reorderLevel} units</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
