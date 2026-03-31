import { useState } from "react";
import Icon from "../components/Icon";
import { Badge, Btn, Modal, Field } from "../components/Primitives";

export default function PurchasingManagement({
  purchaseOrders,
  products,
  suppliers,
  onCreatePO,
  onReceivePO,
}) {
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({ supplierId: "", expectedDate: "" });
  const [poItems, setPoItems] = useState([{ productId: "", qty: 1, unitCost: 0 }]);

  // ── PO item helpers ────────────────────────────────────────────────────────
  const addItem    = ()         => setPoItems(prev => [...prev, { productId: "", qty: 1, unitCost: 0 }]);
  const removeItem = i          => setPoItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v)  => setPoItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const openCreate = () => {
    setForm({ supplierId: suppliers[0]?.id || "", expectedDate: "" });
    setPoItems([{ productId: "", qty: 1, unitCost: 0 }]);
    setModal("create");
  };

  // ── Save PO ────────────────────────────────────────────────────────────────
  const savePO = async () => {
    const items = poItems
      .filter(i => i.productId)
      .map(i => ({ ...i, qty: +i.qty, unitCost: +i.unitCost }));
    const total = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
    const newPO = {
      id: "po" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      supplierId: form.supplierId,
      items,
      status: "pending",
      total,
      expectedDate: form.expectedDate,
      receivedDate: null,
    };
    if (onCreatePO) {
      await onCreatePO(newPO);
    }
    setModal(null);
  };

  // ── Receive delivery ───────────────────────────────────────────────────────
  const receiveOrder = async po => {
    if (onReceivePO) {
      await onReceivePO(po);
    }
  };

  const statusColor = { pending: "yellow", transit: "blue", received: "green", cancelled: "red" };

  const poRunningTotal = poItems.reduce((s, i) => s + +i.qty * +i.unitCost, 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Purchasing Management</h1>
          <p className="page-header__sub">Manage purchase orders and incoming stock</p>
        </div>
        <Btn onClick={openCreate} icon="plus">Create PO</Btn>
      </div>

      {/* PO Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {["PO #","Date","Supplier","Items","Total","Expected","Status","Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map(po => {
              const supplier = suppliers.find(s => s.id === po.supplierId);
              return (
                <tr key={po.id}>
                  <td className="td-id">{po.id.toUpperCase()}</td>
                  <td className="td-small">{po.date}</td>
                  <td className="td-name">{supplier?.name || "—"}</td>
                  <td>{po.items.length} items</td>
                  <td className="td-price">₱{po.total.toLocaleString()}</td>
                  <td className="td-small">{po.expectedDate}</td>
                  <td>
                    <Badge color={statusColor[po.status]}>
                      {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    {(po.status === "pending" || po.status === "transit") ? (
                      <Btn size="sm" variant="success" onClick={() => receiveOrder(po)}>
                        <Icon name="check" size={12} /> Receive
                      </Btn>
                    ) : (
                      <span className="td-small">Received {po.receivedDate}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create PO Modal */}
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Create Purchase Order"
        maxWidth={680}
      >
        <div className="form-grid-2 mb-16">
          <Field label="Supplier" required>
            <select
              className="select"
              value={form.supplierId}
              onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
            >
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Expected Delivery">
            <input
              className="input"
              type="date"
              value={form.expectedDate}
              onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))}
            />
          </Field>
        </div>

        <p className="field__label" style={{ marginBottom: 10 }}>Order Items</p>
        {poItems.map((item, i) => (
          <div key={i} className="po-item-row">
            <select
              className="select"
              value={item.productId}
              onChange={e => {
                const p = products.find(p => p.id === e.target.value);
                updateItem(i, "productId", e.target.value);
                if (p) updateItem(i, "unitCost", p.cost);
              }}
            >
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="input" type="number" placeholder="Qty"       value={item.qty}      onChange={e => updateItem(i, "qty",      e.target.value)} />
            <input className="input" type="number" placeholder="Unit Cost" value={item.unitCost} onChange={e => updateItem(i, "unitCost", e.target.value)} />
            <button onClick={() => removeItem(i)} className="btn btn--danger btn--sm">
              <Icon name="x" size={13} />
            </button>
          </div>
        ))}

        <Btn variant="secondary" size="sm" onClick={addItem} icon="plus" className="mb-16">
          Add Item
        </Btn>

        <div className="po-total-bar">
          Total: <strong>₱{poRunningTotal.toLocaleString()}</strong>
        </div>

        <div className="modal__footer">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={savePO}>Submit PO</Btn>
        </div>
      </Modal>
    </div>
  );
}
