/**
 * Module: demoData
 * 
 * Handles logic and operations for demoData.
 */

function createProductImage(label, accent, subLabel) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fffaf0" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" rx="36" fill="url(#g)" />
      <circle cx="500" cy="120" r="84" fill="rgba(255,255,255,0.35)" />
      <circle cx="160" cy="390" r="96" fill="rgba(15,23,42,0.08)" />
      <rect x="60" y="72" width="520" height="336" rx="28" fill="rgba(255,255,255,0.72)" />
      <text x="84" y="194" fill="#0f172a" font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="700">${label}</text>
      <text x="84" y="248" fill="#334155" font-family="Segoe UI, Arial, sans-serif" font-size="28">${subLabel}</text>
      <text x="84" y="328" fill="#475569" font-family="Consolas, monospace" font-size="22">Tap product image to add into the bill</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const demoUsers = [
  {
    name: 'Super Admin',
    username: 'superadmin',
    password: 'superadmin123',
    role: 'super_admin',
    branch: 'Global Operations',
  },
  {
    name: 'Store Admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    branch: 'Main Warehouse',
  },
  {
    name: 'Front Cashier',
    username: 'cashier',
    password: 'cashier123',
    role: 'cashier',
    branch: 'Counter 01',
  },
];

const demoProducts = [
  {
    name: 'Arabica Coffee Beans',
    sku: 'INV-COF-001',
    barcode: '8901000001111',
    category: 'Beverages',
    description: '1 kg premium roasted beans for cafe and retail packs.',
    unit: 'pack',
    price: 18.5,
    costPrice: 12.2,
    loyaltyDiscount: 1.5,
    quantityInStock: 34,
    reorderLevel: 12,
    rack: { rowNumber: 1, columnNumber: 2, shelfNumber: 1 },
    image: createProductImage('Arabica', '#d6a678', 'Roasted coffee beans'),
  },
  {
    name: 'Green Tea Box',
    sku: 'INV-TEA-002',
    barcode: '8901000002222',
    category: 'Beverages',
    description: '25 bag herbal green tea box.',
    unit: 'box',
    price: 7.9,
    costPrice: 4.8,
    loyaltyDiscount: 0.5,
    quantityInStock: 58,
    reorderLevel: 15,
    rack: { rowNumber: 1, columnNumber: 5, shelfNumber: 2 },
    image: createProductImage('Green Tea', '#9ad97f', 'Herbal tea box'),
  },
  {
    name: 'Dark Chocolate Bar',
    sku: 'INV-SNK-003',
    barcode: '8901000003333',
    category: 'Snacks',
    description: '70% cocoa dark chocolate.',
    unit: 'bar',
    price: 3.75,
    costPrice: 1.9,
    loyaltyDiscount: 0.25,
    quantityInStock: 16,
    reorderLevel: 10,
    rack: { rowNumber: 2, columnNumber: 1, shelfNumber: 1 },
    image: createProductImage('Chocolate', '#8b5e3c', 'Dark cocoa bar'),
  },
  {
    name: 'Organic Honey Jar',
    sku: 'INV-GRC-004',
    barcode: '8901000004444',
    category: 'Groceries',
    description: '500 ml farm sourced organic honey.',
    unit: 'jar',
    price: 11.25,
    costPrice: 6.4,
    quantityInStock: 9,
    reorderLevel: 10,
    rack: { rowNumber: 2, columnNumber: 4, shelfNumber: 2 },
    image: createProductImage('Honey', '#f5c76f', 'Organic honey jar'),
  },
  {
    name: 'Mineral Water 1.5L',
    sku: 'INV-BEV-005',
    barcode: '8901000005555',
    category: 'Beverages',
    description: 'Purified mineral water bottle.',
    unit: 'bottle',
    price: 1.95,
    costPrice: 0.8,
    quantityInStock: 95,
    reorderLevel: 24,
    rack: { rowNumber: 3, columnNumber: 1, shelfNumber: 1 },
    image: createProductImage('Water', '#7dc7f7', 'Mineral water bottle'),
  },
  {
    name: 'Rice Flour 2 kg',
    sku: 'INV-GRC-006',
    barcode: '8901000006666',
    category: 'Groceries',
    description: 'Fine rice flour for bakery and home use.',
    unit: 'bag',
    price: 6.5,
    costPrice: 3.7,
    quantityInStock: 21,
    reorderLevel: 8,
    rack: { rowNumber: 3, columnNumber: 3, shelfNumber: 3 },
    image: createProductImage('Rice Flour', '#efe2c4', '2 kg baking bag'),
  },
  {
    name: 'Hand Wash Refill',
    sku: 'INV-HOM-007',
    barcode: '8901000007777',
    category: 'Home Care',
    description: '750 ml antibacterial refill pouch.',
    unit: 'pouch',
    price: 5.2,
    costPrice: 2.85,
    quantityInStock: 13,
    reorderLevel: 10,
    rack: { rowNumber: 4, columnNumber: 2, shelfNumber: 1 },
    image: createProductImage('Hand Wash', '#8fd6ca', 'Refill pouch'),
  },
  {
    name: 'Notebook A5 Ruled',
    sku: 'INV-STA-008',
    barcode: '8901000008888',
    category: 'Stationery',
    description: '120 page A5 ruled notebook.',
    unit: 'piece',
    price: 2.85,
    costPrice: 1.25,
    quantityInStock: 42,
    reorderLevel: 18,
    rack: { rowNumber: 4, columnNumber: 5, shelfNumber: 2 },
    image: createProductImage('Notebook', '#9ba6ff', 'A5 ruled notebook'),
  },
];

