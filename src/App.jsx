import { useState, useEffect } from "react";
import "./App.css";

import {
  fetchProducts,          createProduct,       updateProduct,       deleteProduct,
  fetchSuppliers,         createSupplier,      updateSupplier,      deleteSupplier,
  fetchTransactions,      saveTransaction,
  fetchEloadTransactions, saveEloadTransaction,
  fetchLoadProducts,      createLoadProduct,   updateLoadProduct,   deleteLoadProduct,
  fetchPurchaseOrders,    createPurchaseOrder, receivePurchaseOrder,
  incrementStock,
} from "./lib/supabase";

import Sidebar              from "./Components/Sidebar";
import Dashboard            from "./Components/Dashboard";
import StockManagement      from "./Components/StockManagement";
import ELoading             from "./Components/ELoading";
import POS                  from "./Components/POS";
import PurchasingManagement from "./Components/PurchasingManagement";
import SupplierManagement   from "./Components/SupplierManagement";
import StockAlerts          from "./Components/StockAlerts";
import Reports              from "./Components/Reports";
import SalesHistory         from "./Components/SalesHistory";

export default function App() {
  const [products,       setProducts]       = useState([]);
  const [suppliers,      setSuppliers]      = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [transactions,   setTransactions]   = useState([]);
  const [loadProducts,   setLoadProducts]   = useState([]);
  const [activeModule,   setActiveModule]   = useState("dashboard");
  const [loading,        setLoading]        = useState(true);
  const [dbError,        setDbError]        = useState(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [prods, sups, txns, eloadTxns, lps, pos] = await Promise.all([
          fetchProducts(),
          fetchSuppliers(),
          fetchTransactions(),
          fetchEloadTransactions(),
          fetchLoadProducts(),
          fetchPurchaseOrders(),
        ]);
        setProducts(prods);
        setSuppliers(sups);
        setTransactions([...txns, ...eloadTxns].sort((a, b) => b.id.localeCompare(a.id)));
        setLoadProducts(lps);
        setPurchaseOrders(pos);
      } catch (err) {
        console.error("Supabase bootstrap error:", err);
        setDbError(err.message);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  const lowStockCount = products.filter(p => p.stock === 0 || p.stock <= p.reorderLevel).length;
  const isPos         = activeModule === "pos";

  const handleSaveTransaction = async (txn) => {
    try {
      const saved = await saveTransaction(txn);
      setTransactions(prev => [saved, ...prev]);
      setProducts(prev => prev.map(p => {
        const ci = txn.items.find(i => i.productId === p.id);
        return ci ? { ...p, stock: Math.max(0, p.stock - ci.qty) } : p;
      }));
      return saved;
    } catch (err) { alert("Failed to save transaction: " + err.message); }
  };

  const handleSaveEloadTransaction = async (txn) => {
    try {
      const saved = await saveEloadTransaction(txn);
      setTransactions(prev => [saved, ...prev]);
      return saved;
    } catch (err) { alert("Failed to save e-load transaction: " + err.message); }
  };

  const handleProcessReturn = async (items) => {
    try {
      await incrementStock(items);
      setProducts(prev => prev.map(p => {
        const ri = items.find(i => i.productId === p.id);
        return ri ? { ...p, stock: p.stock + ri.qty } : p;
      }));
    } catch (err) { alert("Failed to process return: " + err.message); }
  };

  if (loading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", height:"100vh", gap:16,
        fontFamily:"'DM Sans', sans-serif", background:"#f1f5f9" }}>
        <div style={{ fontSize: 40 }}>📦</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>ChonaSync</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>Connecting to database…</div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", height:"100vh", gap:12,
        fontFamily:"'DM Sans', sans-serif", background:"#fef2f2" }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontSize:16, fontWeight:700, color:"#dc2626" }}>Database Connection Failed</div>
        <div style={{ fontSize:13, color:"#7f1d1d", maxWidth:420, textAlign:"center" }}>{dbError}</div>
        <button onClick={() => window.location.reload()} style={{
          marginTop:8, padding:"8px 20px", borderRadius:8, border:"none",
          background:"#dc2626", color:"#fff", cursor:"pointer", fontWeight:600 }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} lowStockCount={lowStockCount} />

      <main className="main-content">
        <div className={isPos ? "main-content--pos" : "main-content--padded"}>

          {activeModule === "dashboard" && (
            <Dashboard
              products={products} transactions={transactions}
              purchaseOrders={purchaseOrders} suppliers={suppliers}
              setActiveModule={setActiveModule}
            />
          )}

          {activeModule === "stock" && (
            <StockManagement
              products={products} setProducts={setProducts} suppliers={suppliers}
              onAddProduct={async (p) => { const s = await createProduct(p); setProducts(prev => [...prev, s]); }}
              onUpdateProduct={async (id, c) => { const s = await updateProduct(id, c); setProducts(prev => prev.map(p => p.id === id ? s : p)); }}
              onDeleteProduct={async (id) => { await deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); }}
            />
          )}

          {activeModule === "pos" && (
            <POS
              products={products} setProducts={setProducts}
              transactions={transactions} setTransactions={setTransactions}
              loadProducts={loadProducts}
              onCheckout={handleSaveTransaction}
              onCheckoutEload={handleSaveEloadTransaction}
              onProcessReturn={handleProcessReturn}
            />
          )}

          {activeModule === "eloading" && (
            <ELoading
              loadProducts={loadProducts} setLoadProducts={setLoadProducts}
              onAdd={async (lp) => { const s = await createLoadProduct(lp); setLoadProducts(prev => [...prev, s]); }}
              onUpdate={async (id, c) => { const s = await updateLoadProduct(id, c); setLoadProducts(prev => prev.map(l => l.id === id ? s : l)); }}
              onDelete={async (id) => { await deleteLoadProduct(id); setLoadProducts(prev => prev.filter(l => l.id !== id)); }}
            />
          )}

          {/* Sales History — product tab default */}
          {activeModule === "saleshistory" && (
            <SalesHistory transactions={transactions} initialTab="product" />
          )}

          {/* Sales History — e-load tab (via dashboard shortcut) */}
          {activeModule === "saleshistory-eload" && (
            <SalesHistory transactions={transactions} initialTab="eload" />
          )}

          {activeModule === "purchasing" && (
            <PurchasingManagement
              purchaseOrders={purchaseOrders} setPurchaseOrders={setPurchaseOrders}
              products={products} setProducts={setProducts} suppliers={suppliers}
              onCreatePO={async (po) => { const s = await createPurchaseOrder(po); setPurchaseOrders(prev => [s, ...prev]); }}
              onReceivePO={async (po) => {
                await receivePurchaseOrder(po);
                setPurchaseOrders(prev => prev.map(p => p.id === po.id
                  ? { ...p, status:"received", receivedDate: new Date().toISOString().slice(0,10) } : p));
                setProducts(prev => prev.map(p => {
                  const item = po.items.find(i => i.productId === p.id);
                  return item ? { ...p, stock: p.stock + item.qty } : p;
                }));
              }}
            />
          )}

          {activeModule === "suppliers" && (
            <SupplierManagement
              suppliers={suppliers} setSuppliers={setSuppliers} purchaseOrders={purchaseOrders}
              onAddSupplier={async (s) => { const sv = await createSupplier(s); setSuppliers(prev => [...prev, sv]); }}
              onUpdateSupplier={async (id, c) => { const sv = await updateSupplier(id, c); setSuppliers(prev => prev.map(s => s.id === id ? sv : s)); }}
              onDeleteSupplier={async (id) => { await deleteSupplier(id); setSuppliers(prev => prev.filter(s => s.id !== id)); }}
            />
          )}

          {activeModule === "alerts"  && <StockAlerts products={products} />}

          {activeModule === "reports" && (
            <Reports products={products} transactions={transactions}
              purchaseOrders={purchaseOrders} suppliers={suppliers} />
          )}
        </div>
      </main>
    </div>
  );
}