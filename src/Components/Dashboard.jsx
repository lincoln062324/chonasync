import Icon from "../components/Icon";
import { StatCard } from "../components/Primitives";

const fmt = (n) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard({ products, transactions, purchaseOrders, suppliers, setActiveModule }) {
  const totalValue   = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const lowStock     = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length;
  const outOfStock   = products.filter(p => p.stock === 0).length;
  const pendingPOs   = purchaseOrders.filter(p => p.status === "pending" || p.status === "transit").length;

  const productTxns    = transactions.filter(t => t.type !== "eloading");
  const eloadTxns      = transactions.filter(t => t.type === "eloading");
  const productRevenue = productTxns.reduce((s, t) => s + t.total, 0);
  const eloadRevenue   = eloadTxns.reduce((s, t) => s + t.total, 0);
  const eloadProfit    = eloadTxns.reduce((s, t) => s + (t.totalProfit ?? 0), 0);

  const topProducts = [...products]
    .sort((a, b) => {
      const sold = p => productTxns.reduce((s, t) => s + (t.items?.find(i => i.productId === p.id)?.qty || 0), 0);
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

  const recentProductTxns = productTxns.slice(0, 5);
  const recentEloadTxns   = eloadTxns.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__sub">Store overview &amp; key metrics — click any card to navigate</p>
        </div>
      </div>

      {/* ── KPI Cards — all clickable ── */}
      <div className="stat-grid">

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("stock")}>
          <div className="stat-card__icon" style={{ background:"#eef2ff", color:"#4f46e5" }}>
            <Icon name="box" size={22} />
          </div>
          <div>
            <div className="stat-card__value">{products.length}</div>
            <div className="stat-card__label">Total Products</div>
            <div className="stat-card__nav-hint">→ Stock Management</div>
          </div>
        </div>

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("stock")}>
          <div className="stat-card__icon" style={{ background:"#ecfdf5", color:"#059669" }}>
            <Icon name="chart" size={22} />
          </div>
          <div>
            <div className="stat-card__value">{fmt(totalValue)}</div>
            <div className="stat-card__label">Inventory Value</div>
            <div className="stat-card__nav-hint">→ Stock Management</div>
          </div>
        </div>

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("saleshistory")}>
          <div className="stat-card__icon" style={{ background:"#fffbeb", color:"#d97706" }}>
            <Icon name="pos" size={22} />
          </div>
          <div>
            <div className="stat-card__value">{fmt(productRevenue)}</div>
            <div className="stat-card__label">Product Revenue</div>
            <div className="stat-card__sub">{productTxns.length} transactions</div>
            <div className="stat-card__nav-hint">→ Sales History</div>
          </div>
        </div>

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("saleshistory-eload")}>
          <div className="stat-card__icon" style={{ background:"#ecfdf5", color:"#059669" }}>
            <span style={{ fontSize: 22 }}>📱</span>
          </div>
          <div>
            <div className="stat-card__value">{fmt(eloadRevenue)}</div>
            <div className="stat-card__label">E-Load Revenue</div>
            <div className="stat-card__sub">{fmt(eloadProfit)} profit · {eloadTxns.length} txns</div>
            <div className="stat-card__nav-hint">→ Sales History</div>
          </div>
        </div>

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("alerts")}>
          <div className="stat-card__icon" style={{ background:"#fef2f2", color:"#dc2626" }}>
            <Icon name="warning" size={22} />
          </div>
          <div>
            <div className="stat-card__value">{lowStock} / {outOfStock}</div>
            <div className="stat-card__label">Low / Out of Stock</div>
            <div className="stat-card__sub">Items needing attention</div>
            <div className="stat-card__nav-hint">→ Stock Alerts</div>
          </div>
        </div>

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("purchasing")}>
          <div className="stat-card__icon" style={{ background:"#f5f3ff", color:"#7c3aed" }}>
            <Icon name="truck" size={22} />
          </div>
          <div>
            <div className="stat-card__value">{pendingPOs}</div>
            <div className="stat-card__label">Pending Orders</div>
            <div className="stat-card__sub">Purchase orders</div>
            <div className="stat-card__nav-hint">→ Purchasing</div>
          </div>
        </div>

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("suppliers")}>
          <div className="stat-card__icon" style={{ background:"#ecfeff", color:"#0891b2" }}>
            <Icon name="users" size={22} />
          </div>
          <div>
            <div className="stat-card__value">{suppliers.length}</div>
            <div className="stat-card__label">Suppliers</div>
            <div className="stat-card__nav-hint">→ Supplier Management</div>
          </div>
        </div>

      </div>

      {/* ── Recent Sales rows ── */}
      <div className="dashboard-grid" style={{ gridTemplateColumns:"1fr 1fr", marginBottom:20 }}>

        <div className="card card--padded dash-section-card"
          onClick={() => setActiveModule("saleshistory")} style={{ cursor:"pointer" }}>
          <h3 className="card__title">🛒 Recent Product Sales
            <span className="dash-see-all">See all →</span>
          </h3>
          {recentProductTxns.length === 0 ? (
            <p className="alert-empty">No product sales yet.</p>
          ) : recentProductTxns.map(t => (
            <div key={t.id} className="dash-txn-row">
              <div>
                <div className="dash-txn-id">{t.id.toUpperCase()}</div>
                <div className="dash-txn-sub">{t.date} · {t.items?.length ?? 0} items</div>
              </div>
              <div className="dash-txn-total">{fmt(t.total)}</div>
            </div>
          ))}
        </div>

        <div className="card card--padded dash-section-card"
          onClick={() => setActiveModule("saleshistory-eload")} style={{ cursor:"pointer" }}>
          <h3 className="card__title">📱 Recent E-Load Sales
            <span className="dash-see-all">See all →</span>
          </h3>
          {recentEloadTxns.length === 0 ? (
            <p className="alert-empty">No e-load sales yet.</p>
          ) : recentEloadTxns.map(t => (
            <div key={t.id} className="dash-txn-row">
              <div>
                <div className="dash-txn-id">{t.id.toUpperCase()}</div>
                <div className="dash-txn-sub">{t.date} · {t.items?.length ?? 0} loads</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div className="dash-txn-total">{fmt(t.total)}</div>
                <div style={{ fontSize:11, color:"var(--color-green)", fontWeight:600 }}>
                  +{fmt(t.totalProfit ?? 0)} profit
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom panels ── */}
      <div className="dashboard-grid">
        <div className="card card--padded dash-section-card"
          onClick={() => setActiveModule("alerts")} style={{ cursor:"pointer" }}>
          <h3 className="card__title">🔔 Alerts &amp; Notifications
            <span className="dash-see-all">See all →</span>
          </h3>
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

        <div className="card card--padded dash-section-card"
          onClick={() => setActiveModule("saleshistory")} style={{ cursor:"pointer" }}>
          <h3 className="card__title">📦 Top Selling Products
            <span className="dash-see-all">See all →</span>
          </h3>
          {topProducts.map((p, i) => {
            const soldQty = productTxns.reduce(
              (s, t) => s + (t.items?.find(it => it.productId === p.id)?.qty || 0), 0
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
                  <div className="top-product__rev">{fmt(soldQty * p.price)}</div>
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