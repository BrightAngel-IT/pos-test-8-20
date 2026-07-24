/**
 * Module: Purchases
 * 
 * React UI page component representing the Purchases view.
 */

import React, { useEffect, useState } from 'react'
import {
  Truck,
  Plus,
  Search,
  Calendar,
  DollarSign,
  X,
  Trash2,
  ShoppingBag,
  FileText,
  Boxes,
  CheckCircle2
} from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'
import { authConfig, readErrorMessage, formatCurrency, formatDate } from '../../utils'
import { Pagination } from '../../components/Pagination'

export default function Purchases({ api, session, onNotice, refreshCoreData }) {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    supplier: '',
    branch: '',
    items: [], // { productId, unit, piecesPerUnit, quantity, costPrice }
    total: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [pRes, sRes, prRes, bRes] = await Promise.all([
        api.get('/purchases', authConfig(session.token)),
        api.get('/suppliers', authConfig(session.token)),
        api.get('/products', authConfig(session.token)),
        session.user.role === 'super_admin' ? api.get('/branches', authConfig(session.token)) : Promise.resolve({ data: [] })
      ])
      setPurchases(pRes.data)
      setSuppliers(sRes.data)
      setProducts(prRes.data.products || [])
      setBranches(bRes.data)
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to sync purchase records.' })
    } finally {
      setLoading(false)
    }
  }

  function addItem() {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', unit: 'pcs', piecesPerUnit: 1, quantity: 1, costPrice: '', unitPrice: '' }]
    })
  }

  function removeItem(index) {
    const newItems = formData.items.filter((_, i) => i !== index)
    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.costPrice)), 0)
    setFormData({ ...formData, items: newItems, total: newTotal })
  }

  function updateItem(index, field, value) {
    const newItems = [...formData.items]
    newItems[index][field] = value

    // Auto-set piecesPerUnit to 1 if unit is not a bulk unit
    if (field === 'unit' && !['box', 'carton', 'bag', 'case', 'pack', 'dozen', 'bundle', 'roll', 'set'].includes(value)) {
      newItems[index].piecesPerUnit = 1
    }

    const item = newItems[index]
    const ppu = Number(item.piecesPerUnit) || 1

    if (field === 'costPrice' && value !== '') {
      item.unitPrice = (Number(value) / ppu).toFixed(2)
      // Remove trailing .00 if needed, but toFixed is fine
    } else if (field === 'unitPrice' && value !== '') {
      item.costPrice = (Number(value) * ppu).toFixed(2)
    } else if (field === 'piecesPerUnit') {
      if (item.costPrice) {
        item.unitPrice = (Number(item.costPrice) / ppu).toFixed(2)
      } else if (item.unitPrice) {
        item.costPrice = (Number(item.unitPrice) * ppu).toFixed(2)
      }
    } else if (field === 'unit') {
      // if switched to pieces, clear unitPrice if we want to simplify, but it's fine.
      if (!['box', 'carton', 'bag', 'case', 'pack', 'dozen', 'bundle', 'roll', 'set'].includes(value)) {
        item.unitPrice = item.costPrice;
      }
    } else if (field === 'productId') {
      const selectedProduct = products.find(p => String(p._id) === String(value));
      if (selectedProduct && selectedProduct.costPrice) {
        item.unitPrice = Number(selectedProduct.costPrice).toFixed(2);
        item.costPrice = (Number(selectedProduct.costPrice) * ppu).toFixed(2);
      }
    }

    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.costPrice)), 0)
    setFormData({ ...formData, items: newItems, total: newTotal })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (formData.items.length === 0) return onNotice({ type: 'error', text: 'Add at least one item.' })
    if (session.user.role === 'super_admin' && !formData.branch) return onNotice({ type: 'error', text: 'Please select a destination branch.' })

    try {
      const formattedProducts = formData.items.map(i => {
        const totalPieces = Number(i.quantity) * Number(i.piecesPerUnit || 1)
        const costPerPiece = Number(i.costPrice) / Number(i.piecesPerUnit || 1)
        return {
          product: i.productId,
          quantity: totalPieces,
          costPrice: costPerPiece
        }
      })

      await api.post('/purchases', {
        supplier: formData.supplier,
        branch: session.user.role === 'super_admin' ? formData.branch : session.user.branch,
        products: formattedProducts,
        total: formData.total,
        date: new Date()
      }, authConfig(session.token))

      onNotice({ type: 'success', text: 'Purchase order processed. Supplier invoice generated.' })
      setShowForm(false)
      setFormData({ supplier: '', items: [], total: 0 })
      if (refreshCoreData) await refreshCoreData()
      fetchData()
    } catch (err) {
      onNotice({ type: 'error', text: readErrorMessage(err) })
    }
  }

  const filteredPurchases = purchases.filter(p => {
    let match = true;
    if (search) {
      const q = search.toLowerCase();
      const s = suppliers.find(sup => String(sup._id) === String(p.supplier?._id || p.supplier));
      const supName = (p.supplier?.name || s?.name || '').toLowerCase();
      const branchName = (p.branch?.name || p.branch || 'Main Branch').toLowerCase();
      if (!supName.includes(q) && !branchName.includes(q)) match = false;
    }
    const pDate = p.date ? new Date(p.date) : (p.createdAt ? new Date(p.createdAt) : null);
    if (match && pDate && startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      if (pDate < sDate) match = false;
    }
    if (match && pDate && endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      if (pDate > eDate) match = false;
    }
    return match;
  })

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const paginatedPurchases = filteredPurchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="stack gap-6 animate-fade">
      <div className="between wrap-row panel p-6 glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none' }}>
            <Truck size={24} />
          </div>
          <SectionHeading
            title="Procurement Log"
            text="Track incoming stock and supplier liabilities."
          />
        </div>
        <button className="btn btn-primary glow-on-hover" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Record Purchase
        </button>
      </div>

      <div className="panel glass-panel stack gap-4 p-4 overflow-hidden" style={{ borderLeft: '4px solid var(--accent)', borderRadius: '16px' }}>
        <div className="grid-12 gap-4 align-center wrap-row">
          <div className="grid-colspan-6 stack gap-1">
            <span className="muted small font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Search</span>
            <div className="input-shell compact" style={{ background: 'var(--bg-soft)', borderRadius: '10px', height: '38px', padding: '0 12px' }}>
              <Search size={16} className="muted" />
              <input
                type="text"
                placeholder="Search by supplier or branch..."
                className="ghost-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: '0.85rem', color: 'var(--text)' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="icon-btn ghost hover-danger"
                  style={{ width: '20px', height: '20px', border: 'none', background: 'transparent', display: 'grid', placeItems: 'center' }}
                  title="Clear Search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="grid-colspan-6 cluster gap-3 align-end">
            <div className="stack gap-1 flex-1">
              <span className="muted small font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>From Date</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ height: '38px', borderRadius: '10px', background: 'var(--bg-soft)', border: '1px solid var(--border)', padding: '0 10px', color: 'var(--text)', fontSize: '0.85rem' }}
              />
            </div>
            <div className="stack gap-1 flex-1">
              <span className="muted small font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>To Date</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ height: '38px', borderRadius: '10px', background: 'var(--bg-soft)', border: '1px solid var(--border)', padding: '0 10px', color: 'var(--text)', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="panel p-8 glass-panel animate-fade relative">
          <button className="icon-btn ghost absolute top-4 right-4" onClick={() => setShowForm(false)}>
            <X size={20} />
          </button>
          <form onSubmit={handleSubmit} className="stack gap-6">
            <h3 className="accent-text">New Procurement Order</h3>

            <div className="grid-2 gap-4">
              <label className="field">
                <span>Select Supplier</span>
                <select className="input" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} required>
                  <option value="">-- Select Partner --</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </label>

              {session.user.role === 'super_admin' && (
                <label className="field">
                  <span>Destination Branch</span>
                  <select className="input" value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} required>
                    <option value="">-- Assign to Branch --</option>
                    {branches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                </label>
              )}
            </div>

            <div className="stack gap-4">
              <div className="between">
                <span className="eyebrow">Order Items</span>
                <button type="button" className="btn btn-secondary small" onClick={addItem}>
                  <Plus size={14} /> Add Line
                </button>
              </div>

              <div className="stack gap-2">
                {formData.items.map((item, idx) => {
                  const isBulk = ['box', 'carton', 'bag', 'case', 'pack', 'dozen', 'bundle', 'roll', 'set'].includes(item.unit)

                  return (
                    <div key={idx} className="cluster gap-3 panel-strong p-3 wrap-row" style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <select
                        className="input flex-1"
                        style={{ minWidth: '200px' }}
                        value={item.productId}
                        onChange={e => updateItem(idx, 'productId', e.target.value)}
                        required
                      >
                        <option value="">-- Product --</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                      </select>

                      <select
                        className="input"
                        style={{ width: '120px' }}
                        value={item.unit}
                        onChange={e => updateItem(idx, 'unit', e.target.value)}
                      >
                        <option value="pcs">Pieces</option>
                        <option value="box">Box</option>
                        <option value="carton">Carton</option>
                        <option value="bag">Bag</option>
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
                        className="input"
                        type="number"
                        style={{ width: '90px' }}
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                        required
                        min="1"
                      />

                      {isBulk && (
                        <div className="cluster gap-2" style={{ background: 'var(--bg-soft)', padding: '4px 8px', borderRadius: '8px' }}>
                          <span className="x-small muted whitespace-nowrap">Pieces inside:</span>
                          <input
                            className="input compact"
                            type="number"
                            style={{ width: '70px', padding: '4px 8px' }}
                            value={item.piecesPerUnit}
                            onChange={e => updateItem(idx, 'piecesPerUnit', e.target.value)}
                            required={isBulk}
                            min="1"
                          />
                        </div>
                      )}

                      <div className="cluster gap-1">
                        <input
                          className="input"
                          type="number"
                          style={{ width: '100px' }}
                          placeholder={isBulk ? "Cost/Box" : "Cost/Item"}
                          value={item.costPrice}
                          onChange={e => updateItem(idx, 'costPrice', e.target.value)}
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {isBulk && (
                        <div className="cluster gap-1">
                          <span className="muted">/</span>
                          <input
                            className="input"
                            type="number"
                            style={{ width: '100px' }}
                            placeholder="Cost/Piece"
                            value={item.unitPrice || ''}
                            onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                            required={isBulk}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}
                      <button type="button" className="icon-btn ghost hover-danger" onClick={() => removeItem(idx)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="between panel-strong p-4" style={{ borderRadius: '14px' }}>
              <span className="font-strong">Total Commitment:</span>
              <h2 className="accent-text">{formatCurrency(formData.total)}</h2>
            </div>

            <button className="btn btn-primary w-full" type="submit">
              Finalize Order
            </button>
          </form>
        </div>
      )}

      <div className="panel glass-panel overflow-auto">
        <table className="w-full professional-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>Purchase ID</th>
              <th>Supplier Partner</th>
              <th>Assigned Branch</th>
              <th>Order Volume</th>
              <th>Financial Valuation</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>Date Processed</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPurchases.map(pur => (
              <tr key={pur._id} className="table-row-hover">
                <td style={{ paddingLeft: '24px' }}>
                  <div className="cluster gap-2">
                    <FileText size={14} className="muted" />
                    <strong className="small font-mono">#{pur._id.slice(-6).toUpperCase()}</strong>
                  </div>
                </td>
                <td>
                  <div className="stack">
                    <strong className="small">{pur.supplier?.name || 'Manual Entry'}</strong>
                    <span className="muted x-small">{pur.supplier?.category || 'General Supply'}</span>
                  </div>
                </td>
                <td>
                  <span className="small badge bg-primary-soft">{pur.branch?.name || pur.branch || 'Main Branch'}</span>
                </td>
                <td>
                  <div className="cluster gap-2">
                    <Boxes size={14} className="muted" />
                    <span className="small">{pur.products?.length || 0} Line Items</span>
                  </div>
                </td>
                <td>
                  <strong className="accent-text">{formatCurrency(pur.total)}</strong>
                </td>
                <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                  <span className="muted small">{formatDate(pur.date || pur.createdAt)}</span>
                </td>
              </tr>
            ))}
            {purchases.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="p-12 text-center muted">No procurement history recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredPurchases.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  )
}
