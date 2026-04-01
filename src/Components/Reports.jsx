import { useState } from "react";
import { Badge, StatCard } from "../Components/Primitives";

const TABS = [
  { id: "valuation", label: "Inventory Valuation" },
  { id: "sales",     label: "Sales Report" },
  { id: "movement",  label: "Stock Movement" },
  { id: "analysis",  label: "Fast/Slow Moving" },
];

export default function Reports({ products, transactions, purchaseOrders }) {
  const [tab, setTab] = useState("valuation");

  // ── Computed values ────────────────────────────────────────────────────────
  const inventoryValue  = products.reduce((s, p) => s + p.stock * p.cost,  0);
  const retailValue     = products.reduce((s, p) => s + p.stock * p.price, 0);
  const potentialProfit = retailValue - inventoryValue;

  const salesByProduct = products
    .map(p => {
      const soldQty = transactions.reduce(
        (s, t) => s + (t.items.find(i => i.productId === p.id)?.qty || 0),
        0
      );
      return { ...p, soldQty, revenue: soldQty * p.price };
    })
    .sort((a, b) => b.soldQty - a.soldQty);

  const fastMoving = salesByProduct.filter(p => p.soldQty > 0).slice(0, 5);
  const slowMoving = salesByProduct.filter(p => p.soldQty === 0);

  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const avgTxn       = transactions.length ? (totalRevenue / transactions.length).toFixed(0) : 0;

  // ── Movement rows (sales + received POs) ──────────────────────────────────
  const movementRows = [
    ...transactions.flatMap(t =>
      t.items.map(it => ({ date: t.date, type: "Sale", ref: t.id.toUpperCase(), product: it.name, qty: it.qty, dir: "out" }))
    ),
    ...purchaseOrders
      .filter(p => p.status === "received")
      .flatMap(po =>
        po.items.map(it => {
          const prod = products.find(p => p.id === it.productId);
          return { date: po.receivedDate || po.date, type: "Purchase", ref: po.id.toUpperCase(), product: prod?.name || it.productId, qty: it.qty, dir: "in" };
        })
      ),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Reports &amp; Analytics</h1>
          <p className="page-header__sub">Insights and business intelligence</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="report-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`report-tab${tab === t.id ? " report-tab--active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Inventory Valuation ── */}
      {tab === "valuation" && (
        <>
          <div className="stat-grid">
            <StatCard label="Cost Value"       value={`₱${inventoryValue.toLocaleString()}`}  icon="box"   color="#4f46e5" bg="#eef2ff" />
            <StatCard label="Retail Value"     value={`₱${retailValue.toLocaleString()}`}     icon="chart" color="#059669" bg="#ecfdf5" />
            <StatCard label="Potential Profit" value={`₱${potentialProfit.toLocaleString()}`} icon="star"  color="#d97706" bg="#fffbeb" />
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>{["Product","Category","Stock","Cost/Unit","Price/Unit","Stock Value","Retail Value","Margin"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const margin = ((p.price - p.cost) / p.price * 100).toFixed(1);
                  return (
                    <tr key={p.id}>
                      <td className="td-name">{p.name}</td>
                      <td className="td-muted">{p.category}</td>
                      <td>{p.stock}</td>
                      <td>₱{p.cost}</td>
                      <td>₱{p.price}</td>
                      <td className="td-bold">₱{(p.stock * p.cost).toLocaleString()}</td>
                      <td className="td-price">₱{(p.stock * p.price).toLocaleString()}</td>
                      <td>
                        <Badge color={+margin >= 30 ? "green" : +margin >= 15 ? "yellow" : "red"}>
                          {margin}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Sales Report ── */}
      {tab === "sales" && (
        <>
          <div className="stat-grid">
            <StatCard label="Total Revenue"    value={`₱${totalRevenue.toLocaleString()}`} icon="pos"   color="#4f46e5" bg="#eef2ff" />
            <StatCard label="Transactions"     value={transactions.length}                  icon="chart" color="#059669" bg="#ecfdf5" />
            <StatCard label="Avg. Transaction" value={`₱${avgTxn}`}                        icon="star"  color="#d97706" bg="#fffbeb" />
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>{["Transaction","Date","Items","Subtotal","Tax","Discount","Total","Method"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td className="td-id">{t.id.toUpperCase()}</td>
                    <td>{t.date}</td>
                    <td>{t.items.length} items</td>
                    <td>₱{t.subtotal.toFixed(2)}</td>
                    <td>₱{t.tax.toFixed(2)}</td>
                    <td>{t.discount > 0 ? `₱${t.discount}` : "—"}</td>
                    <td className="td-price">₱{t.total.toFixed(2)}</td>
                    <td><Badge color="blue">Cash</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Stock Movement ── */}
      {tab === "movement" && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{["Date","Type","Reference","Product","Qty","Direction"].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {movementRows.map((row, i) => (
                <tr key={i}>
                  <td className="td-small">{row.date}</td>
                  <td><Badge color={row.type === "Sale" ? "blue" : "green"}>{row.type}</Badge></td>
                  <td className="td-id">{row.ref}</td>
                  <td className="td-name">{row.product}</td>
                  <td>{row.qty}</td>
                  <td>
                    <Badge color={row.dir === "in" ? "green" : "red"}>
                      {row.dir === "in" ? "▲ IN" : "▼ OUT"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Fast / Slow Moving ── */}
      {tab === "analysis" && (
        <div className="analysis-grid">
          <div className="card card--padded">
            <h3 className="card__title" style={{ color: "#059669" }}>🔥 Fast-Moving Items</h3>
            {fastMoving.map((p, i) => (
              <div key={p.id} className="analysis-row">
                <div className="flex items-center gap-10">
                  <div className="rank-badge">{i + 1}</div>
                  <div>
                    <div className="td-name">{p.name}</div>
                    <div className="td-sub">{p.category}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="td-price">{p.soldQty} sold</div>
                  <div className="td-sub">₱{p.revenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card card--padded">
            <h3 className="card__title" style={{ color: "#dc2626" }}>🧊 Slow-Moving / Dead Stock</h3>
            {slowMoving.length === 0 ? (
              <p className="alert-empty">All products have sales!</p>
            ) : (
              slowMoving.map(p => (
                <div key={p.id} className="analysis-row">
                  <div>
                    <div className="td-name">{p.name}</div>
                    <div className="td-sub">{p.category} · {p.stock} in stock</div>
                  </div>
                  <Badge color="red">No Sales</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
