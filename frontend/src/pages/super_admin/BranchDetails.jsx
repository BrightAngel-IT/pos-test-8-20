import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Building2,
  Warehouse,
  TrendingUp,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  FileText,
  Truck,
  RotateCcw,
  Search,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Calendar,
  Ruler,
  Image as ImageIcon,
  Users
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { MetricCard } from '../../components/MetricCard'
import { SectionHeading } from '../../components/SectionHeading'
import { formatCurrency, formatDate, authConfig } from '../../utils'

export function BranchDetails({ api, session }) {
  const { branchName } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const decodedBranchName = decodeURIComponent(branchName)

  // Overview states
  const [overview, setOverview] = useState(null)
  const [report, setReport] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  
  // New local states for overview search bars
  const [watchlistQuery, setWatchlistQuery] = useState('')
  const [invoiceQuery, setInvoiceQuery] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')

  // Products states
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [inventoryQuery, setInventoryQuery] = useState('')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    description: '',
    unit: 'pcs',
    price: '0',
    costPrice: '0',
    loyaltyDiscount: '0',
    quantityInStock: '0',
    reorderLevel: '0',
    rack: { rowNumber: '1', columnNumber: '1', shelfNumber: '1' }
  })

  // Purchases states
  const [purchases, setPurchases] = useState([])
  const [purchasesLoading, setPurchasesLoading] = useState(true)
  const [suppliers, setSuppliers] = useState([])
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({
    supplier: '',
    items: [] // { productId, quantity, costPrice }
  })

  // Returns states
  const [returns, setReturns] = useState([])
  const [returnsLoading, setReturnsLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnForm, setReturnForm] = useState({
    type: 'customer', // customer or supplier
    entityId: '',
    referenceNo: '',
    reason: '',
    refundMethod: 'credit-note',
    items: [] // { productId, quantity, unitPrice }
  })

  // Fetch functions
  const loadOverview = async () => {
    try {
      setOverviewLoading(true)
      const [overviewRes, reportRes] = await Promise.all([
        api.get(`/dashboard/overview?branch=${encodeURIComponent(decodedBranchName)}`, authConfig(session.token)),
        api.get(`/reports/sales?branch=${encodeURIComponent(decodedBranchName)}`, authConfig(session.token))
      ])
      setOverview(overviewRes.data)
      setReport(reportRes.data)
    } catch (err) {
      console.error('Failed to load overview details:', err)
    } finally {
      setOverviewLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      setProductsLoading(true)
      const res = await api.get(`/products?branch=${encodeURIComponent(decodedBranchName)}`, authConfig(session.token))
      setProducts(res.data.products || [])
    } catch (err) {
      console.error('Failed to load branch products:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  const loadPurchases = async () => {
    try {
      setPurchasesLoading(true)
      const [purRes, supRes] = await Promise.all([
        api.get(`/purchases?branch=${encodeURIComponent(decodedBranchName)}`, authConfig(session.token)),
        api.get('/suppliers', authConfig(session.token))
      ])
      setPurchases(purRes.data || [])
      setSuppliers(supRes.data || [])
    } catch (err) {
      console.error('Failed to load procurement details:', err)
    } finally {
      setPurchasesLoading(false)
    }
  }

  const loadReturns = async () => {
    try {
      setReturnsLoading(true)
      const [retRes, custRes] = await Promise.all([
        api.get(`/returns?branch=${encodeURIComponent(decodedBranchName)}`, authConfig(session.token)),
        api.get('/customers', authConfig(session.token))
      ])
      setReturns(retRes.data || [])
      setCustomers(custRes.data || [])
    } catch (err) {
      console.error('Failed to load branch returns:', err)
    } finally {
      setReturnsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'overview') loadOverview()
    if (activeTab === 'inventory') loadProducts()
    if (activeTab === 'purchases') loadPurchases()
    if (activeTab === 'returns') loadReturns()
  }, [activeTab, branchName])

  // Inventory Save Handler
  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...productForm,
        branch: decodedBranchName
      }
      if (editingProduct) {
        await api.patch(`/products/${editingProduct._id}`, payload, authConfig(session.token))
      } else {
        await api.post('/products', payload, authConfig(session.token))
      }
      setShowProductModal(false)
      loadProducts()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product')
    }
  }

  const handleOpenAddProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: Date.now().toString().slice(-8),
      category: 'General',
      description: '',
      unit: 'pcs',
      price: '0',
      costPrice: '0',
      loyaltyDiscount: '0',
      quantityInStock: '0',
      reorderLevel: '5',
      rack: { rowNumber: '1', columnNumber: '1', shelfNumber: '1' }
    })
    setShowProductModal(true)
  }

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      description: product.description || '',
      unit: product.unit || 'pcs',
      price: String(product.price),
      costPrice: String(product.costPrice),
      loyaltyDiscount: String(product.loyaltyDiscount || 0),
      quantityInStock: String(product.quantityInStock || 0),
      reorderLevel: String(product.reorderLevel || 0),
      rack: {
        rowNumber: String(product.rack?.rowNumber || 1),
        columnNumber: String(product.rack?.columnNumber || 1),
        shelfNumber: String(product.rack?.shelfNumber || 1)
      }
    })
    setShowProductModal(true)
  }

  const handleProductDelete = async (product) => {
    if (!window.confirm(`Delete product ${product.name} from the master catalog?`)) return
    try {
      await api.delete(`/products/${product._id}`, authConfig(session.token))
      loadProducts()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product')
    }
  }

  // Procurement (Purchase) handlers
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault()
    if (purchaseForm.items.length === 0) {
      alert('Add at least one item to procurement order.')
      return
    }
    const total = purchaseForm.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.costPrice)), 0)
    try {
      const formattedProducts = purchaseForm.items.map(i => {
        const totalPieces = Number(i.quantity) * Number(i.piecesPerUnit || 1)
        const costPerPiece = Number(i.costPrice) / Number(i.piecesPerUnit || 1)
        return { 
          product: i.productId, 
          quantity: totalPieces, 
          costPrice: costPerPiece 
        }
      })

      await api.post('/purchases', {
        supplier: purchaseForm.supplier,
        products: formattedProducts,
        total,
        branch: decodedBranchName,
        date: new Date()
      }, authConfig(session.token))
      
      setShowPurchaseModal(false)
      loadPurchases()
    } catch (err) {
      alert('Procurement processing failed.')
    }
  }

  const addPurchaseItem = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, { productId: '', unit: 'pcs', piecesPerUnit: 1, quantity: 1, costPrice: '' }]
    })
  }

  const removePurchaseItem = (index) => {
    setPurchaseForm({
      ...purchaseForm,
      items: purchaseForm.items.filter((_, i) => i !== index)
    })
  }

  const updatePurchaseItem = (index, field, value) => {
    const updated = [...purchaseForm.items]
    updated[index][field] = value
    
    if (field === 'unit' && !['box', 'case', 'pack', 'dozen', 'bundle', 'roll', 'set'].includes(value)) {
      updated[index].piecesPerUnit = 1
    }

    setPurchaseForm({ ...purchaseForm, items: updated })
  }

  // Returns handlers
  const handleReturnSubmit = async (e) => {
    e.preventDefault()
    if (returnForm.items.length === 0) {
      alert('Add at least one item to return list.')
      return
    }
    try {
      await api.post('/returns', {
        ...returnForm,
        processedBy: session.user._id
      }, authConfig(session.token))
      
      setShowReturnModal(false)
      loadReturns()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process return.')
    }
  }

  const addReturnItem = () => {
    setReturnForm({
      ...returnForm,
      items: [...returnForm.items, { productId: '', quantity: 1, unitPrice: 0 }]
    })
  }

  const removeReturnItem = (index) => {
    setReturnForm({
      ...returnForm,
      items: returnForm.items.filter((_, i) => i !== index)
    })
  }

  const updateReturnItem = (index, field, value) => {
    const updated = [...returnForm.items]
    updated[index][field] = value
    setReturnForm({ ...returnForm, items: updated })
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(inventoryQuery.toLowerCase())
    const matchesLow = onlyLowStock ? Number(p.quantityInStock) <= Number(p.reorderLevel) : true
    return matchesSearch && matchesLow
  })

  return (
    <div className="stack gap-6 animate-fade">
      {/* Title Header */}
      <div className="between wrap-row panel p-5 glass-panel" style={{ borderLeft: '4px solid var(--accent)', borderRadius: '16px' }}>
        <div className="cluster gap-4">
          <button className="icon-btn small" onClick={() => navigate('/super-admin')} title="Go back to dashboard">
            <ArrowLeft size={16} />
          </button>
          <div className="cluster gap-2">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'grid', placeItems: 'center' }}>
              <Building2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{decodedBranchName}</h2>
              <p className="muted small">Managing stock, procurement, returns and performance metrics.</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="range-switcher p-1" style={{ background: 'var(--bg-soft)', borderRadius: '14px', display: 'flex', gap: '4px' }}>
          {['overview', 'inventory', 'purchases', 'returns'].map(tab => (
            <button
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                textTransform: 'capitalize',
                background: activeTab === tab ? '' : 'transparent',
                color: activeTab === tab ? '' : 'var(--text-soft)',
                border: 'none',
                boxShadow: activeTab === tab ? 'var(--shadow)' : 'none'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TABS IMPLEMENTATION */}
      {activeTab === 'overview' && (
        <div className="stack gap-6 animate-fade">
          {overviewLoading ? (
            <div className="panel loading-state"><div className="spinner" /><p>Analyzing dashboard...</p></div>
          ) : (
            <>
              <section className="metric-grid">
                <MetricCard
                  icon={TrendingUp}
                  title="Branch Revenue (7d)"
                  value={formatCurrency(overview?.metrics.revenueWeekly ?? 0)}
                  helper={`Monthly target velocity: ${formatCurrency(overview?.metrics.revenueMonthly ?? 0)}`}
                />
                <MetricCard
                  icon={Warehouse}
                  title="Branch Assets"
                  value={formatCurrency(overview?.metrics.inventoryValue ?? 0)}
                  helper={`Total unique items: ${overview?.metrics.totalProducts ?? 0}`}
                />
                <MetricCard
                  icon={AlertCircle}
                  title="Replenishment Alerts"
                  value={String(overview?.metrics.lowStockCount ?? 0)}
                  helper="Items mapping below safety threshold"
                  variant={overview?.metrics.lowStockCount > 0 ? 'warning' : 'success'}
                />
                <MetricCard
                  icon={FileText}
                  title="Today's Orders"
                  value={String(overview?.metrics.totalOrdersToday ?? 0)}
                  helper={`Today's Sales: ${formatCurrency(overview?.metrics.revenueToday ?? 0)}`}
                />
              </section>

              {/* Pacing Velocity Chart */}
              <div className="panel p-6 stack gap-5 glass-panel">
                <SectionHeading title="Pacing Velocity" text="Historical storefront performance sales trend." />
                <div style={{ width: '100%', height: '320px' }}>
                  {report?.trend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={report.trend}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="label" stroke="var(--text-soft)" fontSize={12} />
                        <YAxis stroke="var(--text-soft)" fontSize={12} tickFormatter={(val) => `LKR ${val}`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="stack align-center justify-center h-full muted small">No sales trend data available for this branch.</div>
                  )}
                </div>
              </div>

              <div className="grid-2 gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Stock Watchlist */}
                <div className="panel p-5 stack gap-4 glass-panel">
                  <div className="between align-center">
                    <SectionHeading title="Live Stock Details" text="Real-time inventory levels." />
                    <div className="search-input compact" style={{ width: '160px', background: 'var(--bg-soft)' }}>
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder="Search stock..." 
                        value={watchlistQuery}
                        onChange={(e) => setWatchlistQuery(e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                  <div className="stack gap-3" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(overview?.products || [])
                      .filter(p => !watchlistQuery || `${p?.name || ''} ${p?.sku || ''}`.toLowerCase().includes(watchlistQuery.toLowerCase()))
                      .sort((a, b) => a.quantityInStock - b.quantityInStock)
                      .map(p => {
                        const isLowStock = Number(p.quantityInStock) <= Number(p.reorderLevel);
                        return (
                        <div key={p._id} className="list-row p-3 panel-strong glow-on-hover" style={{ borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="cluster gap-3">
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: isLowStock ? 'var(--danger-soft)' : 'var(--accent-soft)', color: isLowStock ? 'var(--danger)' : 'var(--accent-strong)', display: 'grid', placeItems: 'center' }}>
                              {isLowStock ? <AlertCircle size={18} /> : <Layers size={18} />}
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                              <p className="muted small" style={{ fontSize: '0.75rem' }}>{p.sku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <strong className={isLowStock ? 'text-danger' : 'accent-text'} style={{ fontSize: '1rem' }}>{p.quantityInStock}</strong>
                            <p className="muted small" style={{ fontSize: '0.7rem' }}>in stock</p>
                          </div>
                        </div>
                      )})}
                    {overview?.products?.length === 0 && (
                      <div className="p-4 text-center muted small panel-strong" style={{ borderRadius: '12px' }}>No stock items found.</div>
                    )}
                  </div>
                </div>

                {/* Top Velocity */}
                <div className="panel p-5 stack gap-4 glass-panel">
                  <SectionHeading title="Top Velocity" text="Best selling products by quantity." />
                  <div className="stack gap-3" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(overview?.topProducts || []).map((p, idx) => (
                      <div key={p.productId} className="list-row p-3 panel-strong glow-on-hover" style={{ borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="cluster gap-3">
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: idx === 0 ? 'var(--accent)' : 'var(--accent-soft)', color: idx === 0 ? 'white' : 'var(--accent-strong)', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>
                            #{idx + 1}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                            <p className="success-text font-bold small" style={{ fontSize: '0.75rem' }}>{p.quantity} Units Sold</p>
                          </div>
                        </div>
                        <strong className="accent-text" style={{ fontSize: '0.95rem' }}>{formatCurrency(p.revenue)}</strong>
                      </div>
                    ))}
                    {overview?.topProducts?.length === 0 && (
                      <div className="p-4 text-center muted small panel-strong" style={{ borderRadius: '12px' }}>No sales data.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Latest Invoices */}
              <div className="panel p-5 stack gap-4 glass-panel">
                <div className="between wrap-row gap-4 align-center">
                  <SectionHeading title="Latest Invoices" text="Recent storefront transactions." />
                  <div className="cluster gap-3 wrap-row" style={{ background: 'var(--panel-strong)', padding: '6px 10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div className="search-input compact" style={{ width: '200px', background: 'var(--bg-soft)' }}>
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder="Search cashier, admin or ID..." 
                        value={invoiceQuery}
                        onChange={(e) => setInvoiceQuery(e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>
                    <input 
                      type="date"
                      className="input compact"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      style={{ background: 'var(--bg-soft)' }}
                    />
                    {(invoiceQuery || invoiceDate) && (
                      <button className="btn btn-ghost danger small" onClick={() => { setInvoiceQuery(''); setInvoiceDate(''); }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="stack gap-3" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                  {(report?.recentSales || [])
                    .filter(s => {
                      let match = true;
                      if (invoiceQuery) {
                        const q = invoiceQuery.toLowerCase();
                        const cName = String(s.cashierName || '').toLowerCase();
                        const invNo = String(s.invoiceNumber || '').toLowerCase();
                        if (!cName.includes(q) && !invNo.includes(q)) match = false;
                      }
                      if (match && invoiceDate) {
                        const sDate = new Date(s.createdAt);
                        const iDate = new Date(invoiceDate);
                        sDate.setHours(0,0,0,0);
                        iDate.setHours(0,0,0,0);
                        if (sDate.getTime() !== iDate.getTime()) match = false;
                      }
                      return match;
                    })
                    .map(s => (
                    <div key={s._id} className="list-row p-3 panel-strong glow-on-hover" style={{ borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="cluster gap-4">
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--panel)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center' }}>
                          <FileText size={18} className="muted" />
                        </div>
                        <div className="stack gap-1">
                          <strong style={{ fontSize: '0.95rem' }}>{s.invoiceNumber}</strong>
                          <div className="cluster gap-3 muted small" style={{ fontSize: '0.75rem' }}>
                            <span className="cluster gap-1"><Calendar size={12} /> {formatDate(s.createdAt)}</span>
                            <span className="cluster gap-1"><Users size={12} /> {s.cashierName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <strong className="accent-text" style={{ fontSize: '1.05rem' }}>{formatCurrency(s.total)}</strong>
                        <p className="muted small" style={{ fontSize: '0.75rem' }}>{s.items?.length || 0} items</p>
                      </div>
                    </div>
                  ))}
                  {report?.recentSales?.length === 0 && (
                    <div className="p-4 text-center muted small panel-strong" style={{ borderRadius: '12px' }}>No invoices found.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="stack gap-6 animate-fade">
          {/* Toolbar */}
          <div className="between wrap-row panel p-4 align-center" style={{ borderRadius: '16px' }}>
            <div className="cluster gap-3 w-fit" style={{ flex: 1, minWidth: '280px' }}>
              <div className="search-input" style={{ width: '100%', maxWidth: '340px' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Query by name, SKU or barcode..."
                  value={inventoryQuery}
                  onChange={(e) => setInventoryQuery(e.target.value)}
                />
              </div>
              
              <label className="checkbox-container small">
                <input
                  type="checkbox"
                  checked={onlyLowStock}
                  onChange={(e) => setOnlyLowStock(e.target.checked)}
                />
                <span>Critical Alerts Only</span>
              </label>
            </div>
            
            <button className="btn btn-primary" onClick={handleOpenAddProduct}>
              <Plus size={16} />
              Register Product Stock
            </button>
          </div>

          {productsLoading ? (
            <div className="panel loading-state"><div className="spinner" /><p>Syncing inventory...</p></div>
          ) : (
            <div className="panel p-6 stack gap-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product details</th>
                    <th>SKU & barcode</th>
                    <th>Category</th>
                    <th>Unit Cost</th>
                    <th>Selling Price</th>
                    <th>Rack mapping</th>
                    <th>Inventory level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isLow = Number(p.quantityInStock) <= Number(p.reorderLevel)
                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="cluster gap-3">
                            <img src={p.image} alt={p.name} className="thumb" style={{ borderRadius: '10px' }} />
                            <div>
                              <strong className="font-strong">{p.name}</strong>
                              <p className="muted small">{p.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="small">{p.sku}</code>
                          <p className="muted small" style={{ fontSize: '0.75rem' }}>🏷️ {p.barcode}</p>
                        </td>
                        <td>{p.category}</td>
                        <td>{formatCurrency(p.costPrice)}</td>
                        <td>{formatCurrency(p.price)}</td>
                        <td><span className="rack-tag font-mono">{p.rackLabel || 'R1-C1-S1'}</span></td>
                        <td>
                          <div className="cluster gap-2 align-center">
                            <strong style={{ fontSize: '1rem', color: isLow ? 'var(--danger)' : 'inherit' }}>{p.quantityInStock}</strong>
                            {isLow && (
                              <span className="pill danger small" style={{ fontSize: '0.65rem' }}>
                                {p.quantityInStock <= 0 ? 'Empty' : 'Low stock'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="cluster gap-2">
                            <button className="icon-btn small" onClick={() => handleOpenEditProduct(p)}><Edit2 size={12} /></button>
                            <button className="icon-btn small danger" onClick={() => handleProductDelete(p)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '48px 0' }} className="muted">No products matching inventory search filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Product Modal */}
          {showProductModal && (
            <div className="modal-overlay animate-fade" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 100 }}>
              <div className="panel p-6 stack gap-5 glass-panel animate-scale" style={{ width: '640px', borderRadius: '24px', background: 'var(--panel-strong)', maxHeight: '90%', overflowY: 'auto' }}>
                <div className="between align-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{editingProduct ? 'Modify Product Stock' : 'Register Product Stock'}</h2>
                  <button className="icon-btn" onClick={() => setShowProductModal(false)}><X size={18} /></button>
                </div>

                <form onSubmit={handleProductSubmit} className="stack gap-4">
                  <div className="grid-2 gap-4">
                    <label className="field">
                      <span>Product Title Name</span>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Category</span>
                      <input
                        type="text"
                        required
                        value={productForm.category}
                        onChange={(e) => setForm({ ...productForm, category: e.target.value })}
                        list="categories-datalist"
                      />
                      <datalist id="categories-datalist">
                        <option value="Beverages" />
                        <option value="Bakery" />
                        <option value="Packaged Foods" />
                        <option value="Dairy" />
                        <option value="Hygiene" />
                      </datalist>
                    </label>
                  </div>

                  <div className="grid-3 gap-4">
                    <label className="field">
                      <span>SKU Code</span>
                      <input
                        type="text"
                        required
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Barcode</span>
                      <input
                        type="text"
                        required
                        value={productForm.barcode}
                        onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Billing Unit</span>
                      <select
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      >
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="liters">Liters (l)</option>
                        <option value="box">Box (box)</option>
                        <option value="pack">Pack (pack)</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid-3 gap-4">
                    <label className="field">
                      <span>Procurement Cost (LKR)</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={productForm.costPrice}
                        onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Standard Sell Price (LKR)</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Loyalty Member Price (LKR)</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={productForm.loyaltyDiscount}
                        onChange={(e) => setProductForm({ ...productForm, loyaltyDiscount: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="grid-3 gap-4">
                    <label className="field">
                      <span>Quantity in Stock</span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.quantityInStock}
                        onChange={(e) => setProductForm({ ...productForm, quantityInStock: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Reorder level</span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.reorderLevel}
                        onChange={(e) => setProductForm({ ...productForm, reorderLevel: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Shelf / Rack Row</span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={productForm.rack.rowNumber}
                        onChange={(e) => setProductForm({ ...productForm, rack: { ...productForm.rack, rowNumber: e.target.value } })}
                      />
                    </label>
                  </div>

                  <div className="grid-2 gap-4">
                    <label className="field">
                      <span>Shelf / Rack Column</span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={productForm.rack.columnNumber}
                        onChange={(e) => setProductForm({ ...productForm, rack: { ...productForm.rack, columnNumber: e.target.value } })}
                      />
                    </label>
                    <label className="field">
                      <span>Shelf Number</span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={productForm.rack.shelfNumber}
                        onChange={(e) => setProductForm({ ...productForm, rack: { ...productForm.rack, shelfNumber: e.target.value } })}
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Description Details</span>
                    <textarea
                      placeholder="Enter specifications..."
                      rows="2"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </label>

                  <div className="cluster gap-3 end mt-4">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Product Stock</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="stack gap-6 animate-fade">
          {/* Purchases Header */}
          <div className="between wrap-row panel p-4 align-center" style={{ borderRadius: '16px' }}>
            <SectionHeading title="Procurement Logs" text="Log and record supplies procurement." />
            <button className="btn btn-primary" onClick={() => { setPurchaseForm({ supplier: '', items: [] }); setShowPurchaseModal(true) }}>
              <Plus size={16} />
              Add Supply Purchase
            </button>
          </div>

          {purchasesLoading ? (
            <div className="panel loading-state"><div className="spinner" /><p>Syncing purchase orders...</p></div>
          ) : (
            <div className="panel p-6 stack gap-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Items Purchased</th>
                    <th>Order Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((pur) => (
                    <tr key={pur._id}>
                      <td>{formatDate(pur.date)}</td>
                      <td><strong>{pur.supplier?.name || 'Supplies Depot'}</strong></td>
                      <td>
                        <div className="stack gap-1">
                          {pur.products?.map((item, idx) => (
                            <span key={idx} className="small muted">
                              📦 {item.product?.name || 'Stock item'} (Qty: {item.quantity} · Cost: {formatCurrency(item.costPrice)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><strong className="accent-text">{formatCurrency(pur.total)}</strong></td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '48px 0' }} className="muted">No procurement orders recorded for this branch.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Supply Purchase Modal */}
          {showPurchaseModal && (
            <div className="modal-overlay animate-fade" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 100 }}>
              <div className="panel p-6 stack gap-5 glass-panel animate-scale" style={{ width: '600px', borderRadius: '24px', background: 'var(--panel-strong)', maxHeight: '90%', overflowY: 'auto' }}>
                <div className="between align-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Supply Procurement</h2>
                  <button className="icon-btn" onClick={() => setShowPurchaseModal(false)}><X size={18} /></button>
                </div>

                <form onSubmit={handlePurchaseSubmit} className="stack gap-4">
                  <label className="field">
                    <span>Select Supplier</span>
                    <select
                      required
                      value={purchaseForm.supplier}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                    >
                      <option value="">-- Choose Supplier --</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </label>

                  <div className="stack gap-3">
                    <div className="between align-center">
                      <span className="eyebrow" style={{ fontSize: '0.65rem' }}>Purchased Items</span>
                      <button type="button" className="btn btn-outline small" onClick={addPurchaseItem}>
                        <Plus size={12} /> Add Item
                      </button>
                    </div>

                    {purchaseForm.items.map((item, idx) => {
                      const isBulk = ['box', 'case', 'pack', 'dozen', 'bundle', 'roll', 'set'].includes(item.unit)

                      return (
                      <div key={idx} className="cluster gap-2 align-center wrap-row p-2 panel-strong" style={{ borderRadius: '8px' }}>
                        <select
                          required
                          style={{ flex: 2, padding: '10px', minWidth: '150px' }}
                          value={item.productId}
                          onChange={(e) => updatePurchaseItem(idx, 'productId', e.target.value)}
                        >
                          <option value="">-- Select Product --</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        
                        <select 
                          className="input" 
                          style={{ width: '100px', padding: '10px' }} 
                          value={item.unit} 
                          onChange={e => updatePurchaseItem(idx, 'unit', e.target.value)}
                        >
                          <option value="pcs">Pieces</option>
                          <option value="box">Box</option>
                          <option value="pack">Pack</option>
                          <option value="case">Case</option>
                          <option value="dozen">Dozen</option>
                          <option value="bundle">Bundle</option>
                          <option value="roll">Roll</option>
                          <option value="set">Set</option>
                          <option value="kg">KG</option>
                          <option value="ltr">Liter</option>
                        </select>

                        <input
                          type="number"
                          required
                          min="1"
                          style={{ flex: 1, padding: '10px', maxWidth: '80px' }}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updatePurchaseItem(idx, 'quantity', e.target.value)}
                        />

                        {isBulk && (
                          <div className="cluster gap-2" style={{ background: 'var(--bg-soft)', padding: '4px 8px', borderRadius: '8px' }}>
                            <span className="x-small muted whitespace-nowrap">Pieces inside:</span>
                            <input 
                              type="number" 
                              style={{ width: '60px', padding: '8px' }} 
                              value={item.piecesPerUnit} 
                              onChange={e => updatePurchaseItem(idx, 'piecesPerUnit', e.target.value)}
                              required={isBulk}
                              min="1"
                            />
                          </div>
                        )}

                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          style={{ flex: 1.2, padding: '10px', maxWidth: '120px' }}
                          placeholder="Total Cost"
                          value={item.costPrice}
                          onChange={(e) => updatePurchaseItem(idx, 'costPrice', e.target.value)}
                        />
                        <button type="button" className="icon-btn small danger" onClick={() => removePurchaseItem(idx)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )})}
                  </div>

                  <div className="between align-center p-3 mt-2 panel-strong" style={{ borderRadius: '12px' }}>
                    <strong>Total Cost Estimate:</strong>
                    <strong className="accent-text" style={{ fontSize: '1.2rem' }}>
                      {formatCurrency(purchaseForm.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.costPrice)), 0))}
                    </strong>
                  </div>

                  <div className="cluster gap-3 end mt-4">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowPurchaseModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Process Procurement</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'returns' && (
        <div className="stack gap-6 animate-fade">
          {/* Returns Header */}
          <div className="between wrap-row panel p-4 align-center" style={{ borderRadius: '16px' }}>
            <SectionHeading title="Returns Registry" text="Track customer return items and warehouse supplier returns." />
            <button className="btn btn-primary" onClick={() => { setReturnForm({ type: 'customer', entityId: '', referenceNo: '', reason: '', refundMethod: 'credit-note', items: [] }); setShowReturnModal(true) }}>
              <Plus size={16} />
              Process Stock Return
            </button>
          </div>

          {returnsLoading ? (
            <div className="panel loading-state"><div className="spinner" /><p>Syncing return records...</p></div>
          ) : (
            <div className="panel p-6 stack gap-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Return No</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Customer / Supplier</th>
                    <th>Reference</th>
                    <th>Returned Items</th>
                    <th>Total Refund</th>
                    <th>Refund Method</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((ret) => (
                    <tr key={ret._id}>
                      <td><code>{ret.returnNo}</code></td>
                      <td>{formatDate(ret.createdAt)}</td>
                      <td>
                        <span className={`pill ${ret.type === 'customer' ? 'success-soft' : 'warning-soft'}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                          {ret.type}
                        </span>
                      </td>
                      <td><strong>{ret.entityName}</strong></td>
                      <td>{ret.referenceNo || 'N/A'}</td>
                      <td>
                        <div className="stack gap-1">
                          {ret.items?.map((item, idx) => (
                            <span key={idx} className="small muted">
                              🔄 {item.name} (Qty: {item.quantity} · Price: {formatCurrency(item.unitPrice)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><strong>{formatCurrency(ret.totalAmount)}</strong></td>
                      <td><span className="small font-mono">{ret.refundMethod}</span></td>
                    </tr>
                  ))}
                  {returns.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '48px 0' }} className="muted">No returns recorded for this branch.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Returns Modal */}
          {showReturnModal && (
            <div className="modal-overlay animate-fade" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 100 }}>
              <div className="panel p-6 stack gap-5 glass-panel animate-scale" style={{ width: '600px', borderRadius: '24px', background: 'var(--panel-strong)', maxHeight: '90%', overflowY: 'auto' }}>
                <div className="between align-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Process Stock Return</h2>
                  <button className="icon-btn" onClick={() => setShowReturnModal(false)}><X size={18} /></button>
                </div>

                <form onSubmit={handleReturnSubmit} className="stack gap-4">
                  <div className="grid-2 gap-4">
                    <label className="field">
                      <span>Return Type</span>
                      <select
                        value={returnForm.type}
                        onChange={(e) => setReturnForm({ ...returnForm, type: e.target.value, entityId: '' })}
                      >
                        <option value="customer">Customer Return (Inward Stock)</option>
                        <option value="supplier">Supplier Return (Outward Stock)</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Refund Method</span>
                      <select
                        value={returnForm.refundMethod}
                        onChange={(e) => setReturnForm({ ...returnForm, refundMethod: e.target.value })}
                      >
                        <option value="credit-note">Credit Note / Balance Deduction</option>
                        <option value="cash">Cash Refund</option>
                        <option value="bank-transfer">Bank Transfer</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid-2 gap-4">
                    <label className="field">
                      <span>Select {returnForm.type === 'customer' ? 'Customer' : 'Supplier'}</span>
                      <select
                        required
                        value={returnForm.entityId}
                        onChange={(e) => {
                          const id = e.target.value
                          const list = returnForm.type === 'customer' ? customers : suppliers
                          const found = list.find(x => x._id === id)
                          setReturnForm({ ...returnForm, entityId: id, entityName: found ? found.name : '' })
                        }}
                      >
                        <option value="">-- Select Contact --</option>
                        {(returnForm.type === 'customer' ? customers : suppliers).map(x => (
                          <option key={x._id} value={x._id}>{x.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Reference Invoice No.</span>
                      <input
                        type="text"
                        placeholder="e.g. C-INV-1004"
                        value={returnForm.referenceNo}
                        onChange={(e) => setReturnForm({ ...returnForm, referenceNo: e.target.value })}
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Reason for Return</span>
                    <input
                      type="text"
                      placeholder="e.g. Damaged packing / defective item"
                      value={returnForm.reason}
                      onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    />
                  </label>

                  <div className="stack gap-3">
                    <div className="between align-center">
                      <span className="eyebrow" style={{ fontSize: '0.65rem' }}>Return Items List</span>
                      <button type="button" className="btn btn-outline small" onClick={addReturnItem}>
                        <Plus size={12} /> Add Item
                      </button>
                    </div>

                    {returnForm.items.map((item, idx) => (
                      <div key={idx} className="cluster gap-2 align-center">
                        <select
                          required
                          style={{ flex: 2, padding: '10px' }}
                          value={item.productId}
                          onChange={(e) => {
                            const id = e.target.value
                            const prod = products.find(p => p._id === id)
                            updateReturnItem(idx, 'productId', id)
                            updateReturnItem(idx, 'name', prod ? prod.name : '')
                            updateReturnItem(idx, 'unitPrice', prod ? (returnForm.type === 'customer' ? prod.price : prod.costPrice) : 0)
                          }}
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <input
                          type="number"
                          required
                          min="1"
                          style={{ flex: 1, padding: '10px' }}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateReturnItem(idx, 'quantity', Number(e.target.value))}
                        />
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          style={{ flex: 1.2, padding: '10px' }}
                          placeholder="Refund Unit Price"
                          value={item.unitPrice}
                          onChange={(e) => updateReturnItem(idx, 'unitPrice', Number(e.target.value))}
                        />
                        <button type="button" className="icon-btn small danger" onClick={() => removeReturnItem(idx)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="between align-center p-3 mt-2 panel-strong" style={{ borderRadius: '12px' }}>
                    <strong>Total Refund Estimate:</strong>
                    <strong className="accent-text" style={{ fontSize: '1.2rem' }}>
                      {formatCurrency(returnForm.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0))}
                    </strong>
                  </div>

                  <div className="cluster gap-3 end mt-4">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Process Return</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
