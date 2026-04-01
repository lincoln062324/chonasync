import { useState } from "react";
import Icon from "../Components/Icon";
import { Btn, Modal, Field } from "../Components/Primitives";
import { TAX_RATE } from "../data/constants";

const NETWORK_COLORS = {
  Globe:  { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6" },
  Smart:  { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e" },
  TNT:    { bg: "#fef3c7", border: "#fde68a", text: "#92400e", dot: "#f59e0b" },
  DITO:   { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", dot: "#8b5cf6" },
  Sun:    { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", dot: "#f97316" },
  TM:     { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", dot: "#10b981" },
  Other:  { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", dot: "#94a3b8" },
};

export default function POS({
  products,
  setProducts,
  transactions,
  setTransactions,
  loadProducts = [],   // ← e-load catalog passed from App
  onCheckout,
  onCheckoutEload,
  onProcessReturn,
}) {
  // ── Mode: "products" | "eloading" ──────────────────────────────────────────
  const [mode, setMode] = useState("products");

  // ── Shared state ────────────────────────────────────────────────────────────
  const [search,      setSearch]      = useState("");
  const [cart,        setCart]        = useState([]);
  const [discount,    setDiscount]    = useState(0);
  const [payment,     setPayment]     = useState("");
  const [receipt,     setReceipt]     = useState(null);
  const [returnModal, setReturnModal] = useState(false);
  const [returnTxId,  setReturnTxId]  = useState("");
  const [returnItems, setReturnItems] = useState([]);

  // ── E-Load specific state ────────────────────────────────────────────────────
  const [eloadFilter,  setEloadFilter]  = useState("All");
  const [eloadCart,    setEloadCart]    = useState([]); // [{...loadProduct, mobileNumber}]
  const [eloadPayment, setEloadPayment] = useState("");
  const [eloadReceipt, setEloadReceipt] = useState(null);
  const [eloadDiscount,setEloadDiscount]= useState(0);
  // For entering mobile number per load item
  const [mobileInputs, setMobileInputs] = useState({}); // {cartIndex: number}

  // ── Out-of-stock panel toggle ────────────────────────────────────────────────
  const [showOos, setShowOos] = useState(false);

  // ── Calculator state ─────────────────────────────────────────────────────────
  const [showCalc,    setShowCalc]    = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcExpr,    setCalcExpr]    = useState("");
  const [calcHistory, setCalcHistory] = useState([]);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcTab,     setCalcTab]     = useState("calc"); // "calc" | "history"
  const [calcError,   setCalcError]   = useState(false);

  // Load history from Supabase when calculator opens
  const openCalc = async () => {
    setShowCalc(true);
    setCalcTab("calc");
    setCalcLoading(true);
    try {
      const { fetchCalcHistory } = await import("../lib/supabase.js");
      const rows = await fetchCalcHistory();
      setCalcHistory(rows);
    } catch { /* silently ignore if table not set up yet */ }
    setCalcLoading(false);
  };

  const calcInput = (val) => {
    setCalcError(false);
    if (val === "C") { setCalcDisplay("0"); setCalcExpr(""); return; }
    if (val === "⌫") {
      setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
      return;
    }
    if (val === "=") {
      try {
        // Safe eval: only allow digits, operators, dots, parens, spaces
        const sanitized = calcExpr.replace(/[^0-9+\-*/().% ]/g, "");
        // eslint-disable-next-line no-new-func
        const result = Function('"use strict"; return (' + sanitized + ')')();
        if (!isFinite(result)) throw new Error("Not a number");
        const resultStr = parseFloat(result.toFixed(10)).toString();
        const entry = { expression: calcExpr, result: resultStr, date: new Date().toISOString() };
        setCalcDisplay(resultStr);
        setCalcExpr(resultStr);
        // Save to Supabase (fire and forget)
        import("../lib/supabase.js").then(({ saveCalcHistory }) => {
          saveCalcHistory(entry).then(saved => {
            setCalcHistory(prev => [saved, ...prev].slice(0, 50));
          }).catch(() => {});
        });
      } catch {
        setCalcDisplay("Error");
        setCalcError(true);
        setCalcExpr("");
      }
      return;
    }
    // Append digit/operator
    const next = (calcExpr === "" || calcError) ? val : calcExpr + val;
    setCalcExpr(next);
    setCalcDisplay(next);
    setCalcError(false);
  };

  const calcLoadHistory = (entry) => {
    setCalcDisplay(entry.result);
    setCalcExpr(entry.result);
    setCalcTab("calc");
    setCalcError(false);
  };

  // ── Switch mode — clear search ──────────────────────────────────────────────
  const switchMode = (m) => { setMode(m); setSearch(""); };

  // ══════════════════════════════════════════════════════════════════════════════
  // PRODUCT SALE logic (unchanged)
  // ══════════════════════════════════════════════════════════════════════════════
  const filtered = search.length > 1
    ? products.filter(p => p.stock > 0 && (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      ))
    : products.filter(p => p.stock > 0);

const addToCart = (product) => {
  setCart(prev => {
    const exists = prev.find(i => i.productId === product.id);
    if (exists) {
      return exists.qty >= product.stock
        ? prev
        : prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
    }
    return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
  });
};

const outOfStock = products.filter(p => p.stock === 0);

  const updateQty = (productId, qty) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.productId !== productId)); return; }
    const prod = products.find(p => p.id === productId);
    if (qty > prod.stock) return;
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax - +discount;
  const change   = +payment - total;

  const checkout = async () => {
    if (!payment || +payment < total) { alert("Insufficient payment amount."); return; }
    const txn = {
      id: "t" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      items: cart.map(i => ({ productId: i.productId, name: i.name, qty: i.qty, price: i.price })),
      subtotal, tax, discount: +discount, total, payment: +payment, change, method: "cash",
    };

    const savedTxn = onCheckout ? await onCheckout(txn) : txn;

    if (!onCheckout) {
      setTransactions(prev => [txn, ...prev]);
      setProducts(prev =>
        prev.map(p => {
          const ci = cart.find(i => i.productId === p.id);
          return ci ? { ...p, stock: p.stock - ci.qty } : p;
        })
      );
    }

    setReceipt(savedTxn || txn);
    setCart([]);
    setDiscount(0);
    setPayment("");
  };

  // Returns
  const loadTxForReturn = () => {
    const txn = transactions.find(t => t.id === returnTxId);
    if (!txn) { alert("Transaction not found"); return; }
    setReturnItems(txn.items.map(i => ({ ...i, returnQty: 0 })));
  };

  const processReturn = async () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) { alert("No items selected for return"); return; }

    if (onProcessReturn) {
      await onProcessReturn(itemsToReturn);
    }

    alert(`Return processed! ${itemsToReturn.reduce((s, i) => s + +i.returnQty, 0)} items restocked.`);
    setReturnModal(false);
    setReturnTxId("");
    setReturnItems([]);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // E-LOADING logic
  // ══════════════════════════════════════════════════════════════════════════════
  const eloadNetworks = ["All", ...([...new Set(loadProducts.map(lp => lp.network))])];

  const filteredLoad = loadProducts.filter(lp =>
    (eloadFilter === "All" || lp.network === eloadFilter) &&
    (search.length < 2 || lp.name.toLowerCase().includes(search.toLowerCase()) || lp.network.toLowerCase().includes(search.toLowerCase()))
  );

  const addToEloadCart = (lp) => {
    setEloadCart(prev => [...prev, { ...lp, cartId: Date.now() + Math.random(), mobileNumber: "" }]);
  };

  const updateEloadMobile = (cartId, number) => {
    setEloadCart(prev => prev.map(i => i.cartId === cartId ? { ...i, mobileNumber: number } : i));
  };

  const removeFromEloadCart = (cartId) => {
    setEloadCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const eloadSubtotal = eloadCart.reduce((s, i) => s + +i.denomination, 0);
  const eloadTotalProfit = eloadCart.reduce((s, i) => s + +i.profit, 0);
  const eloadTotalCost   = eloadCart.reduce((s, i) => s + +i.costPrice, 0);
  const eloadTotal = eloadSubtotal - +eloadDiscount;
  const eloadChange = +eloadPayment - eloadTotal;

  const checkoutEload = async () => {
    if (eloadCart.length === 0) { alert("No load items in cart."); return; }
    if (!eloadPayment || +eloadPayment < eloadTotal) { alert("Insufficient payment amount."); return; }

    const txn = {
      id: "el" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: "eloading",
      items: eloadCart.map(i => ({
        loadId: i.id,
        name: i.name,
        network: i.network,
        denomination: +i.denomination,
        costPrice: +i.costPrice,
        profit: +i.profit,
        mobileNumber: i.mobileNumber,
      })),
      subtotal: eloadSubtotal,
      totalProfit: eloadTotalProfit,
      totalCost: eloadTotalCost,
      discount: +eloadDiscount,
      total: eloadTotal,
      payment: +eloadPayment,
      change: eloadChange,
      method: "cash",
    };

    const savedTxn = onCheckoutEload ? await onCheckoutEload(txn) : txn;

    if (!onCheckoutEload) {
      setTransactions(prev => [txn, ...prev]);
    }

    setEloadReceipt(savedTxn || txn);
    setEloadCart([]);
    setEloadDiscount(0);
    setEloadPayment("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pos-layout">

      {/* ══ Left: Products / E-Load Grid ══ */}
      <div className="pos-products">

        {/* Header */}
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-header__title">Point of Sale</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={openCalc}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                background: "#f8fafc", cursor: "pointer", fontSize: 13,
                fontWeight: 600, color: "#374151", transition: "all 0.15s",
              }}
              title="Open Calculator"
            >
              🧮 Calculator
            </button>
            <Btn variant="secondary" icon="undo" onClick={() => setReturnModal(true)}>
              Process Return
            </Btn>
          </div>
        </div>

        {/* Mode toggle tabs */}
        <div className="pos-mode-tabs">
          <button
            className={`pos-mode-tab ${mode === "products" ? "pos-mode-tab--active" : ""}`}
            onClick={() => switchMode("products")}
          >
            <Icon name="box" size={14} /> Products
          </button>
          <button
            className={`pos-mode-tab ${mode === "eloading" ? "pos-mode-tab--active pos-mode-tab--eload" : ""}`}
            onClick={() => switchMode("eloading")}
          >
            <span style={{ fontSize: 14 }}>📱</span> E-Loading
          </button>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <span className="search-wrap__icon"><Icon name="search" size={15} /></span>
          <input
            className="input"
            placeholder={mode === "eloading" ? "Search by network or load name…" : "Search by name or SKU…"}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* ── Out-of-Stock quick overview (products mode only) ── */}
        {mode === "products" && outOfStock.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={() => setShowOos(v => !v)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 8, border: "1.5px solid #fecaca",
                background: showOos ? "#fef2f2" : "#fff5f5",
                cursor: "pointer", transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>🚫</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#dc2626" }}>
                  {outOfStock.length} Out-of-Stock Item{outOfStock.length !== 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: 12, color: "#ef4444", background: "#fee2e2",
                  borderRadius: 20, padding: "1px 8px", fontWeight: 600 }}>
                  Not available
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                {showOos ? "▲ Hide" : "▼ View"}
              </span>
            </button>

            {showOos && (
              <div style={{
                border: "1.5px solid #fecaca", borderTop: "none",
                borderRadius: "0 0 8px 8px", background: "#fff",
                maxHeight: 220, overflowY: "auto",
              }}>
                {outOfStock.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: i < outOfStock.length - 1 ? "1px solid #fee2e2" : "none",
                      background: i % 2 === 0 ? "#fff" : "#fff5f5",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                        {p.sku} · {p.category} · ₱{p.price}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#dc2626",
                      background: "#fee2e2", borderRadius: 6, padding: "2px 8px",
                      whiteSpace: "nowrap",
                    }}>
                      OUT OF STOCK
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── E-Load: network filter pills ── */}
        {mode === "eloading" && (
          <div className="eload-filter-tabs" style={{ marginBottom: 4 }}>
            {eloadNetworks.map(n => (
              <button
                key={n}
                className={`eload-filter-tab ${eloadFilter === n ? "eload-filter-tab--active" : ""}`}
                onClick={() => setEloadFilter(n)}
              >
                {n !== "All" && (
                  <span
                    className="eload-net-dot"
                    style={{ background: NETWORK_COLORS[n]?.dot ?? "#94a3b8" }}
                  />
                )}
                {n}
              </button>
            ))}
          </div>
        )}

        {/* ── Product grid ── */}
        {mode === "products" && (
          <div className="pos-product-grid">
            {filtered.map(p => (
              <button key={p.id} className="pos-product-card" onClick={() => addToCart(p)}>
                <div className="pos-product-card__sku">{p.sku}</div>
                <div className="pos-product-card__name">{p.name}</div>
                <div className="pos-product-card__price">₱{p.price}</div>
                <span className={`pos-product-card__stock ${p.stock <= p.reorderLevel ? "pos-product-card__stock--low" : "pos-product-card__stock--ok"}`}>
                  {p.stock}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--color-text-muted)", padding: 32 }}>
                No products found
              </div>
            )}
          </div>
        )}

        {/* ── E-Load grid ── */}
        {mode === "eloading" && (
          <div className="pos-product-grid">
            {loadProducts.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--color-text-muted)", padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No load products yet</div>
                <div style={{ fontSize: 13 }}>Go to E-Loading Management to add load products.</div>
              </div>
            ) : filteredLoad.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--color-text-muted)", padding: 32 }}>
                No load products found
              </div>
            ) : (
              filteredLoad.map(lp => {
                const nc = NETWORK_COLORS[lp.network] ?? NETWORK_COLORS.Other;
                return (
                  <button
                    key={lp.id}
                    className="pos-product-card eload-product-card"
                    onClick={() => addToEloadCart(lp)}
                    style={{ borderColor: nc.border }}
                  >
                    <div
                      className="eload-badge"
                      style={{
                        background: nc.bg, border: `1px solid ${nc.border}`,
                        color: nc.text, marginBottom: 6, display: "inline-flex"
                      }}
                    >
                      <span className="eload-net-dot" style={{ background: nc.dot }} />
                      {lp.network}
                    </div>
                    <div className="pos-product-card__name">{lp.name}</div>
                    <div className="pos-product-card__price">₱{(+lp.denomination).toFixed(0)}</div>
                    <div style={{ fontSize: 11, color: "var(--color-green)", fontWeight: 600, marginTop: 3 }}>
                      +₱{(+lp.profit).toFixed(2)} profit
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ══ Right: Cart ══ */}
      <div className="cart-panel">

        {/* ── Products Cart ── */}
        {mode === "products" && (
          <>
            <div className="cart-panel__header">
              <div className="cart-panel__header-title">Current Order</div>
              <div className="cart-panel__header-sub">{cart.length} item{cart.length !== 1 ? "s" : ""} in cart</div>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <Icon name="cart" size={36} />
                  <span>Click products to add to cart</span>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item__info">
                      <div className="cart-item__name">{item.name}</div>
                      <div className="cart-item__unit">₱{item.price} each</div>
                    </div>
                    <div className="cart-item__controls">
                      <button className="qty-btn" onClick={() => updateQty(item.productId, item.qty - 1)}>−</button>
                      <span className="qty-value">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.productId, item.qty + 1)}>+</button>
                      <span className="cart-item__subtotal">₱{(item.price * item.qty).toFixed(2)}</span>
                      <button
                        className="cart-item__remove"
                        onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="checkout-panel">
              <div className="checkout-row">
                <span className="checkout-row__label">Subtotal</span>
                <span className="checkout-row__value">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="checkout-row">
                <span className="checkout-row__label">Tax (12%)</span>
                <span className="checkout-row__value">₱{tax.toFixed(2)}</span>
              </div>
              <div className="checkout-discount">
                <span className="checkout-row__label">Discount</span>
                <input
                  className="input input--sm input--right"
                  style={{ width: 80 }}
                  type="number"
                  placeholder="0"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                />
              </div>
              <div className="checkout-total">
                <span>TOTAL</span>
                <span className="checkout-total__amount">₱{total.toFixed(2)}</span>
              </div>
              <Field label="Cash Payment">
                <input
                  className="input"
                  type="number"
                  placeholder="Enter amount received"
                  value={payment}
                  onChange={e => setPayment(e.target.value)}
                />
              </Field>
              {payment && +payment >= total && (
                <div className="checkout-change">
                  <span className="checkout-change__label">Change</span>
                  <span className="checkout-change__amount">₱{change.toFixed(2)}</span>
                </div>
              )}
              <Btn
                onClick={checkout}
                disabled={cart.length === 0 || !payment || +payment < total}
                className="btn--lg"
              >
                <Icon name="check" size={16} /> Complete Sale
              </Btn>
            </div>
          </>
        )}

        {/* ── E-Load Cart ── */}
        {mode === "eloading" && (
          <>
            <div className="cart-panel__header" style={{ background: "#f0fdf4" }}>
              <div className="cart-panel__header-title" style={{ color: "var(--color-green)" }}>
                📱 Load Order
              </div>
              <div className="cart-panel__header-sub">
                {eloadCart.length} load{eloadCart.length !== 1 ? "s" : ""} · ₱{eloadTotalProfit.toFixed(2)} profit
              </div>
            </div>

            <div className="cart-items">
              {eloadCart.length === 0 ? (
                <div className="cart-empty">
                  <span style={{ fontSize: 36 }}>📱</span>
                  <span>Click a load denomination to add</span>
                </div>
              ) : (
                eloadCart.map((item) => {
                  const nc = NETWORK_COLORS[item.network] ?? NETWORK_COLORS.Other;
                  return (
                    <div key={item.cartId} className="cart-item eload-cart-item">
                      <div className="cart-item__info">
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span
                            className="eload-badge"
                            style={{ background: nc.bg, border: `1px solid ${nc.border}`, color: nc.text }}
                          >
                            <span className="eload-net-dot" style={{ background: nc.dot }} />
                            {item.network}
                          </span>
                          <span className="cart-item__name">{item.name}</span>
                        </div>
                        <input
                          className="input input--sm"
                          style={{ width: "100%", fontSize: 12 }}
                          placeholder="Mobile number (optional)"
                          value={item.mobileNumber}
                          onChange={e => updateEloadMobile(item.cartId, e.target.value)}
                        />
                        <div style={{ fontSize: 11, color: "var(--color-green)", marginTop: 3 }}>
                          Profit: ₱{(+item.profit).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontWeight: 800, color: "var(--color-indigo)", fontSize: 15 }}>
                          ₱{(+item.denomination).toFixed(2)}
                        </span>
                        <button
                          className="cart-item__remove"
                          onClick={() => removeFromEloadCart(item.cartId)}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* E-Load Checkout Summary */}
            <div className="checkout-panel">
              {/* Profit summary box */}
              {eloadCart.length > 0 && (
                <div className="eload-profit-summary">
                  <div className="eload-profit-row">
                    <span>Total Load Value</span>
                    <span>₱{eloadSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="eload-profit-row">
                    <span>Total Cost</span>
                    <span>₱{eloadTotalCost.toFixed(2)}</span>
                  </div>
                  <div className="eload-profit-row eload-profit-row--highlight">
                    <span>Your Total Profit</span>
                    <span>₱{eloadTotalProfit.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="checkout-discount" style={{ marginTop: 8 }}>
                <span className="checkout-row__label">Discount</span>
                <input
                  className="input input--sm input--right"
                  style={{ width: 80 }}
                  type="number"
                  placeholder="0"
                  value={eloadDiscount}
                  onChange={e => setEloadDiscount(e.target.value)}
                />
              </div>

              <div className="checkout-total">
                <span>TOTAL</span>
                <span className="checkout-total__amount">₱{eloadTotal.toFixed(2)}</span>
              </div>

              <Field label="Cash Payment">
                <input
                  className="input"
                  type="number"
                  placeholder="Enter amount received"
                  value={eloadPayment}
                  onChange={e => setEloadPayment(e.target.value)}
                />
              </Field>

              {eloadPayment && +eloadPayment >= eloadTotal && (
                <div className="checkout-change">
                  <span className="checkout-change__label">Change</span>
                  <span className="checkout-change__amount">₱{eloadChange.toFixed(2)}</span>
                </div>
              )}

              <Btn
                onClick={checkoutEload}
                disabled={eloadCart.length === 0 || !eloadPayment || +eloadPayment < eloadTotal}
                className="btn--lg"
                style={{ background: "var(--color-green)", borderColor: "var(--color-green)" }}
              >
                <span>📱</span> Complete Load Sale
              </Btn>
            </div>
          </>
        )}
      </div>

      {/* ══ Product Receipt Modal ══ */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Transaction Complete">
        {receipt && (
          <>
            <div className="receipt-success">
              <div className="receipt-icon"><Icon name="check" size={24} /></div>
              <div className="receipt-title">Sale Completed!</div>
              <div className="receipt-id">TXN: {receipt.id.toUpperCase()}</div>
            </div>
            <div className="receipt-items">
              {receipt.items.map((item, i) => (
                <div key={i} className="receipt-item-row">
                  <span>{item.name} × {item.qty}</span>
                  <span>₱{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="receipt-breakdown">
              {[
                ["Subtotal",  `₱${receipt.subtotal.toFixed(2)}`],
                ["Tax (12%)", `₱${receipt.tax.toFixed(2)}`],
                ...(receipt.discount > 0 ? [["Discount", `-₱${receipt.discount}`]] : []),
                ["Total",     `₱${receipt.total.toFixed(2)}`,   true],
                ["Cash",      `₱${receipt.payment.toFixed(2)}`],
                ["Change",    `₱${receipt.change.toFixed(2)}`],
              ].map(([label, value, isTotal]) => (
                <div key={label} className={`receipt-breakdown-row${isTotal ? " receipt-breakdown-row--total" : ""}`}>
                  <span className="receipt-breakdown-row__label">{label}</span>
                  <span className="receipt-breakdown-row__value">{value}</span>
                </div>
              ))}
            </div>
            <Btn onClick={() => setReceipt(null)} className="btn--lg mt-12">New Transaction</Btn>
          </>
        )}
      </Modal>

      {/* ══ E-Load Receipt Modal ══ */}
      <Modal open={!!eloadReceipt} onClose={() => setEloadReceipt(null)} title="Load Sale Complete">
        {eloadReceipt && (
          <>
            <div className="receipt-success">
              <div className="receipt-icon" style={{ background: "#dcfce7", color: "var(--color-green)" }}>
                <span style={{ fontSize: 24 }}>📱</span>
              </div>
              <div className="receipt-title">Load Sold!</div>
              <div className="receipt-id">TXN: {eloadReceipt.id.toUpperCase()}</div>
            </div>
            <div className="receipt-items">
              {eloadReceipt.items.map((item, i) => (
                <div key={i} className="receipt-item-row" style={{ flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600 }}>{item.name} ({item.network})</span>
                    <span>₱{(+item.denomination).toFixed(2)}</span>
                  </div>
                  {item.mobileNumber && (
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      📞 {item.mobileNumber}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "var(--color-green)" }}>
                    Profit: ₱{(+item.profit).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="receipt-breakdown">
              {[
                ["Load Total", `₱${eloadReceipt.subtotal.toFixed(2)}`],
                ["Your Cost",  `₱${eloadReceipt.totalCost.toFixed(2)}`],
                ...(eloadReceipt.discount > 0 ? [["Discount", `-₱${eloadReceipt.discount}`]] : []),
                ["Total Collected", `₱${eloadReceipt.total.toFixed(2)}`, true],
                ["Cash",       `₱${eloadReceipt.payment.toFixed(2)}`],
                ["Change",     `₱${eloadReceipt.change.toFixed(2)}`],
              ].map(([label, value, isTotal]) => (
                <div key={label} className={`receipt-breakdown-row${isTotal ? " receipt-breakdown-row--total" : ""}`}>
                  <span className="receipt-breakdown-row__label">{label}</span>
                  <span className="receipt-breakdown-row__value">{value}</span>
                </div>
              ))}
              <div className="receipt-breakdown-row" style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 10px", marginTop: 8 }}>
                <span style={{ color: "var(--color-green)", fontWeight: 700 }}>🎉 Your Total Profit</span>
                <span style={{ color: "var(--color-green)", fontWeight: 800, fontSize: 16 }}>
                  ₱{eloadReceipt.totalProfit.toFixed(2)}
                </span>
              </div>
            </div>
            <Btn
              onClick={() => setEloadReceipt(null)}
              className="btn--lg mt-12"
              style={{ background: "var(--color-green)", borderColor: "var(--color-green)" }}
            >
              New Load Sale
            </Btn>
          </>
        )}
      </Modal>

      {/* ══ Calculator Modal ══ */}
      <Modal open={showCalc} onClose={() => setShowCalc(false)} title="🧮 Instant Calculator" maxWidth={360}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1.5px solid #e2e8f0", marginBottom: 12, gap: 0 }}>
          {["calc", "history"].map(t => (
            <button
              key={t}
              onClick={() => setCalcTab(t)}
              style={{
                flex: 1, padding: "8px 0", border: "none", background: "none",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
                color: calcTab === t ? "#4f46e5" : "#94a3b8",
                borderBottom: calcTab === t ? "2.5px solid #4f46e5" : "2.5px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {t === "calc" ? "Calculator" : "History"}
            </button>
          ))}
        </div>

        {calcTab === "calc" && (
          <div>
            {/* Display */}
            <div style={{
              background: calcError ? "#fef2f2" : "#0f172a",
              borderRadius: 10, padding: "14px 16px", marginBottom: 10, minHeight: 70,
              display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end",
            }}>
              <div style={{ fontSize: 11, color: "#64748b", minHeight: 16, wordBreak: "break-all" }}>
                {calcExpr !== calcDisplay && !calcError ? calcExpr : ""}
              </div>
              <div style={{
                fontSize: calcDisplay.length > 14 ? 18 : 28,
                fontWeight: 800, color: calcError ? "#dc2626" : "#f8fafc",
                wordBreak: "break-all", textAlign: "right", letterSpacing: "-0.5px",
              }}>
                {calcDisplay}
              </div>
            </div>

            {/* Buttons */}
            {[
              ["C", "⌫", "%",  "÷"],
              ["7", "8", "9",  "×"],
              ["4", "5", "6",  "−"],
              ["1", "2", "3",  "+"],
              ["00","0", ".", "="],
            ].map((row, ri) => (
              <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 6 }}>
                {row.map(key => {
                  const isOp   = ["÷","×","−","+"].includes(key);
                  const isEq   = key === "=";
                  const isClear= key === "C";
                  const isDel  = key === "⌫";
                  // Map display chars to actual operators
                  const send = key === "÷" ? "/" : key === "×" ? "*" : key === "−" ? "-" : key;
                  return (
                    <button
                      key={key}
                      onClick={() => calcInput(send === "=" ? "=" : send === "C" ? "C" : send === "⌫" ? "⌫" : send)}
                      style={{
                        padding: "14px 0", borderRadius: 8, border: "1.5px solid",
                        fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.1s",
                        background: isEq   ? "#4f46e5"
                                  : isOp   ? "#eef2ff"
                                  : isClear? "#fef2f2"
                                  : isDel  ? "#fff7ed"
                                  : "#f8fafc",
                        borderColor: isEq   ? "#4338ca"
                                   : isOp   ? "#c7d2fe"
                                   : isClear? "#fecaca"
                                   : isDel  ? "#fed7aa"
                                   : "#e2e8f0",
                        color: isEq    ? "#fff"
                             : isOp    ? "#4f46e5"
                             : isClear ? "#dc2626"
                             : isDel   ? "#c2410c"
                             : "#0f172a",
                      }}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {calcTab === "history" && (
          <div>
            {calcLoading ? (
              <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 13 }}>Loading history…</div>
            ) : calcHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🧮</div>
                <div style={{ fontSize: 13 }}>No calculations yet.</div>
              </div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {calcHistory.map((h, i) => (
                  <button
                    key={h.id ?? i}
                    onClick={() => calcLoadHistory(h)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                      background: "#f8fafc", cursor: "pointer", textAlign: "left",
                      transition: "background 0.1s",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{h.expression}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>= {h.result}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, marginLeft: 8 }}>
                      {new Date(h.date).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══ Return Modal ══ */}
      <Modal open={returnModal} onClose={() => setReturnModal(false)} title="Process Return">
        <Field label="Transaction ID">
          <div className="flex gap-8">
            <input
              className="input"
              value={returnTxId}
              onChange={e => setReturnTxId(e.target.value)}
              placeholder="e.g. t1"
            />
            <Btn variant="secondary" onClick={loadTxForReturn}>Load</Btn>
          </div>
        </Field>
        {returnItems.length > 0 && (
          <>
            {returnItems.map((item, i) => (
              <div
                key={i}
                className="checkout-row"
                style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}
              >
                <span>{item.name} (sold: {item.qty})</span>
                <input
                  className="input input--sm input--right"
                  style={{ width: 70 }}
                  type="number"
                  min="0"
                  max={item.qty}
                  value={item.returnQty}
                  onChange={e =>
                    setReturnItems(prev =>
                      prev.map((it, idx) => idx === i ? { ...it, returnQty: e.target.value } : it)
                    )
                  }
                />
              </div>
            ))}
            <Btn onClick={processReturn} className="mt-12" icon="undo">
              Process Return &amp; Restock
            </Btn>
          </>
        )}
      </Modal>
    </div>
  );
}