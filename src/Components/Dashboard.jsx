import Icon from "../components/Icon";
import { StatCard } from "../components/Primitives";

export default function Dashboard({ products, transactions, purchaseOrders, suppliers }) {
  const totalValue   = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const lowStock     = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length;
  const outOfStock   = products.filter(p => p.stock === 0).length;
  const pendingPOs   = purchaseOrders.filter(p => p.status === "pending" || p.status === "transit").length;

  const topProducts = [...products]
    .sort((a, b) => {
      const sold = p => transactions.reduce((s, t) => s + (t.items.find(i => i.productId === p.id)?.qty || 0), 0);
      return sold(b) - sold(a);
    })
    .slice(0, 5);

  const alerts = [
    ...products.filter(p => p.stock === 0).map(p => ({ msg: `${p.name} is OUT OF STOCK`, type: "red" })),
    ...products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).map(p => ({
      msg: `${p.name} — only ${p.stock} left (reorder at ${p.reorderLevel})`,
      type: "yellow",
    })),
  ].slice(0, 6);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__sub">Store overview &amp; key metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <StatCard label="Total Products"     value={products.length}                          icon="box"     color="#4f46e5" bg="#eef2ff" />
        <StatCard label="Inventory Value"    value={`₱${totalValue.toLocaleString()}`}        icon="chart"   color="#059669" bg="#ecfdf5" />
        <StatCard label="Total Revenue"      value={`₱${totalRevenue.toLocaleString()}`}      icon="pos"     color="#d97706" bg="#fffbeb" />
        <StatCard label="Low / Out of Stock" value={`${lowStock} / ${outOfStock}`}            icon="warning" color="#dc2626" bg="#fef2f2" sub="Items needing attention" />
        <StatCard label="Pending Orders"     value={pendingPOs}                               icon="truck"   color="#7c3aed" bg="#f5f3ff" sub="Purchase orders" />
        <StatCard label="Suppliers"          value={suppliers.length}                         icon="users"   color="#0891b2" bg="#ecfeff" />
      </div>

      {/* Bottom panels */}
      <div className="dashboard-grid">
        {/* Alerts */}
        <div className="card card--padded">
          <h3 className="card__title">🔔 Alerts &amp; Notifications</h3>
          {alerts.length === 0 ? (
            <p className="alert-empty">All stock levels are healthy!</p>
          ) : (
            <div className="alert-list">
              {alerts.map((a, i) => (
                <div key={i} className={`alert-item alert-item--${a.type}`}>
                  <Icon name="warning" size={14} />
                  {a.msg}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top sellers */}
        <div className="card card--padded">
          <h3 className="card__title">📦 Top Selling Products</h3>
          {topProducts.map((p, i) => {
            const soldQty = transactions.reduce(
              (s, t) => s + (t.items.find(it => it.productId === p.id)?.qty || 0),
              0
            );
            return (
              <div key={p.id} className="top-product-row">
                <div className="top-product__meta">
                  <span className="top-product__rank">{i + 1}</span>
                  <div>
                    <div className="top-product__name">{p.name}</div>
                    <div className="top-product__cat">{p.category}</div>
                  </div>
                </div>
                <div>
                  <div className="top-product__rev">₱{(soldQty * p.price).toLocaleString()}</div>
                  <div className="top-product__qty">{soldQty} sold</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
