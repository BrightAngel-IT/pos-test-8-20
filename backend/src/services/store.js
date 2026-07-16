const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { isDatabaseReady } = require('../config/database');
const { buildDemoSales, demoProducts, demoUsers } = require('../data/demoData');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const User = require('../models/User');
const CustomerInvoice = require('../models/CustomerInvoice');
const SupplierInvoice = require('../models/SupplierInvoice');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Return = require('../models/Return');
const Branch = require('../models/Branch');
const BranchStock = require('../models/BranchStock');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Company = require('../models/Company');

const memoryStore = {
  ready: false,
  users: [],
  products: [],
  sales: [],
  returns: [],
  purchases: [],
  branches: [],
  branchStocks: [],
  company: {
    name: 'Inventory System',
    tagline: 'Excellence in Management',
    address: '',
    phone: '',
    email: '',
    logo: '',
  },
};

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function generateId() {
  return new mongoose.Types.ObjectId().toString();
}

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function formatCurrencyAmount(value) {
  return Number((value || 0).toFixed(2));
}

function sanitizeUser(user) {
  return {
    _id: String(user._id),
    name: user.name,
    username: user.username,
    role: user.role,
    branch: user.branch,
  };
}

function makeInvoiceNumber() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ];
  const suffix = String(Date.now()).slice(-4);
  return `C-INV-${parts.join('')}-${suffix}`;
}

async function generateInvoiceNumber() {
  if (isDatabaseReady()) {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({
        name: 'Inventory System',
        tagline: 'Excellence in Management',
        nextInvoiceNumber: 1000,
        invoicePrefix: 'C-INV-',
      });
    }
    const prefix = company.invoicePrefix || 'C-INV-';
    const nextNum = company.nextInvoiceNumber || 1000;

    // Increment nextInvoiceNumber in DB
    await Company.updateOne({}, { $inc: { nextInvoiceNumber: 1 } });

    return `${prefix}${nextNum}`;
  } else {
    const prefix = memoryStore.company.invoicePrefix || 'C-INV-';
    const nextNum = memoryStore.company.nextInvoiceNumber || 1000;
    memoryStore.company.nextInvoiceNumber = nextNum + 1;
    return `${prefix}${nextNum}`;
  }
}

function getRackLabel(rack) {
  return `R${rack.rowNumber}-C${rack.columnNumber}-S${rack.shelfNumber}`;
}

