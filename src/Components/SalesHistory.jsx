import { useState, useMemo } from "react";
import { Badge, StatCard } from "../components/Primitives";
import Icon from "../components/Icon";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const fmtN = (n) => Number(n).toLocaleString("en-PH");

const NETWORK_COLORS = {
  Globe: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6" },
  Smart: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e" },
  TNT:   { bg: "#fef3c7", border: "#fde68a", text: "#92400e", dot: "#f59e0b" },
  DITO:  { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", dot: "#8b5cf6" },
  Sun:   { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", dot: "#f97316" },
  TM:    { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", dot: "#10b981" },
  Other: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", dot: "#94a3b8" },
};

const TABS = [
  { id: "product", label: "🛒 Product Sales",  color: "#4f46e5" },
  { id: "eload",   label: "📱 E-Load Sales",   color: "#059669" },
];

// ── Date filter helpers ───────────────────────────────────────────────────────
const DATE_RANGES = ["All Time", "Today", "This Week", "This Month", "Custom"];

function inRange(dateStr, range, customFrom, customTo) {
  if (range === "All Time") return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (range === "Today") {
    return d.toDateString() === now.toDateString();
  }
  if (range === "This Week") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart;
  }
  if (range === "This Month") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  if (range === "Custom" && customFrom && customTo) {
    const from = new Date(customFrom);
    const to   = new Date(customTo);
    to.setHours(23, 59, 59);
    return d >= from && d <= to;
  }
  return true;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SalesHistory({ transactions, initialTab = "product" }) {
  const [activeTab,   setActiveTab]   = useState(initialTab);
  const [dateRange,   setDateRange]   = useState("All Time");
  const [customFrom,  setCustomFrom]  = useState("");
  const [customTo,    setCustomTo]    = useState("");
  const [search,      setSearch]      = useState("");
  const [expandedTx,  setExpandedTx]  = useState(null); // id of expanded row
  const [catFilter,   setCatFilter]   = useState("All");
  const [netFilter,   setNetFilter]   = useState("All");
  const [sortField,   setSortField]   = useState("date");
  const [sortDir,     setSortDir]     = useState("desc");

  // ── Split transactions ────────────────────────────────────────────────────
  const productTxns = useMemo(
    () => transactions.filter(t => t.type !== "eloading"),
    [transactions]
  );
  const eloadTxns = useMemo(
    () => transactions.filter(t => t.type === "eloading"),
    [transactions]
  );

  // ── Category list from product transactions ───────────────────────────────
  const allCategories = useMemo(() => {
    const cats = new Set();
    productTxns.forEach(t => t.items?.forEach(i => { if (i.category) cats.add(i.category); }));
    return ["All", ...Array.from(cats)];
  }, [productTxns]);

  const allNetworks = useMemo(() => {
    const nets = new Set();
    eloadTxns.forEach(t => t.items?.forEach(i => { if (i.network) nets.add(i.network); }));
    return ["All", ...Array.from(nets)];
  }, [eloadTxns]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filteredProduct = useMemo(() => {
    let list = productTxns.filter(t =>
      inRange(t.date, dateRange, customFrom, customTo) &&
      (search.length < 2 || t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.items?.some(i => i.name?.toLowerCase().includes(search.toLowerCase()))) &&
      (catFilter === "All" || t.items?.some(i => i.category === catFilter))
    );
    list = [...list].sort((a, b) => {
      if (sortField === "date")  return sortDir === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
      if (sortField === "total") return sortDir === "desc" ? b.total - a.total : a.total - b.total;
      return 0;
    });
    return list;
  }, [productTxns, dateRange, customFrom, customTo, search, catFilter, sortField, sortDir]);

  const filteredEload = useMemo(() => {
    let list = eloadTxns.filter(t =>
      inRange(t.date, dateRange, customFrom, customTo) &&
      (search.length < 2 || t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.items?.some(i => i.name?.toLowerCase().includes(search.toLowerCase()))) &&
      (netFilter === "All" || t.items?.some(i => i.network === netFilter))
    );
    list = [...list].sort((a, b) => {
      if (sortField === "date")   return sortDir === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
      if (sortField === "total")  return sortDir === "desc" ? b.total - a.total : a.total - b.total;
      if (sortField === "profit") return sortDir === "desc" ? b.totalProfit - a.totalProfit : a.totalProfit - b.totalProfit;
      return 0;
    });
    return list;
  }, [eloadTxns, dateRange, customFrom, customTo, search, netFilter, sortField, sortDir]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const productStats = useMemo(() => ({
    count:   filteredProduct.length,
    revenue: filteredProduct.reduce((s, t) => s + t.total, 0),
    items:   filteredProduct.reduce((s, t) => s + (t.items?.reduce((a, i) => a + i.qty, 0) ?? 0), 0),
    avgTxn:  filteredProduct.length ? filteredProduct.reduce((s, t) => s + t.total, 0) / filteredProduct.length : 0,
  }), [filteredProduct]);

  const eloadStats = useMemo(() => ({
    count:  filteredEload.length,
    total:  filteredEload.reduce((s, t) => s + t.total, 0),
    profit: filteredEload.reduce((s, t) => s + (t.totalProfit ?? 0), 0),
    loads:  filteredEload.reduce((s, t) => s + (t.items?.length ?? 0), 0),
  }), [filteredEload]);

  // ── Sort toggle ───────────────────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };
  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 4, opacity: sortField === field ? 1 : 0.3, fontSize: 10 }}>
      {sortField === field && sortDir === "desc" ? "▼" : "▲"}
    </span>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Sales History</h1>
          <p className="page-header__sub">All recorded POS sales — products & e-loads</p>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="sh-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`sh-tab ${activeTab === t.id ? "sh-tab--active" : ""}`}
            style={activeTab === t.id ? { borderBottomColor: t.color, color: t.color } : {}}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            <span className="sh-tab__count">
              {t.id === "product" ? productTxns.length : eloadTxns.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filters bar ── */}
      <div className="sh-filters">
        {/* Search */}
        <div className="search-wrap" style={{ flex: 1, minWidth: 180 }}>
          <span className="search-wrap__icon"><Icon name="search" size={14} /></span>
          <input
            className="input"
            placeholder="Search by ID or item name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Date range */}
        <select
          className="select"
          style={{ width: 140 }}
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
        >
          {DATE_RANGES.map(r => <option key={r}>{r}</option>)}
        </select>

        {/* Custom date pickers */}
        {dateRange === "Custom" && (
          <>
            <input
              className="input"
              type="date"
              style={{ width: 140 }}
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
            />
            <input
              className="input"
              type="date"
              style={{ width: 140 }}
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
            />
          </>
        )}

        {/* Category filter (product tab) */}
        {activeTab === "product" && allCategories.length > 1 && (
          <select
            className="select"
            style={{ width: 150 }}
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
          >
            {allCategories.map(c => <option key={c}>{c}</option>)}
          </select>
        )}

        {/* Network filter (eload tab) */}
        {activeTab === "eload" && allNetworks.length > 1 && (
          <select
            className="select"
            style={{ width: 130 }}
            value={netFilter}
            onChange={e => setNetFilter(e.target.value)}
          >
            {allNetworks.map(n => <option key={n}>{n}</option>)}
          </select>
        )}
      </div>

      {/* ══════════════════════ PRODUCT SALES TAB ══════════════════════ */}
      {activeTab === "product" && (
        <>
          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatCard label="Transactions"    value={fmtN(productStats.count)}   icon="pos"   color="#4f46e5" bg="#eef2ff" />
            <StatCard label="Total Revenue"   value={fmt(productStats.revenue)}   icon="chart" color="#059669" bg="#ecfdf5" />
            <StatCard label="Items Sold"      value={fmtN(productStats.items)}    icon="box"   color="#d97706" bg="#fffbeb" />
            <StatCard label="Avg Transaction" value={fmt(productStats.avgTxn)}    icon="star"  color="#7c3aed" bg="#f5f3ff" />
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th>TXN ID</th>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("date")}>
                    Date <SortIcon field="date" />
                  </th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Discount</th>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("total")}>
                    Total <SortIcon field="total" />
                  </th>
                  <th>Payment</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredProduct.length === 0 ? (
                  <tr><td colSpan={10} className="table-empty">No product sales found.</td></tr>
                ) : (
                  filteredProduct.map(t => (
                    <>
                      <tr
                        key={t.id}
                        className={`sh-row ${expandedTx === t.id ? "sh-row--expanded" : ""}`}
                        onClick={() => setExpandedTx(expandedTx === t.id ? null : t.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <span className="sh-expand-icon">{expandedTx === t.id ? "▼" : "▶"}</span>
                        </td>
                        <td className="td-id">{t.id.toUpperCase()}</td>
                        <td className="td-small">{t.date}</td>
                        <td>
                          <span className="sh-items-badge">{t.items?.length ?? 0} item{t.items?.length !== 1 ? "s" : ""}</span>
                        </td>
                        <td>{fmt(t.subtotal)}</td>
                        <td className="td-muted">{fmt(t.tax)}</td>
                        <td className="td-muted">{t.discount > 0 ? fmt(t.discount) : "—"}</td>
                        <td className="td-price" style={{ fontWeight: 700 }}>{fmt(t.total)}</td>
                        <td>{fmt(t.payment)}</td>
                        <td style={{ color: "var(--color-green)", fontWeight: 600 }}>{fmt(t.change)}</td>
                      </tr>

                      {/* Expanded items row */}
                      {expandedTx === t.id && (
                        <tr key={t.id + "-items"} className="sh-items-row">
                          <td colSpan={10}>
                            <div className="sh-items-panel">
                              <div className="sh-items-panel__title">Line Items</div>
                              <table className="sh-items-table">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th style={{ textAlign: "right" }}>Unit Price</th>
                                    <th style={{ textAlign: "right" }}>Qty</th>
                                    <th style={{ textAlign: "right" }}>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(t.items ?? []).map((item, i) => (
                                    <tr key={i}>
                                      <td>{item.name}</td>
                                      <td style={{ textAlign: "right" }}>{fmt(item.price)}</td>
                                      <td style={{ textAlign: "right" }}>{item.qty}</td>
                                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                                        {fmt(item.price * item.qty)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════ E-LOAD SALES TAB ══════════════════════ */}
      {activeTab === "eload" && (
        <>
          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatCard label="Load Transactions" value={fmtN(eloadStats.count)}  icon="pos"   color="#059669" bg="#ecfdf5" />
            <StatCard label="Total Collected"   value={fmt(eloadStats.total)}   icon="chart" color="#4f46e5" bg="#eef2ff" />
            <StatCard label="Total Profit"      value={fmt(eloadStats.profit)}  icon="star"  color="#d97706" bg="#fffbeb" />
            <StatCard label="Loads Sold"        value={fmtN(eloadStats.loads)}  icon="box"   color="#7c3aed" bg="#f5f3ff" />
          </div>

          {/* Per-network breakdown pills */}
          {allNetworks.length > 1 && (
            <div className="sh-network-summary">
              {allNetworks.filter(n => n !== "All").map(n => {
                const nc = NETWORK_COLORS[n] ?? NETWORK_COLORS.Other;
                const netTxns = filteredEload.filter(t => t.items?.some(i => i.network === n));
                const netProfit = netTxns.reduce((s, t) =>
                  s + (t.items?.filter(i => i.network === n).reduce((a, i) => a + +i.profit, 0) ?? 0), 0
                );
                return (
                  <div
                    key={n}
                    className="sh-network-card"
                    style={{ background: nc.bg, border: `1.5px solid ${nc.border}` }}
                  >
                    <span className="eload-net-dot" style={{ background: nc.dot, width: 10, height: 10 }} />
                    <div>
                      <div style={{ fontWeight: 700, color: nc.text, fontSize: 13 }}>{n}</div>
                      <div style={{ fontSize: 11, color: nc.text, opacity: 0.7 }}>
                        {netTxns.length} txn{netTxns.length !== 1 ? "s" : ""} · {fmt(netProfit)} profit
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table */}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th>TXN ID</th>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("date")}>
                    Date <SortIcon field="date" />
                  </th>
                  <th>Loads</th>
                  <th>Load Value</th>
                  <th>Cost</th>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("profit")}>
                    Profit <SortIcon field="profit" />
                  </th>
                  <th>Discount</th>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("total")}>
                    Total <SortIcon field="total" />
                  </th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredEload.length === 0 ? (
                  <tr><td colSpan={10} className="table-empty">No e-load sales found.</td></tr>
                ) : (
                  filteredEload.map(t => (
                    <>
                      <tr
                        key={t.id}
                        className={`sh-row ${expandedTx === t.id ? "sh-row--expanded" : ""}`}
                        onClick={() => setExpandedTx(expandedTx === t.id ? null : t.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <span className="sh-expand-icon">{expandedTx === t.id ? "▼" : "▶"}</span>
                        </td>
                        <td className="td-id">{t.id.toUpperCase()}</td>
                        <td className="td-small">{t.date}</td>
                        <td>
                          <span className="sh-items-badge sh-items-badge--green">
                            {t.items?.length ?? 0} load{t.items?.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td>{fmt(t.subtotal)}</td>
                        <td className="td-muted">{fmt(t.totalCost ?? 0)}</td>
                        <td style={{ color: "var(--color-green)", fontWeight: 700 }}>
                          {fmt(t.totalProfit ?? 0)}
                        </td>
                        <td className="td-muted">{t.discount > 0 ? fmt(t.discount) : "—"}</td>
                        <td className="td-price" style={{ fontWeight: 700 }}>{fmt(t.total)}</td>
                        <td style={{ color: "var(--color-green)", fontWeight: 600 }}>{fmt(t.change)}</td>
                      </tr>

                      {/* Expanded load items */}
                      {expandedTx === t.id && (
                        <tr key={t.id + "-items"} className="sh-items-row">
                          <td colSpan={10}>
                            <div className="sh-items-panel">
                              <div className="sh-items-panel__title">Load Items</div>
                              <table className="sh-items-table">
                                <thead>
                                  <tr>
                                    <th>Network</th>
                                    <th>Load</th>
                                    <th>Mobile #</th>
                                    <th style={{ textAlign: "right" }}>Denomination</th>
                                    <th style={{ textAlign: "right" }}>Cost</th>
                                    <th style={{ textAlign: "right" }}>Profit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(t.items ?? []).map((item, i) => {
                                    const nc = NETWORK_COLORS[item.network] ?? NETWORK_COLORS.Other;
                                    return (
                                      <tr key={i}>
                                        <td>
                                          <span
                                            className="eload-badge"
                                            style={{ background: nc.bg, border: `1px solid ${nc.border}`, color: nc.text }}
                                          >
                                            <span className="eload-net-dot" style={{ background: nc.dot }} />
                                            {item.network}
                                          </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                                        <td className="td-muted">{item.mobileNumber || "—"}</td>
                                        <td style={{ textAlign: "right" }}>{fmt(item.denomination)}</td>
                                        <td style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
                                          {fmt(item.costPrice)}
                                        </td>
                                        <td style={{ textAlign: "right", color: "var(--color-green)", fontWeight: 700 }}>
                                          {fmt(item.profit)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
