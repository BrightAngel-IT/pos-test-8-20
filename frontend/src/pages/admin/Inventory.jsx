import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Boxes,
  Edit,
  Plus,
  Search,
  Tag,
  Warehouse,
  X,
  History,
  TrendingDown,
  TrendingUp,
  Truck,
  AlertCircle,
  Trash2,
  Download,
} from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'
import { formatCurrency, exportToCSV, getBaseUrl } from '../../utils'
import { Pagination } from '../../components/Pagination'

export function Inventory({
  products,
  inventoryQuery,
  setInventoryQuery,
  onlyLowStock,
  setOnlyLowStock,
  productForm,
  handleProductFormChange,
  handleProductSave,
  startEditingProduct,
  resetProductEditor,
  editingProductId,
  busyAction,
  startTransition,
  handleProductDelete,
}) {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeRack, setActiveRack] = useState('All')
  const [activeColumn, setActiveColumn] = useState('All')
  const [activeStatus, setActiveStatus] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const categories = ['All', ...new Set(products.map(p => p.category))]
  const racks = ['All', ...new Set(products.map(p => `Row ${p.rack.rowNumber}`))]
  const columns = ['All', ...new Set(products.map(p => `Col ${p.rack.columnNumber}`))]

  const filteredItems = products.filter(p => {
    // Search filter
    const searchString = `${p.name} ${p.barcode} ${p.sku} ${p.category} ${p.rackLabel}`.toLowerCase()
    if (!searchString.includes(inventoryQuery.toLowerCase())) return false

    // Category filter
    if (activeCategory !== 'All' && p.category !== activeCategory) return false

    // Rack filters
    if (activeRack !== 'All' && `Row ${p.rack.rowNumber}` !== activeRack) return false
    if (activeColumn !== 'All' && `Col ${p.rack.columnNumber}` !== activeColumn) return false
    
    // Status filters
    if (activeStatus === 'Critical' && p.quantityInStock > 0) return false
    if (activeStatus === 'Low' && (p.quantityInStock <= 0 || p.quantityInStock > p.reorderLevel)) return false
    if (activeStatus === 'Good' && p.quantityInStock <= p.reorderLevel) return false

    // Low stock toggle (global prop)
    if (onlyLowStock && p.quantityInStock > p.reorderLevel) return false

    return true
  })

  // Reset to page 1 on filter change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [inventoryQuery, activeCategory, activeRack, activeColumn, activeStatus, onlyLowStock])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalValue = filteredItems.reduce((sum, p) => sum + (p.price * p.quantityInStock), 0)
  const totalUnits = filteredItems.reduce((sum, p) => sum + p.quantityInStock, 0)
  const criticalCount = filteredItems.filter(p => p.quantityInStock <= p.reorderLevel).length

  const [showHistory, setShowHistory] = useState(false)

  // Mock movement history for visual appeal
  const mockHistory = [
    { type: 'in', qty: 50, date: 'Today, 10:30 AM', user: 'Admin' },
    { type: 'out', qty: 12, date: 'Today, 09:15 AM', user: 'Cashier 1' },
    { type: 'in', qty: 100, date: 'Yesterday', user: 'Admin' },
  ]

  return (
    <div className="stack gap-6 animate-fade">
      {/* Header & Main Stats */}
      <div className="grid-3 gap-6">
        <div className="panel p-6 glass-panel between" style={{ background: 'linear-gradient(135deg, var(--accent-soft), transparent)' }}>
          <div className="stack gap-1">
            <span className="eyebrow muted">Inventory Valuation</span>
            <h2 className="accent-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{formatCurrency(totalValue)}</h2>
          </div>
          <div className="icon-btn" style={{ background: 'var(--panel)', color: 'var(--accent)' }}><Tag size={24}/></div>
        </div>
        <div className="panel p-6 glass-panel between">
          <div className="stack gap-1">
            <span className="eyebrow muted">Total Stock Units</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalUnits.toLocaleString()} <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>Items</span></h2>
          </div>
          <div className="icon-btn" style={{ background: 'var(--bg-soft)', color: 'var(--text)' }}><Boxes size={24}/></div>
        </div>
        <div className="panel p-6 glass-panel between" style={{ background: criticalCount > 0 ? 'linear-gradient(135deg, var(--danger-soft), transparent)' : '' }}>
          <div className="stack gap-1">
            <span className="eyebrow muted">Critical Alerts</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: criticalCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{criticalCount} <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>Reorders</span></h2>
          </div>
          <div className="icon-btn" style={{ background: 'var(--panel)', color: criticalCount > 0 ? 'var(--danger)' : 'var(--success)' }}><AlertCircle size={24}/></div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="panel p-5 glass-panel stack gap-5">
        <div className="between wrap-row gap-4">
          <div className="cluster gap-4 wrap-row" style={{ flex: 1 }}>
            <div className="input-shell compact" style={{ flexBasis: '280px', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <Search size={18} className="muted" />
              <input
                className="ghost-input"
                placeholder="Find by SKU, Name..."
                value={inventoryQuery}
                onChange={(e) => setInventoryQuery(e.target.value)}
              />
            </div>
            
            <div className="cluster gap-3">
              <div className="stack gap-1">
                <span className="eyebrow muted" style={{ fontSize: '0.6rem' }}>Category</span>
                <select className="input compact" style={{ width: '140px' }} value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="stack gap-1">
                <span className="eyebrow muted" style={{ fontSize: '0.6rem' }}>Rack Row</span>
                <select className="input compact" style={{ width: '120px' }} value={activeRack} onChange={(e) => setActiveRack(e.target.value)}>
                  {racks.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="stack gap-1">
                <span className="eyebrow muted" style={{ fontSize: '0.6rem' }}>Rack Col</span>
                <select className="input compact" style={{ width: '120px' }} value={activeColumn} onChange={(e) => setActiveColumn(e.target.value)}>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="stack gap-1">
                <span className="eyebrow muted" style={{ fontSize: '0.6rem' }}>Health Status</span>
                <select className="input compact" style={{ width: '130px' }} value={activeStatus} onChange={(e) => setActiveStatus(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Critical">Out of Stock</option>
                  <option value="Low">Low Stock</option>
                  <option value="Good">Healthy</option>
                </select>
              </div>
            </div>
          </div>

          <div className="cluster gap-2">
            <button 
              className="btn btn-outline" 
              style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', display: 'flex', gap: '8px', alignItems: 'center' }}
              onClick={() => exportToCSV(filteredItems, 'Inventory_Report')}
            >
              <Download size={18} />
              Export Excel
            </button>
            <button 
              className="btn btn-primary"
              style={{ padding: '12px 24px', borderRadius: '14px' }}
              onClick={() => navigate('/product-manager')}
            >
              <Plus size={18} />
              Master Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Stock Ledger Table */}
      <div className="panel glass-panel overflow-auto" style={{ padding: 0, border: '1px solid var(--border)' }}>
        <table className="w-full professional-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>Product Identifier</th>
              <th>Category</th>
              <th>Warehouse Loc</th>
              <th>Unit Cost</th>
              <th>Unit Price</th>
              <th>Available Stock</th>
              <th>Status</th>
              <th style={{ width: '120px', textAlign: 'right', paddingRight: '24px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((product) => {
              const isLow = product.quantityInStock <= product.reorderLevel;
              const isOut = product.quantityInStock === 0;

              return (
                <tr key={product._id} className="table-row-hover animate-slide">
                  <td style={{ paddingLeft: '24px' }}>
                    <div className="cluster gap-3">
                      <div className="avatar small" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-soft)', padding: '2px', overflow: 'hidden' }}>
                        <img 
                          src={product.image?.startsWith('/uploads') ? `${getBaseUrl()}${product.image}` : product.image} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                      <div className="stack">
                        <strong style={{ fontSize: '0.95rem' }}>{product.name}</strong>
                        <span className="muted small font-mono">{product.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pill neutral small">{product.category}</span>
                  </td>
                  <td>
                    <div className="cluster gap-2">
                      <Warehouse size={14} className="muted" />
                      <span className="font-strong">{product.rackLabel}</span>
                    </div>
                  </td>
                  <td>
                    <strong>{formatCurrency(product.costPrice)}</strong>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--accent-strong)' }}>{formatCurrency(product.price)}</strong>
                  </td>
                  <td>
                    <div className="stack">
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)' }}>
                        {product.quantityInStock}
                      </span>
                      <span className="muted small">{product.unit}</span>
                    </div>
                  </td>
                  <td>
                    {isOut ? (
                      <span className="pill danger-soft small">Out of Stock</span>
                    ) : isLow ? (
                      <span className="pill warning-soft small">Low Stock</span>
                    ) : (
                      <span className="pill success-soft small">Healthy</span>
                    )}
                  </td>
                  <td style={{ width: '120px', textAlign: 'right', paddingRight: '24px' }}>
                    <div className="cluster gap-2 justify-end">
                      <button 
                        className="icon-btn ghost hover-accent"
                        title="Edit Product"
                        onClick={() => {
                          startEditingProduct(product);
                          navigate('/product-manager');
                        }}
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className="icon-btn ghost hover-danger"
                        title="Delete Product"
                        disabled={busyAction === 'product-delete'}
                        onClick={() => handleProductDelete(product._id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {filteredItems.length === 0 && (
          <div className="stack align-center p-8 gap-3" style={{ opacity: 0.6 }}>
            <Boxes size={48} className="muted" />
            <p>No products found matching the current filter criteria.</p>
          </div>
        )}
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredItems.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  )
}
