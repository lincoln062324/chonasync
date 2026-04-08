import Icon from "../Components/Icon";
import { Badge } from "../Components/Primitives";
import { isOverdue } from "./BottleDeposit";

// ── Due-date label helper (mirrors BottleDeposit logic) ───────────────────────
const daysSince = (dateStr) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);

const daysUntilDue = (dueDateStr) =>
  Math.ceil((new Date(dueDateStr).getTime() - Date.now()) / 86_400_000);

const overdueLabel = (r) => {
  if (r.due_date) {
    const d = Math.abs(daysUntilDue(r.due_date));
    return `${d} day${d !== 1 ? "s" : ""} overdue`;
  }
  const d = daysSince(r.date_borrowed);
  return `${d} day${d !== 1 ? "s" : ""} since borrowed`;
};

const fmt = (n) => `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StockAlerts({ products, bottleDeposits = [], setActiveModule }) {
  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock   = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel);
  const healthy    = products.filter(p => p.stock > p.reorderLevel);

  // Overdue bottle deposits
  const overdueDeposits = bottleDeposits.filter(isOverdue);

  const totalAlerts = outOfStock.length + lowStock.length + overdueDeposits.length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Stock Alerts &amp; Notifications</h1>
          <p className="page-header__sub">{totalAlerts} item{totalAlerts !== 1 ? "s" : ""} need attention</p>
        </div>
      </div>

      {/* ── Summary cards ── */}
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
        <div
          className="alert-stat-card"
          style={{
            borderColor: overdueDeposits.length > 0 ? "#fca5a5" : "#98fcfc",
            background: overdueDeposits.length > 0 ? "#fef2f2" : "#98fcfc7a",
            cursor: overdueDeposits.length > 0 ? "pointer" : "default",
          }}
          onClick={() => overdueDeposits.length > 0 && setActiveModule?.("bottle-deposit")}
          title={overdueDeposits.length > 0 ? "Go to Bottle Deposits" : undefined}
        >
          <div className="alert-stat-card__num" style={{ color: overdueDeposits.length > 0 ? "#dc2626" : "#059669" }}>
            {overdueDeposits.length}
          </div>
          <div className="alert-stat-card__label">🍾 Overdue Bottles</div>
          <div className="alert-stat-card__sub">
            {overdueDeposits.length > 0 ? "Click to manage" : "All returned on time"}
          </div>
        </div>
      </div>

      {/* ── Overdue Bottle Deposits ── */}
      {overdueDeposits.length > 0 && (
        <div>
          <h3 className="alert-section-title alert-section-title--red">
            <span style={{ marginRight: 4 }}>🚨</span> Overdue Bottle Deposits
          </h3>
          <div className="alert-panel alert-panel--red">
            {overdueDeposits.map(d => {
              const outstanding = d.qty - d.returned_qty;
              const heldAmt     = outstanding * +d.deposit_per_bottle;
              return (
                <div key={d.id} className="alert-panel-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className="alert-panel-row__name">
                        🍾 {d.customer_name}
                        {d.contact && (
                          <span style={{ fontWeight: 400, fontSize: 12, color: "#b91c1c", marginLeft: 8 }}>
                            · {d.contact}
                          </span>
                        )}
                      </div>
                      <div className="alert-panel-row__sku">
                        {d.bottle_type} {d.bottle_size}
                        {" · "}
                        {outstanding} bottle{outstanding !== 1 ? "s" : ""} still out
                        {d.due_date && <> · Due: <strong>{d.due_date}</strong></>}
                      </div>
                    </div>
                    <div className="alert-panel-row__right" style={{ textAlign: "right" }}>
                      <Badge color="red">🚨 {overdueLabel(d)}</Badge>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginTop: 4 }}>
                        {fmt(heldAmt)} held
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Call-to-action */}
            <div style={{
              borderTop: "1px solid #fecaca", marginTop: 8, paddingTop: 10,
              display: "flex", justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setActiveModule?.("bottle-deposit")}
                style={{
                  padding: "7px 18px", borderRadius: 8,
                  border: "1.5px solid #dc2626", background: "#dc2626",
                  color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                Manage Bottle Deposits →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Out of stock list ── */}
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

      {/* ── Low stock list ── */}
      {lowStock.length > 0 && (
        <div>
          <h3 className="alert-section-title alert-section-title--yellow">
            <Icon name="warning" size={14} /> Low Stock Items
          </h3>
          <div className="alert-panel alert-panel--yellow">
            {lowStock.map(p => {
              const pct = Math.min(100, (p.stock / (p.reorderLevel * 2)) * 100);
              return (
                <div key={p.id} className="alert-panel-row"
                  style={{ flexDirection: "column", alignItems: "stretch" }}>
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

      {/* ── All clear ── */}
      {totalAlerts === 0 && (
        <div style={{
          textAlign: "center", padding: "56px 24px",
          background: "var(--color-surface)", borderRadius: 14,
          border: "1.5px dashed var(--color-border)",
          color: "var(--color-text-muted)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: "#059669" }}>
            All clear! No alerts right now.
          </div>
          <div style={{ fontSize: 13 }}>Stock levels are healthy and all bottles are accounted for.</div>
        </div>
      )}
    </div>
  );
}