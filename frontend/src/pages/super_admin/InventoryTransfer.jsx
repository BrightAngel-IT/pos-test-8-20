import React, { useState, useEffect } from 'react'
import { Plus, X, ArrowRightLeft } from 'lucide-react'

export function InventoryTransfer({ api, session, onNotice, refreshCoreData }) {
  const [branches, setBranches] = useState([])
  const [products, setProducts] = useState([])
  const [transfers, setTransfers] = useState([])
  const [transferForm, setTransferForm] = useState({
    sourceBranch: '',
    destBranch: '',
    items: []
  })
  const [showForm, setShowForm] = useState(false)
  const [searchBranch, setSearchBranch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [branchesRes, productsRes, transfersRes] = await Promise.all([
        api.get('/branches', { headers: { Authorization: `Bearer ${session.token}` } }),
        api.get('/products', { headers: { Authorization: `Bearer ${session.token}` } }),
        api.get('/transfers', { headers: { Authorization: `Bearer ${session.token}` } })
      ])
      setBranches(branchesRes.data || [])
      setProducts(productsRes.data.products || [])
      setTransfers(transfersRes.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const addItem = () => {
    setTransferForm({
      ...transferForm,
      items: [...transferForm.items, { productId: '', unit: 'pcs', piecesPerUnit: 1, quantity: 1 }]
    })
  }

  const removeItem = (index) => {
    setTransferForm({
      ...transferForm,
      items: transferForm.items.filter((_, i) => i !== index)
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...transferForm.items]
    newItems[index][field] = value
    if (field === 'unit' && !['box', 'case', 'pack', 'dozen', 'bundle', 'roll', 'set'].includes(value)) {
      newItems[index].piecesPerUnit = 1
    }
    setTransferForm({ ...transferForm, items: newItems })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (transferForm.items.length === 0) return onNotice({ type: 'error', text: 'Add at least one item to transfer.' })
    if (transferForm.sourceBranch === transferForm.destBranch) return onNotice({ type: 'error', text: 'Source and destination branches must be different.' })

    try {
      const formattedProducts = transferForm.items.map(i => {
        const totalPieces = Number(i.quantity) * Number(i.piecesPerUnit || 1)
        return { 
          product: i.productId, 
          quantity: totalPieces
        }
      })

      await api.post('/transfers', {
        sourceBranch: transferForm.sourceBranch,
        destBranch: transferForm.destBranch,
        products: formattedProducts
      }, { headers: { Authorization: `Bearer ${session.token}` } })
      
      onNotice({ type: 'success', text: 'Inventory successfully transferred.' })
      setTransferForm({ sourceBranch: '', destBranch: '', items: [] })
      setShowForm(false)
      loadData()
      if (refreshCoreData) await refreshCoreData()
    } catch (err) {
      console.error(err)
      onNotice({ type: 'error', text: err.response?.data?.message || 'Transfer failed.' })
    }
  }

  const filteredTransfers = transfers.filter(t => {
    let match = true;
    if (searchBranch) {
      const q = searchBranch.toLowerCase();
      const sBranch = t.sourceBranch?.toLowerCase() || '';
      const dBranch = t.destBranch?.toLowerCase() || '';
      if (!sBranch.includes(q) && !dBranch.includes(q)) match = false;
    }
    const tDate = t.createdAt ? new Date(t.createdAt) : null;
    if (match && tDate && startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0,0,0,0);
      if (tDate < sDate) match = false;
    }
    if (match && tDate && endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23,59,59,999);
      if (tDate > eDate) match = false;
    }
    return match;
  });

  return (
    <div className="stack gap-6 p-6 animate-fade-in">
      <div className="between align-end">
        <div>
          <h2 className="title">Inventory Exchange</h2>
          <p className="muted">Transfer bulk products between branches</p>
        </div>
        <button className="btn btn-primary glow-on-hover" onClick={() => setShowForm(true)}>
          <ArrowRightLeft size={18} />
          New Transfer
        </button>
      </div>

      {showForm && (
        <div className="panel p-8 glass-panel animate-fade relative">
          <button className="icon-btn ghost absolute top-4 right-4" onClick={() => setShowForm(false)}>
            <X size={20} />
          </button>
          <form onSubmit={handleSubmit} className="stack gap-6">
            <h3 className="accent-text">Transfer Details</h3>
            
            <div className="grid-2 gap-4">
              <label className="field">
                <span>Source Branch (Transfer From)</span>
                <select className="input" value={transferForm.sourceBranch} onChange={e => setTransferForm({...transferForm, sourceBranch: e.target.value})} required>
                  <option value="">-- Select Source --</option>
                  {branches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                </select>
              </label>

              <label className="field">
                <span>Destination Branch (Transfer To)</span>
                <select className="input" value={transferForm.destBranch} onChange={e => setTransferForm({...transferForm, destBranch: e.target.value})} required>
                  <option value="">-- Select Destination --</option>
                  {branches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                </select>
              </label>
            </div>

            <div className="stack gap-3">
              <div className="between align-center">
                <span className="eyebrow" style={{ fontSize: '0.65rem' }}>Transfer Items</span>
                <button type="button" className="btn btn-outline small" onClick={addItem}>
                  <Plus size={12} /> Add Item
                </button>
              </div>

              {transferForm.items.map((item, idx) => {
                const isBulk = ['box', 'case', 'pack', 'dozen', 'bundle', 'roll', 'set'].includes(item.unit)

                return (
                  <div key={idx} className="cluster gap-2 align-center wrap-row p-2 panel-strong" style={{ borderRadius: '8px' }}>
                    <select
                      required
                      style={{ flex: 2, padding: '10px', minWidth: '150px' }}
                      value={item.productId}
                      onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    
                    <select 
                      className="input" 
                      style={{ width: '100px', padding: '10px' }} 
                      value={item.unit} 
                      onChange={e => updateItem(idx, 'unit', e.target.value)}
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
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    />

                    {isBulk && (
                      <div className="cluster gap-2" style={{ background: 'var(--bg-soft)', padding: '4px 8px', borderRadius: '8px' }}>
                        <span className="x-small muted whitespace-nowrap">Pieces inside:</span>
                        <input 
                          type="number" 
                          required 
                          min="1" 
                          className="input small" 
                          style={{ width: '60px' }}
                          value={item.piecesPerUnit} 
                          onChange={(e) => updateItem(idx, 'piecesPerUnit', e.target.value)} 
                        />
                      </div>
                    )}

                    <div className="cluster gap-1 justify-end ml-auto">
                      <button type="button" className="icon-btn ghost danger small" onClick={() => removeItem(idx)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              
              {transferForm.items.length === 0 && (
                <div className="p-4 rounded border-dashed text-center muted small">
                  No items added yet. Click "Add Item" to start.
                </div>
              )}
            </div>

            <div className="cluster justify-end pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Transfer Inventory</button>
            </div>
          </form>
        </div>
      )}
      
      {!showForm && (
        <div className="stack gap-4">
          <div className="between align-center mt-4 wrap-row gap-4">
            <h3 className="accent-text" style={{ margin: 0 }}>Transfer History</h3>
            
            <div className="cluster gap-3 wrap-row" style={{ background: 'var(--panel-strong)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="cluster gap-2">
                <span className="muted small font-bold">Branch</span>
                <input 
                  type="text" 
                  placeholder="Search branch..." 
                  value={searchBranch}
                  onChange={e => setSearchBranch(e.target.value)}
                  className="input compact"
                  style={{ width: '150px' }}
                />
              </div>
              <div className="cluster gap-2">
                <span className="muted small font-bold">From</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="input compact"
                />
              </div>
              <div className="cluster gap-2">
                <span className="muted small font-bold">To</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="input compact"
                />
              </div>
              {(searchBranch || startDate || endDate) && (
                <button 
                  onClick={() => { setSearchBranch(''); setStartDate(''); setEndDate(''); }}
                  className="btn btn-ghost hover-danger"
                  style={{ padding: '0 8px' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          {filteredTransfers.length === 0 ? (
            <div className="panel p-8 glass-panel text-center">
              <ArrowRightLeft size={48} className="muted" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3>No Transfer History</h3>
              <p className="muted mb-4">Click "New Transfer" to move stock between branches.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source Branch</th>
                    <th>Destination Branch</th>
                    <th>Products Transferred</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map(t => (
                    <tr key={t._id}>
                      <td>{new Date(t.createdAt).toLocaleString()}</td>
                      <td>
                        <span className="badge warning">{t.sourceBranch}</span>
                      </td>
                      <td>
                        <span className="badge success">{t.destBranch}</span>
                      </td>
                      <td>
                        <div className="stack gap-1">
                          {t.products.map((p, idx) => (
                            <div key={idx} className="cluster gap-2 align-center x-small">
                              <span className="muted">{p.quantity}x</span>
                              <strong>{p.product?.name || 'Unknown Product'}</strong>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
