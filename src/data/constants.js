// ─── SEED DATA ────────────────────────────────────────────────────────────────

export const INITIAL_SUPPLIERS = [
  { id: "s1", name: "FreshGoods Co.",   contact: "Juan dela Cruz", email: "juan@freshgoods.ph",   phone: "09171234567", address: "Quezon City, PH", terms: "Net 30", rating: 4.5, deliveryTime: 2, totalOrders: 24, onTimeDelivery: 92 },
  { id: "s2", name: "Metro Supply Hub", contact: "Maria Santos",   email: "maria@metrosupply.ph", phone: "09281234567", address: "Makati, PH",       terms: "Net 15", rating: 4.2, deliveryTime: 3, totalOrders: 18, onTimeDelivery: 88 },
  { id: "s3", name: "LazaroTrade Inc.", contact: "Pedro Lazaro",   email: "pedro@lazaro.ph",      phone: "09391234567", address: "Pasig, PH",         terms: "COD",    rating: 3.8, deliveryTime: 4, totalOrders: 11, onTimeDelivery: 80 },
];

export const INITIAL_PRODUCTS = [
  { id: "p1", name: "Coke 1.5L",        sku: "BEV-001", category: "Beverages",       supplierId: "s1", cost: 48, price: 65, stock: 45, reserved: 5, damaged: 2, reorderLevel: 20, unit: "bottle",  variants: [] },
  { id: "p2", name: "Lay's Chips",       sku: "SNK-001", category: "Snacks",           supplierId: "s2", cost: 25, price: 35, stock: 12, reserved: 0, damaged: 1, reorderLevel: 15, unit: "pack",    variants: [{ name: "Flavor",   options: ["Original", "BBQ", "Cheese"] }] },
  { id: "p3", name: "Lucky Me Noodles",  sku: "FD-001",  category: "Canned/Dry Goods", supplierId: "s1", cost:  8, price: 14, stock:  3, reserved: 0, damaged: 0, reorderLevel: 30, unit: "pack",    variants: [{ name: "Flavor",   options: ["Beef", "Chicken", "Spicy"] }] },
  { id: "p4", name: "Tide Powder 1kg",   sku: "HH-001",  category: "Household",        supplierId: "s3", cost: 52, price: 78, stock:  0, reserved: 0, damaged: 0, reorderLevel: 10, unit: "bag",     variants: [] },
  { id: "p5", name: "Palmolive Shampoo", sku: "PC-001",  category: "Personal Care",    supplierId: "s2", cost: 70, price: 98, stock: 28, reserved: 2, damaged: 0, reorderLevel: 15, unit: "bottle",  variants: [{ name: "Type",     options: ["Smooth", "Volume", "Anti-Dandruff"] }] },
  { id: "p6", name: "Eden Cheese 165g",  sku: "FD-002",  category: "Dairy",            supplierId: "s1", cost: 55, price: 75, stock: 17, reserved: 0, damaged: 1, reorderLevel: 12, unit: "pack",    variants: [] },
  { id: "p7", name: "Kopiko Coffee",     sku: "BEV-002", category: "Beverages",        supplierId: "s2", cost:  4, price:  7, stock: 88, reserved: 0, damaged: 0, reorderLevel: 50, unit: "sachet",  variants: [{ name: "Variant",  options: ["Black", "Brown", "Cappuccino"] }] },
  { id: "p8", name: "Mang Tomas Sauce",  sku: "FD-003",  category: "Condiments",       supplierId: "s3", cost: 28, price: 42, stock:  9, reserved: 0, damaged: 0, reorderLevel: 15, unit: "bottle",  variants: [] },
];

export const INITIAL_TRANSACTIONS = [
  { id: "t1", date: "2025-03-20", items: [{ productId: "p1", name: "Coke 1.5L",        qty:  3, price: 65 }, { productId: "p7", name: "Kopiko Coffee",     qty: 5, price:  7 }], subtotal: 230, tax: 27.6,  discount:  0, total: 257.6,  payment: 300, change: 42.4,  method: "cash" },
  { id: "t2", date: "2025-03-21", items: [{ productId: "p3", name: "Lucky Me Noodles", qty: 10, price: 14 }, { productId: "p6", name: "Eden Cheese 165g",  qty: 2, price: 75 }], subtotal: 290, tax: 34.8,  discount:  0, total: 324.8,  payment: 350, change: 25.2,  method: "cash" },
  { id: "t3", date: "2025-03-22", items: [{ productId: "p2", name: "Lay's Chips",      qty:  4, price: 35 }, { productId: "p5", name: "Palmolive Shampoo", qty: 1, price: 98 }], subtotal: 238, tax: 28.56, discount: 10, total: 256.56, payment: 300, change: 43.44, method: "cash" },
];

export const INITIAL_PURCHASE_ORDERS = [
  { id: "po1", date: "2025-03-18", supplierId: "s1", items: [{ productId: "p1", qty: 50, unitCost: 48 }, { productId: "p3", qty: 100, unitCost: 8 }], status: "received", total: 3200, expectedDate: "2025-03-20", receivedDate: "2025-03-20" },
  { id: "po2", date: "2025-03-21", supplierId: "s2", items: [{ productId: "p2", qty: 30, unitCost: 25 }, { productId: "p5", qty:  20, unitCost: 70 }], status: "pending",  total: 2150, expectedDate: "2025-03-25", receivedDate: null },
  { id: "po3", date: "2025-03-22", supplierId: "s3", items: [{ productId: "p4", qty: 15, unitCost: 52 }],                                               status: "transit",  total:  780, expectedDate: "2025-03-24", receivedDate: null },
];

// ─── APP CONSTANTS ─────────────────────────────────────────────────────────────

export const TAX_RATE = 0.12;

export const CATEGORIES = [
  "Beverages",
  "Snacks",
  "Canned/Dry Goods",
  "Household",
  "Personal Care",
  "Dairy",
  "Condiments",
  "Other",
];

export const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",  icon: "dashboard" },
  { id: "stock",      label: "Stock",      icon: "box" },
  { id: "pos",        label: "POS",        icon: "pos" },
  { id: "purchasing", label: "Purchasing", icon: "truck" },
  { id: "suppliers",  label: "Suppliers",  icon: "users" },
  { id: "alerts",     label: "Alerts",     icon: "bell" },   // badge injected in App
  { id: "reports",    label: "Reports",    icon: "chart" },
];
