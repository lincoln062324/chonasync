import { useState } from "react";
import "./App.css";

// ── Data & constants ──────────────────────────────────────────────────────────
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSACTIONS,
  INITIAL_PURCHASE_ORDERS,
} from "./data/constants";

// ── Layout ────────────────────────────────────────────────────────────────────
import Sidebar              from "./components/Sidebar";
import Dashboard            from "./components/Dashboard";
import StockManagement      from "./components/StockManagement";
import POS                  from "./components/POS";
import PurchasingManagement from "./components/PurchasingManagement";
import SupplierManagement   from "./components/SupplierManagement";
import StockAlerts          from "./components/StockAlerts";
import Reports              from "./components/Reports";
import ELoading, { DEFAULT_LOAD_PRODUCTS } from "./components/ELoading"; // ← NEW

/* ─── ROOT APP ────────────────────────────────────────────────────────────── */
export default function App() {
  const [products,       setProducts]       = useState(INITIAL_PRODUCTS);
  const [suppliers,      setSuppliers]      = useState(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState(INITIAL_PURCHASE_ORDERS);
  const [transactions,   setTransactions]   = useState(INITIAL_TRANSACTIONS);
  const [activeModule,   setActiveModule]   = useState("dashboard");

  // ── E-Loading catalog (shared between ELoading module & POS) ──
  const [loadProducts, setLoadProducts] = useState(DEFAULT_LOAD_PRODUCTS);

  const lowStockCount = products.filter(p => p.stock === 0 || p.stock <= p.reorderLevel).length;
  const isPos         = activeModule === "pos";

  return (
    <div className="app-shell">
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        lowStockCount={lowStockCount}
      />

      <main className="main-content">
        <div className={isPos ? "main-content--pos" : "main-content--padded"}>
          {activeModule === "dashboard"  && <Dashboard            products={products} transactions={transactions} purchaseOrders={purchaseOrders} suppliers={suppliers} />}
          {activeModule === "stock"      && <StockManagement      products={products} setProducts={setProducts} suppliers={suppliers} />}
          {activeModule === "pos"        && (
            <POS
              products={products}
              setProducts={setProducts}
              transactions={transactions}
              setTransactions={setTransactions}
              loadProducts={loadProducts}    
            />
          )}
          {activeModule === "eloading"   && (                     /* ← NEW module */
            <ELoading
              loadProducts={loadProducts}
              setLoadProducts={setLoadProducts}
            />
          )}
          {activeModule === "purchasing" && <PurchasingManagement purchaseOrders={purchaseOrders} setPurchaseOrders={setPurchaseOrders} products={products} setProducts={setProducts} suppliers={suppliers} />}
          {activeModule === "suppliers"  && <SupplierManagement   suppliers={suppliers} setSuppliers={setSuppliers} purchaseOrders={purchaseOrders} />}
          {activeModule === "alerts"     && <StockAlerts          products={products} />}
          {activeModule === "reports"    && <Reports              products={products} transactions={transactions} purchaseOrders={purchaseOrders} suppliers={suppliers} />}
        </div>
      </main>
    </div>
  );
}