function sameDay(dateA, dateB) {
  const left = new Date(dateA);
  const right = new Date(dateB);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function startOfWeek(date) {
  const clone = new Date(date);
  const day = (clone.getDay() + 6) % 7;
  clone.setDate(clone.getDate() - day);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function startOfMonth(date) {
  const clone = new Date(date);
  clone.setDate(1);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function startOfYear(date) {
  const clone = new Date(date);
  clone.setMonth(0, 1);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

async function prepareSeedUsers() {
  const prepared = [];

  for (const user of demoUsers) {
    prepared.push({
      _id: generateId(),
      name: user.name,
      username: user.username.toLowerCase(),
      passwordHash: await bcrypt.hash(user.password, 10),
      role: user.role,
      branch: user.branch,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return prepared;
}

function prepareSeedProducts() {
  return demoProducts.map((product) => ({
    _id: generateId(),
    ...clonePlain(product),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

async function seedMemoryStore() {
  if (memoryStore.ready) {
    return;
  }

  const users = await prepareSeedUsers();
  const products = prepareSeedProducts();
  const sales = buildDemoSales(products, users).map((sale) => ({
    _id: generateId(),
    ...sale,
  }));

  memoryStore.users = users;
  memoryStore.products = products;
  memoryStore.sales = sales;

  // Initialize branches
  memoryStore.branches = [
    {
      _id: generateId(),
      name: 'Main Warehouse',
      location: 'Colombo 06',
      phone: '+94 11 234 5678',
      email: 'main@inventory.com',
      manager: 'Store Admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: generateId(),
      name: 'Counter 01',
      location: 'Colombo 06',
      phone: '+94 11 234 5679',
      email: 'counter01@inventory.com',
      manager: 'Front Cashier',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Initialize branch stocks
  memoryStore.branchStocks = [];
  products.forEach(p => {
    memoryStore.branchStocks.push({
      _id: generateId(),
      branch: 'Main Warehouse',
      productId: String(p._id),
      quantityInStock: Number(p.quantityInStock),
      reorderLevel: Number(p.reorderLevel),
      rack: p.rack,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    memoryStore.branchStocks.push({
      _id: generateId(),
      branch: 'Counter 01',
      productId: String(p._id),
      quantityInStock: Math.max(0, Math.floor(Number(p.quantityInStock) / 2)),
      reorderLevel: Number(p.reorderLevel),
      rack: p.rack,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  memoryStore.ready = true;
}

async function seedDatabase() {
  const [userCount, productCount, saleCount] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Sale.countDocuments(),
  ]);

  if (userCount === 0) {
    const users = await prepareSeedUsers();
    await User.insertMany(users);
  }

  if (productCount === 0) {
    const products = prepareSeedProducts();
    await Product.insertMany(products);
  }

  if (saleCount === 0) {
    const [users, products] = await Promise.all([User.find().lean(), Product.find().lean()]);
    const sales = buildDemoSales(products, users);
    await Sale.insertMany(sales);
  }

  const branchCount = await Branch.countDocuments();
  if (branchCount === 0) {
    const branches = [
      {
        name: 'Main Warehouse',
        location: 'Colombo 06',
        phone: '+94 11 234 5678',
        email: 'main@inventory.com',
        manager: 'Store Admin',
        status: 'active',
      },
      {
        name: 'Counter 01',
        location: 'Colombo 06',
        phone: '+94 11 234 5679',
        email: 'counter01@inventory.com',
        manager: 'Front Cashier',
        status: 'active',
      }
    ];
    await Branch.insertMany(branches);
  }

  const branchStockCount = await BranchStock.countDocuments();
  if (branchStockCount === 0) {
    const allProducts = await Product.find().lean();
    const branchStocks = [];
    allProducts.forEach(p => {
      branchStocks.push({
        branch: 'Main Warehouse',
        productId: p._id,
        quantityInStock: p.quantityInStock,
        reorderLevel: p.reorderLevel,
        rack: p.rack,
      });
      branchStocks.push({
        branch: 'Counter 01',
        productId: p._id,
        quantityInStock: Math.max(0, Math.floor(p.quantityInStock / 2)),
        reorderLevel: p.reorderLevel,
        rack: p.rack,
      });
    });
    if (branchStocks.length > 0) {
      await BranchStock.insertMany(branchStocks);
    }
  }
}

async function initializeStore() {
  if (isDatabaseReady()) {
    await seedDatabase();
    memoryStore.users = await User.find().lean();
    return;
  }

  await seedMemoryStore();
}

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.username,
    },
    process.env.JWT_SECRET || 'inventory-demo-secret',
    { expiresIn: '12h' },
  );
}

async function loginUser(username, password) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const user = await findUserByUsername(normalizedUsername);

  if (!user) {
    throw createError('Invalid username or password.', 401);
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    throw createError('Invalid username or password.', 401);
  }

  const sanitizedUser = sanitizeUser(user);

  return {
    token: signToken(sanitizedUser),
    user: sanitizedUser,
  };
}

async function findUserByUsername(username) {
  if (isDatabaseReady()) {
    return User.findOne({ username }).lean();
  }

  return memoryStore.users.find((user) => user.username === username) || null;
}

async function getUserById(id) {
  if (isDatabaseReady()) {
    try {
      const user = await User.findById(id).lean();
      return user ? sanitizeUser(user) : null;
    } catch (err) {
      return null; // invalid ID format or error
    }
  }
  const user = memoryStore.users.find((item) => String(item._id) === String(id));
  return user ? sanitizeUser(user) : null;
}

async function getAllUsersForLookup() {
  if (isDatabaseReady()) {
    const users = await User.find().lean();
    memoryStore.users = users;
    return users;
  }

  return memoryStore.users;
}

async function getAllProducts() {
  if (isDatabaseReady()) {
    const products = await Product.find().sort({ name: 1 }).lean();
    return products.map((product) => ({
      ...product,
      _id: String(product._id),
    }));
  }

  return clonePlain(memoryStore.products).sort((left, right) => left.name.localeCompare(right.name));
}

async function getAllSales() {
  if (isDatabaseReady()) {
    const sales = await Sale.find().sort({ createdAt: -1 }).lean();

    // Fetch related invoices to get actual balances
    const invoiceNos = sales.map(s => s.invoiceNumber);
    const invoices = await CustomerInvoice.find({ invoiceNo: { $in: invoiceNos } }).lean();
    const invoiceMap = new Map(invoices.map(i => [i.invoiceNo, i]));

    return sales.map((sale) => {
      const inv = invoiceMap.get(sale.invoiceNumber);
      return {
        ...sale,
        _id: String(sale._id),
        balanceAmount: inv ? inv.balanceAmount : (sale.paymentMethod === 'credit' ? sale.total : 0),
        status: inv ? inv.status : (sale.paymentMethod === 'credit' ? 'UNPAID' : 'PAID'),
        items: sale.items.map((item) => ({
          ...item,
          productId: String(item.productId),
        })),
      };
    });
  }

  return clonePlain(memoryStore.sales).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

async function getProducts(filters = {}) {
  const products = await getAllProducts();
  const branchName = filters.branch;

  let branchStocks = [];
  if (isDatabaseReady()) {
    if (branchName) {
      const normalizedBranch = String(branchName).toLowerCase();
      const isMain = ['main branch', 'main warehouse', 'main'].includes(normalizedBranch);
      const branchQuery = isMain
        ? { branch: { $regex: /^(main branch|main warehouse|main)$/i } }
        : { branch: branchName };
      branchStocks = await BranchStock.find(branchQuery).lean();
    } else {
      branchStocks = await BranchStock.find().lean();
    }
  } else {
    if (branchName) {
      const normalizedBranch = String(branchName).toLowerCase();
      const isMain = ['main branch', 'main warehouse', 'main'].includes(normalizedBranch);
      if (isMain) {
        branchStocks = memoryStore.branchStocks.filter(bs => {
          const bsNorm = String(bs.branch).toLowerCase();
          return ['main branch', 'main warehouse', 'main'].includes(bsNorm);
        });
      } else {
        branchStocks = memoryStore.branchStocks.filter(bs => bs.branch === branchName);
      }
    } else {
      branchStocks = memoryStore.branchStocks;
    }
  }

  const stockMap = new Map();
  branchStocks.forEach(bs => {
    const prodId = String(bs.productId);
    if (!stockMap.has(prodId)) {
      stockMap.set(prodId, { quantityInStock: 0, reorderLevel: bs.reorderLevel, rack: bs.rack, count: 0 });
    }
    const entry = stockMap.get(prodId);
    if (branchName) {
      entry.quantityInStock += Number(bs.quantityInStock);
      entry.reorderLevel = bs.reorderLevel;
      entry.rack = bs.rack;
    } else {
      entry.quantityInStock += Number(bs.quantityInStock);
      if (entry.count === 0) {
        entry.reorderLevel = bs.reorderLevel;
        entry.rack = bs.rack;
      }
      entry.count++;
    }
  });

  return products
    .map((product) => {
      const stock = stockMap.get(String(product._id));
      const finalQuantity = stock ? stock.quantityInStock : 0;
      const finalReorder = stock ? stock.reorderLevel : product.reorderLevel;
      const finalRack = stock ? stock.rack : product.rack;
      return {
        ...product,
        quantityInStock: finalQuantity,
        reorderLevel: finalReorder,
        rack: finalRack,
        rackLabel: getRackLabel(finalRack),
      };
    })
    .filter((product) => {
      const matchesQuery = filters.query
        ? `${product.name} ${product.sku} ${product.barcode}`
          .toLowerCase()
          .includes(String(filters.query).toLowerCase())
        : true;
      const matchesCategory = filters.category
        ? product.category.toLowerCase() === String(filters.category).toLowerCase()
        : true;
      const matchesStock = filters.lowStockOnly
        ? Number(product.quantityInStock) <= Number(product.reorderLevel)
        : true;

      return matchesQuery && matchesCategory && matchesStock;
    });
}

async function saveProduct(payload) {
  const productData = {
    name: String(payload.name || '').trim(),
    sku: String(payload.sku || '').trim(),
    barcode: String(payload.barcode || '').trim(),
    category: String(payload.category || '').trim(),
    description: String(payload.description || '').trim(),
    unit: String(payload.unit || 'pcs').trim(),
    price: Number(payload.price || 0),
    costPrice: Number(payload.costPrice || 0),
    loyaltyDiscount: Number(payload.loyaltyDiscount || 0),
    quantityInStock: Number(payload.quantityInStock || 0),
    reorderLevel: Number(payload.reorderLevel || 0),
    rack: {
      rowNumber: Number(payload.rack?.rowNumber || 1),
      columnNumber: Number(payload.rack?.columnNumber || 1),
      shelfNumber: Number(payload.rack?.shelfNumber || 1),
    },
    image: String(payload.image || '').trim(),
  };

  if (!productData.name || !productData.sku || !productData.barcode || !productData.category) {
    throw createError('Name, SKU, barcode, and category are required.');
  }

  if (!productData.image) {
    productData.image =
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" rx="40" fill="#dbeafe"/><text x="72" y="220" font-size="54" font-family="Segoe UI, Arial, sans-serif" fill="#0f172a">${productData.name}</text><text x="72" y="286" font-size="26" font-family="Segoe UI, Arial, sans-serif" fill="#475569">${productData.category}</text></svg>`,
      );
  }

  if (isDatabaseReady()) {
    let product;
    if (payload._id) {
      product = await Product.findByIdAndUpdate(payload._id, productData, {
        new: true,
        runValidators: true,
      }).lean();

      if (!product) {
        throw createError('Product not found.', 404);
      }
    } else {
      product = await Product.create(productData);
      product = product.toObject();
    }

    const branchName = payload.branch;
    if (branchName) {
      await BranchStock.findOneAndUpdate(
        { branch: branchName, productId: product._id },
        {
          quantityInStock: Number(payload.quantityInStock || 0),
          reorderLevel: Number(payload.reorderLevel || 0),
          rack: productData.rack
        },
        { upsert: true, new: true }
      );
    }

    if (!payload._id) {
      const branches = await Branch.find().lean();
      for (const b of branches) {
        if (b.name !== branchName) {
          await BranchStock.create({
            branch: b.name,
            productId: product._id,
            quantityInStock: 0,
            reorderLevel: productData.reorderLevel,
            rack: productData.rack,
          });
        }
      }
    }

    let finalQty = product.quantityInStock;
    let finalReorder = product.reorderLevel;
    let finalRack = product.rack;

    if (branchName) {
      const bs = await BranchStock.findOne({ branch: branchName, productId: product._id }).lean();
      if (bs) {
        finalQty = bs.quantityInStock;
        finalReorder = bs.reorderLevel;
        finalRack = bs.rack;
      }
    }

    return {
      ...product,
      _id: String(product._id),
      quantityInStock: finalQty,
      reorderLevel: finalReorder,
      rack: finalRack,
      rackLabel: getRackLabel(finalRack)
    };
  }

  let product;
  if (payload._id) {
    const index = memoryStore.products.findIndex((p) => String(p._id) === String(payload._id));
    if (index < 0) {
      throw createError('Product not found.', 404);
    }

    memoryStore.products[index] = {
      ...memoryStore.products[index],
      ...productData,
      updatedAt: new Date().toISOString(),
    };
    product = memoryStore.products[index];
  } else {
    product = {
      _id: generateId(),
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.products.push(product);

    memoryStore.branches.forEach(b => {
      if (b.name !== payload.branch) {
        memoryStore.branchStocks.push({
          _id: generateId(),
          branch: b.name,
          productId: String(product._id),
          quantityInStock: 0,
          reorderLevel: product.reorderLevel,
          rack: product.rack,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }

  if (payload.branch) {
    let bs = memoryStore.branchStocks.find(b => b.branch === payload.branch && String(b.productId) === String(product._id));
    if (!bs) {
      bs = {
        _id: generateId(),
        branch: payload.branch,
        productId: String(product._id),
        createdAt: new Date().toISOString(),
      };
      memoryStore.branchStocks.push(bs);
    }
    bs.quantityInStock = Number(payload.quantityInStock || 0);
    bs.reorderLevel = Number(payload.reorderLevel || 0);
    bs.rack = productData.rack;
    bs.updatedAt = new Date().toISOString();
  }

  let finalQty = product.quantityInStock;
  let finalReorder = product.reorderLevel;
  let finalRack = product.rack;

  if (payload.branch) {
    const bs = memoryStore.branchStocks.find(b => b.branch === payload.branch && String(b.productId) === String(product._id));
    if (bs) {
      finalQty = bs.quantityInStock;
      finalReorder = bs.reorderLevel;
      finalRack = bs.rack;
    }
  }

  return {
    ...clonePlain(product),
    quantityInStock: finalQty,
    reorderLevel: finalReorder,
    rack: finalRack,
    rackLabel: getRackLabel(finalRack),
  };
}

async function deleteProduct(productId) {
  if (isDatabaseReady()) {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      throw createError('Product not found.', 404);
    }
    await BranchStock.deleteMany({ productId });
    return { success: true };
  }

  const index = memoryStore.products.findIndex((p) => String(p._id) === String(productId));
  if (index < 0) {
    throw createError('Product not found.', 404);
  }

  memoryStore.products.splice(index, 1);
  memoryStore.branchStocks = memoryStore.branchStocks.filter((bs) => String(bs.productId) !== String(productId));
  return { success: true };
}

async function createSale(payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (items.length === 0) {
    throw createError('Add at least one item before checking out.');
  }

  const branchName = payload.cashier?.branch || 'Main Branch';
  const products = await getProducts({ branch: branchName });
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const saleItems = items.map((item) => {
    const product = productMap.get(String(item.productId));

    if (!product) {
      throw createError('One of the selected products was not found.', 404);
    }

    const quantity = Number(item.quantity || 0);

    if (quantity <= 0) {
      throw createError(`Quantity must be greater than zero for ${product.name}.`);
    }

    if (quantity > Number(product.quantityInStock)) {
      throw createError(`Not enough stock for ${product.name}.`);
    }

    const isLoyalty = !!payload.loyaltyCard;
    const regularPrice = Number(product.price || 0);
    const memberPriceInDb = Number(product.loyaltyDiscount || regularPrice);

    // POS Page Logic: Loyalty Price is the value in DB (interpreted as member price)
    const effectivePrice = isLoyalty
      ? Math.max(0, Math.min(regularPrice, memberPriceInDb))
      : regularPrice;

    const lineTotal = formatCurrencyAmount(effectivePrice * quantity);

    return {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: effectivePrice, // The actual selling price
      originalPrice: regularPrice, // The base price
      loyaltyDiscount: isLoyalty ? Math.max(0, regularPrice - effectivePrice) : 0,
      quantity,
      lineTotal,
      image: product.image,
      rack: product.rack,
    };
  });

  const subtotal = formatCurrencyAmount(
    saleItems.reduce((sum, item) => sum + item.lineTotal, 0),
  );
  const discount = formatCurrencyAmount(Number(payload.discount || 0));
  const tax = 0;
  const total = formatCurrencyAmount(subtotal - discount);
  const invoiceNumber = await generateInvoiceNumber();
  const salePayload = {
    invoiceNumber,
    customerName: String(payload.customerName || 'Walk-in customer').trim(),
    loyaltyCard: String(payload.loyaltyCard || '').trim(),
    paymentMethod: ['cash', 'card', 'credit', 'split'].includes(payload.paymentMethod)
      ? payload.paymentMethod
      : 'cash',
    splitPayments: payload.splitPayments || undefined,
    discount,
    tax,
    subtotal,
    total,
    customerId: payload.customerId || undefined, // Optional customer link
    items: saleItems,
    branch: branchName,
    cashier: {
      userId: payload.cashier._id,
      name: payload.cashier.name,
      username: payload.cashier.username,
    },
    notes: String(payload.notes || '').trim(),
  };

  if (isDatabaseReady()) {
    const sale = await Sale.create(salePayload);

    for (const item of saleItems) {
      await BranchStock.findOneAndUpdate(
        { branch: branchName, productId: item.productId },
        { $inc: { quantityInStock: -item.quantity } }
      );
    }

    // Create Invoice if Credit or has Credit component in split
    let creditAmount = 0;
    if (salePayload.paymentMethod === 'credit') {
      creditAmount = salePayload.total;
    } else if (salePayload.paymentMethod === 'split' && salePayload.splitPayments) {
      const creditPart = salePayload.splitPayments.find(p => p.method === 'credit');
      if (creditPart) {
        creditAmount = Number(creditPart.amount || 0);
      }
    }

    if (creditAmount > 0 && salePayload.customerId) {
      await CustomerInvoice.create({
        invoiceNo: salePayload.invoiceNumber,
        customerId: salePayload.customerId,
        date: new Date(),
        totalAmount: creditAmount,
        balanceAmount: creditAmount,
        status: 'UNPAID'
      });
    }

    const plainSale = sale.toObject();
    return {
      ...plainSale,
      _id: String(plainSale._id),
      items: plainSale.items.map((item) => ({
        ...item,
        productId: String(item.productId),
      })),
    };
  }

  saleItems.forEach((item) => {
    let bs = memoryStore.branchStocks.find((entry) => entry.branch === branchName && String(entry.productId) === String(item.productId));
    if (bs) {
      bs.quantityInStock -= item.quantity;
      bs.updatedAt = new Date().toISOString();
    }
  });

  const sale = {
    _id: generateId(),
    ...salePayload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.sales.unshift(sale);

  return clonePlain(sale);
}

async function createReturn(payload) {
  const { type, entityId, referenceNo, items, refundMethod, reason, processedBy, branch } = payload;

  if (!items || items.length === 0) {
    throw createError('At least one item must be returned.');
  }

  const user = await getUserById(processedBy);
  const branchName = branch || user?.branch || 'Main Branch';

  // 1. Verify and Process Stock, and calculate item totals
  const processedItems = [];
  for (const item of items) {
    let product;
    if (isDatabaseReady()) {
      product = await Product.findById(item.productId);
    } else {
      product = memoryStore.products.find(p => String(p._id) === String(item.productId));
    }
    if (!product) throw createError(`Product not found: ${item.name}`, 404);

    const qtyChange = type === 'customer' ? item.quantity : -item.quantity;

    if (isDatabaseReady()) {
      await BranchStock.findOneAndUpdate(
        { branch: branchName, productId: item.productId },
        { $inc: { quantityInStock: qtyChange } },
        { upsert: true }
      );
    } else {
      let bs = memoryStore.branchStocks.find((entry) => entry.branch === branchName && String(entry.productId) === String(item.productId));
      if (bs) {
        bs.quantityInStock = Math.max(0, bs.quantityInStock + qtyChange);
        bs.updatedAt = new Date().toISOString();
      }
    }

    processedItems.push({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice
    });
  }

  // 2. Calculate Total
  const totalAmount = processedItems.reduce((sum, item) => sum + item.total, 0);

  // 3. Update Financials
  if (type === 'customer') {
    if (entityId) {
      if (isDatabaseReady()) {
        const customer = await Customer.findById(entityId);
        if (customer && refundMethod === 'credit-note') {
          await Customer.findByIdAndUpdate(entityId, { $inc: { balance: -totalAmount } });

          if (referenceNo) {
            const inv = await CustomerInvoice.findOne({ invoiceNo: referenceNo, customerId: entityId });
            if (inv) {
              const nextBalance = Math.max(0, inv.balanceAmount - totalAmount);
              const status = nextBalance === 0 ? 'PAID' : 'PARTIAL';
              await CustomerInvoice.findByIdAndUpdate(inv._id, {
                balanceAmount: nextBalance,
                status: status
              });
            }
          }
        }
      }
    }
  } else {
    if (entityId) {
      if (isDatabaseReady()) {
        const supplier = await Supplier.findById(entityId);
        if (supplier && refundMethod === 'credit-note') {
          await Supplier.findByIdAndUpdate(entityId, { $inc: { balance: -totalAmount } });

          if (referenceNo) {
            const inv = await SupplierInvoice.findOne({ invoiceNo: referenceNo, supplierId: entityId });
            if (inv) {
              const nextBalance = Math.max(0, inv.balanceAmount - totalAmount);
              const status = nextBalance === 0 ? 'PAID' : 'PARTIAL';
              await SupplierInvoice.findByIdAndUpdate(inv._id, {
                balanceAmount: nextBalance,
                status: status
              });
            }
          }
        }
      }
    }
  }

  // 4. Create Return Document
  const returnNo = `RET-${Date.now().toString().slice(-6)}`;
  const returnPayload = {
    returnNo,
    type,
    entityId: entityId || null,
    entityName: payload.entityName || (type === 'customer' ? 'Walk-in customer' : 'Default Supplier'),
    referenceNo,
    items: processedItems,
    totalAmount,
    reason,
    refundMethod,
    branch: branchName,
    processedBy
  };

  if (isDatabaseReady()) {
    return Return.create(returnPayload);
  }

  const returnDoc = {
    _id: generateId(),
    ...returnPayload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.returns.unshift(returnDoc);
  return clonePlain(returnDoc);
}

async function getReturns(filters = {}) {
  const branchFilter = filters.branch;
  if (isDatabaseReady()) {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.entityId) query.entityId = filters.entityId;
    if (branchFilter) query.branch = branchFilter;

    return Return.find(query).sort({ createdAt: -1 }).lean();
  }

  let list = memoryStore.returns;
  if (branchFilter) {
    list = list.filter(r => r.branch === branchFilter);
  }
  if (filters.type) {
    list = list.filter(r => r.type === filters.type);
  }
  if (filters.entityId) {
    list = list.filter(r => String(r.entityId) === String(filters.entityId));
  }

  return clonePlain(list).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

async function getRecentSales(limit = 8) {
  const sales = await getAllSales();
  return sales.slice(0, limit);
}

function createTrend(range, sales) {
  const now = new Date();
  const buckets = [];

  if (range === 'daily') {
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index);
      date.setHours(0, 0, 0, 0);
      buckets.push({
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: 0,
        orders: 0,
      });
    }
  } else if (range === 'weekly') {
    for (let index = 7; index >= 0; index -= 1) {
      const date = startOfWeek(now);
      date.setDate(date.getDate() - index * 7);
      buckets.push({
        key: date.toISOString().slice(0, 10),
        label: `W${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}`,
        revenue: 0,
        orders: 0,
      });
    }
  } else if (range === 'monthly') {
    for (let index = 11; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      buckets.push({
        key: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: 0,
        orders: 0,
      });
    }
  } else {
    for (let index = 4; index >= 0; index -= 1) {
      const year = now.getFullYear() - index;
      buckets.push({
        key: String(year),
        label: String(year),
        revenue: 0,
        orders: 0,
      });
    }
  }

  const map = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  sales.forEach((sale) => {
    const saleDate = new Date(sale.createdAt);
    let key = '';

    if (range === 'daily') {
      key = saleDate.toISOString().slice(0, 10);
    } else if (range === 'weekly') {
      key = startOfWeek(saleDate).toISOString().slice(0, 10);
    } else if (range === 'monthly') {
      key = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
    } else {
      key = String(saleDate.getFullYear());
    }

    const bucket = map.get(key);
    if (bucket) {
      bucket.revenue = formatCurrencyAmount(bucket.revenue + Number(sale.total));
      bucket.orders += 1;
    }
  });

  return buckets;
}

function getRangeStart(range) {
  const now = new Date();

  if (range === 'daily') {
    const date = new Date(now);
    date.setDate(now.getDate() - 6);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  if (range === 'weekly') {
    const date = startOfWeek(now);
    date.setDate(date.getDate() - 7 * 7);
    return date;
  }

  if (range === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth() - 11, 1);
  }

  return new Date(now.getFullYear() - 4, 0, 1);
}

async function getSalesReport(range = 'weekly', branchFilter = null) {
  const sales = await getAllSales();
  const products = await getAllProducts();
  const productSalesMap = new Map();
  const validRange = ['daily', 'weekly', 'monthly', 'annual'].includes(range) ? range : 'weekly';
  const rangeStart = getRangeStart(validRange);
  let filteredSales = sales.filter((sale) => new Date(sale.createdAt) >= rangeStart);
  if (branchFilter) {
    const isMain = ['main branch', 'main warehouse', 'main'].includes(String(branchFilter).toLowerCase());
    filteredSales = filteredSales.filter((sale) => {
      if (isMain) {
        return ['main branch', 'main warehouse', 'main'].includes(String(sale.branch).toLowerCase());
      }
      return sale.branch === branchFilter;
    });
  }
  const totalRevenue = formatCurrencyAmount(
    filteredSales.reduce((sum, sale) => sum + Number(sale.total), 0),
  );
  const totalOrders = filteredSales.length;
  const unitsSold = filteredSales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0),
    0,
  );

  const paymentBreakdownMap = new Map();
  const categoryBreakdownMap = new Map();

  filteredSales.forEach((sale) => {
    if (sale.paymentMethod === 'split' && sale.splitPayments && sale.splitPayments.length > 0) {
      sale.splitPayments.forEach((p) => {
        paymentBreakdownMap.set(
          p.method,
          formatCurrencyAmount((paymentBreakdownMap.get(p.method) || 0) + Number(p.amount)),
        );
      });
    } else {
      paymentBreakdownMap.set(
        sale.paymentMethod,
        formatCurrencyAmount((paymentBreakdownMap.get(sale.paymentMethod) || 0) + Number(sale.total)),
      );
    }

    sale.items.forEach((item) => {
      const product = products.find((entry) => String(entry._id) === String(item.productId));
      const category = product?.category || 'Uncategorized';
      categoryBreakdownMap.set(
        category,
        formatCurrencyAmount((categoryBreakdownMap.get(category) || 0) + Number(item.lineTotal)),
      );

      // Track top products
      if (!productSalesMap.has(item.productId)) {
        productSalesMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          image: item.image,
          category,
          quantity: 0,
          revenue: 0
        });
      }
      const entry = productSalesMap.get(item.productId);
      entry.quantity += Number(item.quantity);
      entry.revenue = formatCurrencyAmount(entry.revenue + Number(item.lineTotal));
    });
  });

  const topSellingProducts = [...productSalesMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    range: validRange,
    summary: {
      totalRevenue,
      totalOrders,
      unitsSold,
      averageTicket: totalOrders ? formatCurrencyAmount(totalRevenue / totalOrders) : 0,
    },
    trend: createTrend(validRange, filteredSales),
    paymentBreakdown: [...paymentBreakdownMap.entries()].map(([label, value]) => ({
      label,
      value,
    })),
    categoryBreakdown: [...categoryBreakdownMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value),
    topSellingProducts,
    recentSales: filteredSales.slice(0, 50).map(sale => ({
      ...sale,
      cashierName: sale.cashierName || (sale.cashier?.name) || 'System'
    })),
  };
}

async function getOverviewData(user, branchFilter = null) {
  const activeBranch = (user && user.role !== 'super_admin') ? user.branch : branchFilter;

  let [products, sales, users] = await Promise.all([
    getProducts({ branch: activeBranch }),
    getAllSales(),
    getAllUsersForLookup(),
  ]);

  if (activeBranch) {
    sales = sales.filter((sale) => sale.branch === activeBranch);
    users = users.filter((u) => u.branch === activeBranch);
  } else if (user && user.role === 'cashier') {
    sales = sales.filter((sale) =>
      String(sale.cashier?.userId || sale.cashierId) === String(user._id)
    );
  }

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const inventoryValue = formatCurrencyAmount(
    products.reduce((sum, product) => sum + Number(product.quantityInStock) * Number(product.price), 0),
  );
  const stockCost = formatCurrencyAmount(
    products.reduce((sum, product) => sum + Number(product.quantityInStock) * Number(product.costPrice), 0),
  );
  const lowStockProducts = products
    .filter((product) => Number(product.quantityInStock) <= Number(product.reorderLevel))
    .sort((left, right) => left.quantityInStock - right.quantityInStock)
    .map((product) => ({
      ...product,
      rackLabel: getRackLabel(product.rack),
    }));

  const salesToday = sales.filter((sale) => sameDay(sale.createdAt, now));
  const salesThisWeek = sales.filter((sale) => new Date(sale.createdAt) >= weekStart);
  const salesThisMonth = sales.filter((sale) => new Date(sale.createdAt) >= monthStart);
  const salesThisYear = sales.filter((sale) => new Date(sale.createdAt) >= yearStart);

  const rackSummaryMap = new Map();
  products.forEach((product) => {
    const key = `Row ${product.rack.rowNumber}`;
    if (!rackSummaryMap.has(key)) {
      rackSummaryMap.set(key, { row: key, items: 0, units: 0 });
    }
    const entry = rackSummaryMap.get(key);
    entry.items += 1;
    entry.units += Number(product.quantityInStock);
  });

  const productSalesMap = new Map();
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSalesMap.has(item.productId)) {
        productSalesMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          quantity: 0,
          revenue: 0,
          image: item.image,
          rackLabel: getRackLabel(item.rack),
        });
      }
      const entry = productSalesMap.get(item.productId);
      entry.quantity += Number(item.quantity);
      entry.revenue = formatCurrencyAmount(entry.revenue + Number(item.lineTotal));
    });
  });

  const recentSales = sales.slice(0, 6).map((sale) => ({
    ...sale,
    cashierName: sale.cashier?.name || 'Unknown cashier',
  }));

  return {
    user: sanitizeUser(user),
    metrics: {
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      inventoryValue,
      stockCost,
      revenueToday: formatCurrencyAmount(salesToday.reduce((sum, sale) => sum + Number(sale.total), 0)),
      totalOrdersToday: salesToday.length,
      revenueWeekly: formatCurrencyAmount(
        salesThisWeek.reduce((sum, sale) => sum + Number(sale.total), 0),
      ),
      revenueMonthly: formatCurrencyAmount(
        salesThisMonth.reduce((sum, sale) => sum + Number(sale.total), 0),
      ),
      revenueYearly: formatCurrencyAmount(
        salesThisYear.reduce((sum, sale) => sum + Number(sale.total), 0),
      ),
      activeUsers: users.length,
    },
    lowStockProducts,
    products: products.map((product) => ({
      ...product,
      rackLabel: getRackLabel(product.rack),
    })),
    recentSales,
    topProducts: [...productSalesMap.values()]
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5),
    rackSummary: [...rackSummaryMap.values()],
  };
}

module.exports = {
  createSale,
  deleteProduct,
  getOverviewData,
  getProducts,
  getRecentSales,
  getSales,
  getSalesReport,
  getUserById,
  initializeStore,
  loginUser,
  saveProduct,
  getUsers,
  saveUser,
  deleteUser,
  getCompany,
  updateCompany,
};



async function getUsers(reqUser) {
  let allUsers = [];
  if (isDatabaseReady()) {
    allUsers = await User.find().sort({ name: 1 }).lean();
  } else {
    allUsers = memoryStore.users.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (reqUser && reqUser.role === 'admin') {
    allUsers = allUsers.filter(u => u.branch === reqUser.branch);
  }

  return allUsers.map((user) => sanitizeUser(user));
}

async function saveUser(payload, reqUser) {
  const userData = {
    name: String(payload.name || '').trim(),
    username: String(payload.username || '').trim().toLowerCase(),
    role: ['super_admin', 'admin', 'cashier'].includes(payload.role) ? payload.role : 'cashier',
    branch: String(payload.branch || 'Main Branch').trim(),
  };

  if (reqUser && reqUser.role === 'admin') {
    userData.role = 'cashier';
    userData.branch = reqUser.branch;
  }

  if (!userData.name || !userData.username) {
    throw createError('Name and username are required.');
  }

  if (payload.password) {
    userData.passwordHash = await bcrypt.hash(payload.password, 10);
  }

  if (isDatabaseReady()) {
    if (payload._id) {
      const user = await User.findByIdAndUpdate(payload._id, userData, {
        new: true,
        runValidators: true,
      }).lean();

      if (!user) {
        throw createError('User not found.', 404);
      }

      memoryStore.users = await User.find().lean();
      return sanitizeUser(user);
    }

    if (!payload.password) {
      throw createError('Password is required for new users.');
    }

    const existing = await User.findOne({ username: userData.username });
    if (existing) {
      throw createError('User with this username already exists.');
    }

    const user = await User.create(userData);
    memoryStore.users = await User.find().lean();
    return sanitizeUser(user);
  }

  if (payload._id) {
    const index = memoryStore.users.findIndex((u) => String(u._id) === String(payload._id));
    if (index < 0) {
      throw createError('User not found.', 404);
    }

    memoryStore.users[index] = {
      ...memoryStore.users[index],
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    return sanitizeUser(memoryStore.users[index]);
  }

  const existing = memoryStore.users.find((u) => u.username === userData.username);
  if (existing) {
    throw createError('User with this username already exists.');
  }

  if (!payload.password) {
    throw createError('Password is required for new users.');
  }

  const newUser = {
    _id: generateId(),
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.users.push(newUser);

  return sanitizeUser(newUser);
}

async function deleteUser(userId) {
  if (isDatabaseReady()) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw createError('User not found.', 404);
    }
    memoryStore.users = await User.find().lean();
    return { success: true };
  }

  const index = memoryStore.users.findIndex((u) => String(u._id) === String(userId));
  if (index < 0) {
    throw createError('User not found.', 404);
  }

  memoryStore.users.splice(index, 1);
  return { success: true };
}

async function getSales(filters = {}) {
  const sales = await getAllSales();

  return sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt);
    const now = new Date();

    // Date filters
    if (filters.date === 'today') {
      if (!sameDay(sale.createdAt, now)) return false;
    } else if (filters.date === 'this-week') {
      const weekStart = startOfWeek(now);
      if (new Date(sale.createdAt) < weekStart) return false;
    } else if (filters.date === 'this-month') {
      if (saleDate.getMonth() !== now.getMonth() || saleDate.getFullYear() !== now.getFullYear()) return false;
    }

    // Cashier filter
    if (filters.cashierId && String(sale.cashier?.userId) !== String(filters.cashierId)) {
      return false;
    }

    // Query filter (invoice number or customer name)
    if (filters.query) {
      const q = String(filters.query).toLowerCase();
      const invNo = String(sale.invoiceNumber || '').toLowerCase();
      const custName = String(sale.customerName || '').toLowerCase();
      if (!invNo.includes(q) && !custName.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

async function getCompany() {
  if (isDatabaseReady()) {
    let company = await Company.findOne().lean();
    if (!company) {
      company = await Company.create({
        name: 'Inventory System',
        tagline: 'Excellence in Management',
        loyaltyCardCode: 'NILMA-2026-DISC295',
        invoicePrefix: 'C-INV-',
        nextInvoiceNumber: 1000,
      });
    }
    return { ...company, _id: String(company._id) };
  }

  return memoryStore.company;
}

async function updateCompany(payload) {
  const companyData = {
    name: String(payload.name || 'Inventory System').trim(),
    tagline: String(payload.tagline || 'Excellence in Management').trim(),
    address: String(payload.address || '').trim(),
    phone: String(payload.phone || '').trim(),
    email: String(payload.email || '').trim(),
    watermark: String(payload.watermark || '').trim(),
    loyaltyCardCode: String(payload.loyaltyCardCode || 'NILMA-2026-DISC295').trim(),
    invoicePrefix: String(payload.invoicePrefix || 'C-INV-').trim(),
    nextInvoiceNumber: payload.nextInvoiceNumber ? Number(payload.nextInvoiceNumber) : 1000,
  };

  if (payload.logo) {
    companyData.logo = payload.logo;
  }
  if (isDatabaseReady()) {
    let company = await Company.findOneAndUpdate({}, companyData, {
      new: true,
      upsert: true,
      runValidators: true,
    }).lean();

    return { ...company, _id: String(company._id) };
  }

  memoryStore.company = {
    ...memoryStore.company,
    ...companyData,
  };

  return memoryStore.company;
}

module.exports = {
  createSale,
  deleteProduct,
  getOverviewData,
  getProducts,
  getRecentSales,
  getSales,
  getSalesReport,
  getUserById,
  initializeStore,
  loginUser,
  saveProduct,
  getUsers,
  saveUser,
  deleteUser,
  createReturn,
  getReturns,
  getCompany,
  updateCompany,
  getBranches,
  saveBranch,
  deleteBranch,
  getPurchases,
  createPurchase,
  transferInventory,
  getTransfers
};

async function getPurchases(filters = {}) {
  const branchFilter = filters.branch;
  if (isDatabaseReady()) {
    const query = {};
    if (branchFilter) query.branch = branchFilter;
    return await Purchase.find(query).populate('supplier').populate('products.product').lean();
  }

  let list = memoryStore.purchases;
  if (branchFilter) {
    list = list.filter(p => p.branch === branchFilter);
  }

  return list.map(p => {
    const supplier = memoryStore.users.find(u => String(u._id) === String(p.supplier)) || { name: 'Supplier' };
    const resolvedProducts = p.products.map(item => {
      const prod = memoryStore.products.find(pr => String(pr._id) === String(item.product));
      return {
        ...item,
        product: prod,
      };
    });
    return {
      ...p,
      supplier,
      products: resolvedProducts,
    };
  });
}

async function createPurchase(payload) {
  const { supplier, products, total, date, branch } = payload;
  const branchName = branch || 'Main Branch';

  const purchaseData = {
    supplier,
    products: products.map(item => ({
      product: item.product,
      quantity: Number(item.quantity),
      costPrice: Number(item.costPrice),
    })),
    total: Number(total),
    date: date || new Date(),
    branch: branchName,
  };

  if (isDatabaseReady()) {
    const purchase = new Purchase(purchaseData);
    await purchase.save();

    const updatePromises = products.map(async (item) => {
      await BranchStock.findOneAndUpdate(
        { branch: branchName, productId: item.product },
        { $inc: { quantityInStock: Number(item.quantity) } },
        { upsert: true, new: true }
      );
      await Product.findByIdAndUpdate(item.product, { latestPurchaseCost: Number(item.costPrice) });
    });
    await Promise.all(updatePromises);

    await SupplierInvoice.create({
      invoiceNo: `PUR-${Date.now()}`,
      supplierId: supplier,
      date: date || new Date(),
      totalAmount: total,
      balanceAmount: total,
      status: 'UNPAID',
      branch: branchName
    });

    return purchase.toObject();
  }

  const newPurchase = {
    _id: generateId(),
    ...purchaseData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.purchases.push(newPurchase);

  products.forEach(item => {
    let bs = memoryStore.branchStocks.find(entry => entry.branch === branchName && String(entry.productId) === String(item.product));
    if (!bs) {
      bs = {
        _id: generateId(),
        branch: branchName,
        productId: String(item.product),
        quantityInStock: 0,
        reorderLevel: 0,
        rack: { rowNumber: 1, columnNumber: 1, shelfNumber: 1 },
        createdAt: new Date().toISOString(),
      };
      memoryStore.branchStocks.push(bs);
    }
    bs.quantityInStock += Number(item.quantity);
    bs.updatedAt = new Date().toISOString();

    const p = memoryStore.products.find(prod => String(prod._id) === String(item.product));
    if (p) {
      p.latestPurchaseCost = Number(item.costPrice);
    }
  });

  return newPurchase;
}

async function transferInventory({ sourceBranch, destBranch, products }) {
  if (isDatabaseReady()) {
    const updatePromises = products.map(async (item) => {
      // Check stock first
      const sourceStock = await BranchStock.findOne({ branch: sourceBranch, productId: item.product });
      if (!sourceStock || sourceStock.quantityInStock < item.quantity) {
        throw createError(`Insufficient stock in source branch for product ID ${item.product}.`);
      }

      // Subtract from source
      await BranchStock.findOneAndUpdate(
        { branch: sourceBranch, productId: item.product },
        { $inc: { quantityInStock: -Number(item.quantity) } }
      );
      // Add to destination
      await BranchStock.findOneAndUpdate(
        { branch: destBranch, productId: item.product },
        { $inc: { quantityInStock: Number(item.quantity) } },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updatePromises);

    // Save transfer record
    await Transfer.create({
      sourceBranch,
      destBranch,
      products
    });

    return { success: true };
  } else {
    // In-memory version
    products.forEach(item => {
      let sourceBs = memoryStore.branchStocks.find(entry => entry.branch === sourceBranch && String(entry.productId) === String(item.product));
      if (!sourceBs || sourceBs.quantityInStock < item.quantity) {
        throw createError(`Insufficient stock in source branch for product ID ${item.product}.`);
      }
      sourceBs.quantityInStock -= Number(item.quantity);
      sourceBs.updatedAt = new Date().toISOString();

      let destBs = memoryStore.branchStocks.find(entry => entry.branch === destBranch && String(entry.productId) === String(item.product));
      if (!destBs) {
        destBs = {
          _id: generateId(),
          branch: destBranch,
          productId: String(item.product),
          quantityInStock: 0,
          reorderLevel: 0,
          rack: { rowNumber: 1, columnNumber: 1, shelfNumber: 1 },
          createdAt: new Date().toISOString(),
        };
        memoryStore.branchStocks.push(destBs);
      }
      destBs.quantityInStock += Number(item.quantity);
      destBs.updatedAt = new Date().toISOString();
    });

    if (!memoryStore.transfers) memoryStore.transfers = [];
    memoryStore.transfers.push({
      _id: generateId(),
      sourceBranch,
      destBranch,
      products,
      createdAt: new Date().toISOString()
    });

    return { success: true };
  }
}

async function getTransfers() {
  if (isDatabaseReady()) {
    const transfers = await Transfer.find().populate('products.product', 'name sku image').sort({ createdAt: -1 }).lean();
    return transfers;
  }
  return (memoryStore.transfers || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getBranches() {
  if (isDatabaseReady()) {
    return await Branch.find().sort({ name: 1 }).lean();
  }
  return memoryStore.branches;
}

async function saveBranch(payload) {
  const branchData = {
    name: String(payload.name || '').trim(),
    location: String(payload.location || '').trim(),
    phone: String(payload.phone || '').trim(),
    email: String(payload.email || '').trim(),
    manager: String(payload.manager || '').trim(),
    status: ['active', 'inactive'].includes(payload.status) ? payload.status : 'active',
  };

  if (!branchData.name) {
    throw createError('Branch name is required.');
  }

  if (isDatabaseReady()) {
    if (payload._id) {
      const original = await Branch.findById(payload._id).lean();
      if (!original) throw createError('Branch not found.', 404);

      const updated = await Branch.findByIdAndUpdate(payload._id, branchData, { new: true }).lean();

      if (original.name !== branchData.name) {
        await Promise.all([
          BranchStock.updateMany({ branch: original.name }, { branch: branchData.name }),
          User.updateMany({ branch: original.name }, { branch: branchData.name }),
          Sale.updateMany({ branch: original.name }, { branch: branchData.name }),
          Purchase.updateMany({ branch: original.name }, { branch: branchData.name }),
          Return.updateMany({ branch: original.name }, { branch: branchData.name }),
        ]);
      }

      if (original.manager !== branchData.manager) {
        if (original.manager) {
          await User.updateMany({ name: original.manager }, { branch: 'Unassigned' });
        }
        if (branchData.manager) {
          await User.updateMany({ name: branchData.manager }, { branch: branchData.name });
        }
      }

      return updated;
    }

    const existing = await Branch.findOne({ name: branchData.name });
    if (existing) {
      throw createError('Branch with this name already exists.');
    }

    const branch = await Branch.create(branchData);

    if (branchData.manager) {
      await User.updateMany({ name: branchData.manager }, { branch: branchData.name });
    }

    const products = await Product.find().lean();
    const branchStocks = products.map(p => ({
      branch: branchData.name,
      productId: p._id,
      quantityInStock: 0,
      reorderLevel: p.reorderLevel,
      rack: p.rack,
    }));
    if (branchStocks.length > 0) {
      await BranchStock.insertMany(branchStocks);
    }

    return branch.toObject();
  }

  if (payload._id) {
    const index = memoryStore.branches.findIndex((b) => String(b._id) === String(payload._id));
    if (index < 0) throw createError('Branch not found.', 404);

    const oldName = memoryStore.branches[index].name;
    const oldManager = memoryStore.branches[index].manager;
    memoryStore.branches[index] = {
      ...memoryStore.branches[index],
      ...branchData,
      updatedAt: new Date().toISOString(),
    };

    if (oldName !== branchData.name) {
      memoryStore.branchStocks.forEach(bs => { if (bs.branch === oldName) bs.branch = branchData.name; });
      memoryStore.users.forEach(u => { if (u.branch === oldName) u.branch = branchData.name; });
      memoryStore.sales.forEach(s => { if (s.branch === oldName) s.branch = branchData.name; });
      memoryStore.returns.forEach(r => { if (r.branch === oldName) r.branch = branchData.name; });
    }

    if (oldManager !== branchData.manager) {
      if (oldManager) {
        memoryStore.users.forEach(u => { if (u.name === oldManager) u.branch = 'Unassigned'; });
      }
      if (branchData.manager) {
        memoryStore.users.forEach(u => { if (u.name === branchData.manager) u.branch = branchData.name; });
      }
    }

    return memoryStore.branches[index];
  }

  const existing = memoryStore.branches.find(b => b.name === branchData.name);
  if (existing) throw createError('Branch with this name already exists.');

  const newBranch = {
    _id: generateId(),
    ...branchData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.branches.push(newBranch);

  if (branchData.manager) {
    memoryStore.users.forEach(u => { if (u.name === branchData.manager) u.branch = branchData.name; });
  }

  memoryStore.products.forEach(p => {
    memoryStore.branchStocks.push({
      _id: generateId(),
      branch: newBranch.name,
      productId: String(p._id),
      quantityInStock: 0,
      reorderLevel: Number(p.reorderLevel),
      rack: p.rack,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return newBranch;
}

async function deleteBranch(branchId) {
  if (isDatabaseReady()) {
    const branch = await Branch.findById(branchId).lean();
    if (!branch) throw createError('Branch not found.', 404);

    await Branch.findByIdAndDelete(branchId);
    await BranchStock.deleteMany({ branch: branch.name });
    return { success: true };
  }

  const index = memoryStore.branches.findIndex(b => String(b._id) === String(branchId));
  if (index < 0) throw createError('Branch not found.', 404);

  const branchName = memoryStore.branches[index].name;
  memoryStore.branches.splice(index, 1);
  memoryStore.branchStocks = memoryStore.branchStocks.filter(bs => bs.branch !== branchName);

  return { success: true };
}