function buildDemoSales(products, users) {
  const admin = users.find((user) => user.role === 'admin');
  const cashier = users.find((user) => user.role === 'cashier');

  const mapByBarcode = new Map(products.map((product) => [product.barcode, product]));

  const saleBlueprints = [
    {
      invoiceNumber: 'INV-20260428-1001',
      customerName: 'Walk-in customer',
      paymentMethod: 'cash',
      discount: 1.5,
      tax: 0,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      cashier: cashier,
      items: [
        { barcode: '8901000001111', quantity: 1 },
        { barcode: '8901000003333', quantity: 2 },
      ],
    },
    {
      invoiceNumber: 'INV-20260427-1002',
      customerName: 'Office Pantry',
      paymentMethod: 'card',
      discount: 0,
      tax: 0,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      cashier: cashier,
      items: [
        { barcode: '8901000002222', quantity: 3 },
        { barcode: '8901000005555', quantity: 4 },
      ],
    },
    {
      invoiceNumber: 'INV-20260424-1003',
      customerName: 'Home order',
      paymentMethod: 'upi',
      discount: 0.75,
      tax: 0,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      cashier: cashier,
      items: [
        { barcode: '8901000006666', quantity: 2 },
        { barcode: '8901000004444', quantity: 1 },
      ],
    },
    {
      invoiceNumber: 'INV-20260415-1004',
      customerName: 'Cafe bulk desk',
      paymentMethod: 'bank-transfer',
      discount: 3.4,
      tax: 0,
      createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      cashier: admin,
      items: [
        { barcode: '8901000001111', quantity: 4 },
        { barcode: '8901000002222', quantity: 6 },
      ],
    },
    {
      invoiceNumber: 'INV-20260311-1005',
      customerName: 'School supply order',
      paymentMethod: 'card',
      discount: 2.2,
      tax: 0,
      createdAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
      cashier: cashier,
      items: [
        { barcode: '8901000008888', quantity: 8 },
        { barcode: '8901000007777', quantity: 3 },
      ],
    },
    {
      invoiceNumber: 'INV-20251120-1006',
      customerName: 'Festival shelf refill',
      paymentMethod: 'cash',
      discount: 0,
      tax: 0,
      createdAt: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000),
      cashier: admin,
      items: [
        { barcode: '8901000004444', quantity: 6 },
        { barcode: '8901000003333', quantity: 10 },
        { barcode: '8901000006666', quantity: 5 },
      ],
    },
  ];

  return saleBlueprints.map((blueprint, index) => {
    const items = blueprint.items.map((item) => {
      const product = mapByBarcode.get(item.barcode);
      const lineTotal = Number((product.price * item.quantity).toFixed(2));

      return {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        price: product.price,
        originalPrice: product.price,
        loyaltyDiscount: 0,
        quantity: item.quantity,
        rack: product.rack,
        image: product.image,
        lineTotal,
      };
    });

    const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const total = Number((subtotal - blueprint.discount).toFixed(2));

    return {
      invoiceNumber: blueprint.invoiceNumber,
      customerName: blueprint.customerName,
      paymentMethod: blueprint.paymentMethod,
      discount: blueprint.discount,
      tax: 0,
      subtotal,
      total,
      items,
      cashier: {
        userId: blueprint.cashier._id,
        name: blueprint.cashier.name,
        username: blueprint.cashier.username,
      },
      notes: 'Auto-seeded demo sale',
      createdAt: blueprint.createdAt.toISOString(),
      updatedAt: blueprint.createdAt.toISOString(),
    };
  });
}

module.exports = {
  buildDemoSales,
  demoProducts,
  demoUsers,
};
