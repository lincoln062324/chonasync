import Icon from "../Components/Icon";
import { StatCard } from "../Components/Primitives";

const fmt = (n) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard({ products, transactions, purchaseOrders, suppliers, setActiveModule, bottleDeposits = [] }) {
  const totalValue   = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const lowStock     = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length;
  const outOfStock   = products.filter(p => p.stock === 0).length;

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

  // ── Bottle deposit stats ──────────────────────────────────────────────────
  const activeDeposits   = bottleDeposits.filter(d => d.status !== "returned");
  const totalDepositAmt  = activeDeposits.reduce((s, d) => s + ((d.qty - d.returned_qty) * +d.deposit_per_bottle), 0);
  const totalBottlesOut  = activeDeposits.reduce((s, d) => s + (d.qty - d.returned_qty), 0);
  const recentDeposits   = activeDeposits.slice(0, 4);
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
          </div>
        </div>

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("stock")}>
          <div className="stat-card__icon" style={{ background:"#ecfdf5", color:"#059669" }}>
            <Icon name="chart" size={22} />
          </div>
          <div>
            <div className="stat-card__value">{fmt(totalValue)}</div>
            <div className="stat-card__label">Inventory Value</div>
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
          </div>
        </div>

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("suppliers")}>
          <div className="stat-card__icon" style={{ background:"#ecfeff", color:"#0891b2" }}>
            <Icon name="users" size={22} />
          </div>
          <div>
            <div className="stat-card__value">{suppliers.length}</div>
            <div className="stat-card__label">Suppliers</div>
          </div>
        </div>

        <div className="stat-card stat-card--clickable" onClick={() => setActiveModule("bottle-deposit")}>
          <div className="stat-card__icon" style={{ background:"#fffbeb", color:"#d97706" }}>
            <span style={{ fontSize: 22 }}>🍾</span>
          </div>
          <div>
            <div className="stat-card__value">{totalBottlesOut}</div>
            <div className="stat-card__label">Bottles Out</div>
            <div className="stat-card__sub">{fmt(totalDepositAmt)} deposits held</div>
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

      {/* ── Bottle Deposits Overview ── */}
      {activeDeposits.length > 0 && (
        <div className="card card--padded dash-section-card" style={{ marginTop: 16, cursor: "pointer" }}
          onClick={() => setActiveModule("bottle-deposit")}>
          <h3 className="card__title">
            🍾 Active Bottle Deposits
            <span className="dash-see-all">Manage all →</span>
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Bottles Out",    value: totalBottlesOut,               color: "#dc2626", bg: "#fef2f2" },
              { label: "Customers",      value: activeDeposits.length,         color: "#d97706", bg: "#fffbeb" },
              { label: "Deposits Held",  value: fmt(totalDepositAmt),          color: "#059669", bg: "#ecfdf5" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "'Sora',sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {recentDeposits.map((d, i) => (
            <div key={d.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: i < recentDeposits.length - 1 ? "1px solid var(--color-border-soft)" : "none",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{d.customer_name}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>
                  🍾 {d.bottle_type} {d.bottle_size} · {d.qty - d.returned_qty} bottle{d.qty - d.returned_qty !== 1 ? "s" : ""} out
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#d97706" }}>
                  {fmt((d.qty - d.returned_qty) * +d.deposit_per_bottle)}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{d.date_borrowed}</div>
              </div>
            </div>
          ))}
          {activeDeposits.length > 4 && (
            <div style={{ fontSize: 12, color: "var(--color-indigo)", fontWeight: 600, marginTop: 8, textAlign: "center" }}>
              +{activeDeposits.length - 4} more — click to view all
            </div>
          )}
        </div>
      )}
    </div>
  );
}