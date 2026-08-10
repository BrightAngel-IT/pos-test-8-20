/**
 * Module: Settlements
 * 
 * React UI page component representing the Settlements view.
 */

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Search,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Receipt,
  Building2,
  Calendar,
  Hash,
  Users
} from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'
import { readErrorMessage, formatCurrency, authConfig } from '../../utils'
import { saveSettlementOffline, getOfflineSales } from '../../utils/offlineSync'

export function Settlements({ api, session, onNotice }) {
  const [entities, setEntities] = useState([]) // Customers
  const [selectedEntityId, setSelectedEntityId] = useState('')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [paymentForm, setPaymentForm] = useState({
    totalAmount: '',
    paymentMethod: 'CASH',
    chequeNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
  })

  const [allocations, setAllocations] = useState({}) // { invoiceId: amount }

  // Load Customers
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await api.get('/customers', authConfig(session.token))
        setEntities(res.data)
        setSelectedEntityId('')
        setInvoices([])
        setAllocations({})
      } catch (err) {
        onNotice({ type: 'error', text: 'Failed to load customers' })
      }
    }
    fetchCustomers()
  }, [api, session.token, onNotice])

  // Load Invoices when entity is selected
  useEffect(() => {
    if (selectedEntityId) {
      fetchInvoices(selectedEntityId)
    } else {
      setInvoices([])
      setAllocations({})
    }
  }, [selectedEntityId])

  async function fetchInvoices(id) {
    setLoading(true)
    let outstanding = []
    try {
      const res = await api.get(`/customer-invoices/customer/${id}`, authConfig(session.token))
      outstanding = res.data.filter(inv => (inv.balanceAmount ?? inv.totalAmount) > 0)

      try {
        const localforage = (await import('localforage')).default || (await import('localforage'));
        await localforage.setItem(`cashier_settlement_invoices_${id}`, outstanding);
      } catch (e) {
        console.error('Failed to cache online invoices', e);
      }
    } catch (err) {
      if (!navigator.onLine) {
        try {
          const localforage = (await import('localforage')).default || (await import('localforage'));
          const cached = await localforage.getItem(`cashier_settlement_invoices_${id}`);
          if (cached) {
            outstanding = cached;
          }
        } catch (e) {
          console.error('Failed to load cached online invoices', e);
        }
      } else {
        onNotice({ type: 'error', text: 'Failed to load outstanding invoices' })
      }
    }

    try {
      const pendingSales = await getOfflineSales()
      const { getOfflineSettlements } = await import('../../utils/offlineSync')
      const pendingSettlements = await getOfflineSettlements()

      // Deduct offline settlements from online invoices
      outstanding = outstanding.map(inv => {
        let settledOffline = 0;
        pendingSettlements.forEach(settlement => {
          if (settlement.allocations && Array.isArray(settlement.allocations)) {
            settlement.allocations.forEach(alloc => {
              if (String(alloc.invoiceId) === String(inv._id) || String(alloc.invoiceId) === String(inv.invoiceNo) || String(alloc.invoiceId) === String(inv.invoiceNumber)) {
                settledOffline += Number(alloc.allocatedAmount);
              }
            });
          }
        });
        const originalBalance = inv.balanceAmount ?? inv.totalAmount;
        const newBalance = originalBalance - settledOffline;
        return {
          ...inv,
          balanceAmount: Math.max(0, newBalance)
        };
      }).filter(inv => inv.balanceAmount > 0);
      
      const offlineSales = pendingSales.filter(s => String(s.customerId) === String(id))
      const offlineInvoices = offlineSales.map(sale => {
        let creditAmount = 0
        if (sale.paymentMethod?.toLowerCase() === 'credit') {
          creditAmount = Number(sale.total || sale.products?.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0) || 0)
        } else if (sale.paymentMethod?.toLowerCase() === 'split' && sale.splitPayments) {
          const creditPart = sale.splitPayments.find(p => p.method?.toLowerCase() === 'credit')
          if (creditPart) creditAmount = Number(creditPart.amount || 0)
        }
        
        let settledOffline = 0
        const offlineIdString = String(sale.localId)
        const hexId = String(sale.localId).padStart(24, '0').slice(0, 24)
        pendingSettlements.forEach(settlement => {
          if (settlement.allocations && Array.isArray(settlement.allocations)) {
            settlement.allocations.forEach(alloc => {
              if (String(alloc.invoiceId) === offlineIdString || String(alloc.invoiceId) === hexId) {
                settledOffline += Number(alloc.allocatedAmount)
              }
              const invNo = sale.invoiceNumber || sale.invoiceNo || `INVC-${sale.localId}`
              if (String(alloc.invoiceId) === String(invNo)) {
                settledOffline += Number(alloc.allocatedAmount)
              }
            })
          }
        })
        
        const balanceAmount = creditAmount - settledOffline

        if (balanceAmount > 0) {
          // Use hex string padding to prevent backend CastError when allocating offline invoices online
          return {
            _id: hexId,
            date: sale.createdAt || sale.date || new Date(sale.localId || Date.now()).toISOString(),
            invoiceNo: sale.invoiceNumber || sale.invoiceNo || `INVC-${sale.localId}`,
            totalAmount: creditAmount,
            balanceAmount: balanceAmount,
            status: 'UNPAID',
            isOffline: true
          }
        }
        return null
      }).filter(Boolean)

      outstanding = [...outstanding, ...offlineInvoices]
    } catch (e) {
      console.error("Error loading offline credit sales", e)
    }

    setInvoices(outstanding)
    setLoading(false)
  }

  const handleAllocationChange = (invoiceId, value, balance) => {
    const amount = parseFloat(value) || 0
    if (amount > balance) {
      onNotice({ type: 'warning', text: 'Allocation cannot exceed invoice balance' })
      return
    }
    setAllocations(prev => ({
      ...prev,
      [invoiceId]: value
    }))
  }

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  const remainingUnallocated = (parseFloat(paymentForm.totalAmount) || 0) - totalAllocated

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (totalAllocated === 0) {
      onNotice({ type: 'error', text: 'Allocation required to process settlement' })
      return
    }

    if (totalAllocated > (parseFloat(paymentForm.totalAmount) || 0)) {
      onNotice({ type: 'error', text: 'Allocated total exceeds payment amount' })
      return
    }

    setSubmitting(true)
    const payload = {
      customerId: selectedEntityId,
      paymentDate: paymentForm.paymentDate,
      totalAmount: parseFloat(paymentForm.totalAmount),
      paymentMethod: paymentForm.paymentMethod,
      chequeNumber: paymentForm.chequeNumber,
      allocations: Object.entries(allocations)
        .filter(([_, amount]) => parseFloat(amount) > 0)
        .map(([invoiceId, amount]) => ({
          invoiceId,
          allocatedAmount: parseFloat(amount)
        }))
    }

    if (!navigator.onLine) {
      await saveSettlementOffline(payload, '/payments')
      onNotice({ type: 'warning', text: 'You are offline. Customer collection saved locally and will sync when internet returns.' })

      if (selectedEntityId) {
        // Optimistically update invoices
        setInvoices(prev => prev.map(inv => {
          const allocation = allocations[inv._id];
          if (allocation) {
            const newBalance = Math.max(0, (inv.balanceAmount ?? inv.totalAmount) - parseFloat(allocation));
            return { ...inv, balanceAmount: newBalance };
          }
          return inv;
        }).filter(inv => (inv.balanceAmount ?? inv.totalAmount) > 0));
      }

      setPaymentForm({
        totalAmount: '',
        paymentMethod: 'CASH',
        chequeNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
      })
      setAllocations({})
      setSubmitting(false)
      return;
    }

    const attemptOffline = async () => {
      const saved = await saveSettlementOffline(payload, '/payments')
      if (saved) {
        onNotice({ type: 'warning', text: 'Offline mode: Customer collection saved locally and will sync when online.' })
        setPaymentForm({
          totalAmount: '',
          paymentMethod: 'CASH',
          chequeNumber: '',
          paymentDate: new Date().toISOString().split('T')[0],
        })
        setAllocations({})
        if (selectedEntityId) {
          fetchInvoices(selectedEntityId)
        }
      } else {
        onNotice({ type: 'error', text: 'Failed to save customer collection offline.' })
      }
    }

    try {
      if (!navigator.onLine) {
        await attemptOffline()
      } else {
        try {
          await api.post('/payments', payload, authConfig(session.token))
          onNotice({ type: 'success', text: 'Customer collection processed successfully' })

          // Refresh invoices for the same entity instead of resetting selection
          if (selectedEntityId) {
            fetchInvoices(selectedEntityId)
          }

          setPaymentForm({
            totalAmount: '',
            paymentMethod: 'CASH',
            chequeNumber: '',
            paymentDate: new Date().toISOString().split('T')[0],
          })
          setAllocations({})
        } catch (err) {
          if (!err.response) {
            await attemptOffline()
          } else {
            throw err
          }
        }
      }
    } catch (err) {
      onNotice({ type: 'error', text: err.response?.data?.message || 'Transaction failed' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="stack gap-6 animate-fade">
      <SectionHeading
        title="Customer Settlements"
        subtitle="Process customer payments and reconcile outstanding balances."
        icon={Wallet}
      />

      <div className="grid-2 gap-6 align-start">
        {/* Settlement Setup */}
        <section className="panel p-6 glass-panel stack gap-6" style={{ borderRadius: '20px' }}>
          <div className="cluster gap-2 mb-2">
            <CreditCard size={18} style={{ color: 'var(--accent)' }} />
            <span className="eyebrow">Payment Entry</span>
          </div>

          <form onSubmit={handleSubmit} className="stack gap-5">
            <label className="field">
              <span className="muted x-small font-bold uppercase tracking-wider">Select Customer</span>
              <select
                className="input"
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                required
              >
                <option value="">Choose a customer...</option>
                {entities.map(e => (
                  <option key={e._id} value={e._id}>{e.name} {e.phone ? `(${e.phone})` : ''}</option>
                ))}
              </select>
            </label>

            <div className="grid-2 gap-4">
              <label className="field">
                <span className="muted x-small font-bold uppercase tracking-wider">Payment Date</span>
                <div className="input-shell compact" style={{ borderRadius: '10px' }}>
                  <Calendar size={14} className="muted" />
                  <input
                    type="date"
                    className="ghost-input small"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    required
                  />
                </div>
              </label>
              <label className="field">
                <span className="muted x-small font-bold uppercase tracking-wider">Total Received</span>
                <div className="input-shell compact" style={{ borderRadius: '10px' }}>
                  <span className="muted x-small">$</span>
                  <input
                    type="number"
                    className="ghost-input small font-strong"
                    placeholder="0.00"
                    value={paymentForm.totalAmount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, totalAmount: e.target.value })}
                    required
                  />
                </div>
              </label>
            </div>

            <div className="grid-2 gap-4">
              <label className="field">
                <span className="muted x-small font-bold uppercase tracking-wider">Method</span>
                <select
                  className="input small"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card Payment</option>
                </select>
              </label>
              {paymentForm.paymentMethod === 'CHEQUE' && (
                <label className="field">
                  <span className="muted x-small font-bold uppercase tracking-wider">Cheque #</span>
                  <div className="input-shell compact" style={{ borderRadius: '10px' }}>
                    <Hash size={14} className="muted" />
                    <input
                      type="text"
                      className="ghost-input small font-mono"
                      placeholder="CHQ-001"
                      value={paymentForm.chequeNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, chequeNumber: e.target.value })}
                      required
                    />
                  </div>
                </label>
              )}
            </div>

            <div className="panel-strong p-4 stack gap-3" style={{ borderRadius: '16px', background: 'var(--bg-soft)', border: '1px dashed var(--border)' }}>
              <div className="between x-small muted font-bold uppercase">
                <span>Total Allocated</span>
                <span style={{ color: 'var(--text)' }}>{formatCurrency(totalAllocated)}</span>
              </div>
              <div className="between x-small muted font-bold uppercase">
                <span>Unallocated Balance</span>
                <span style={{ color: remainingUnallocated < 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {formatCurrency(remainingUnallocated)}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary large-btn"
              type="submit"
              disabled={submitting}
              style={{
                borderRadius: '12px',
                padding: '16px',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))'
              }}
            >
              {submitting ? (
                <div className="cluster gap-2">
                  <div className="spinner small white" />
                  Processing...
                </div>
              ) : (
                <div className="cluster gap-2">
                  <CheckCircle2 size={18} />
                  Record Payment
                </div>
              )}
            </button>
          </form>
        </section>

        {/* Invoices List */}
        <section className="panel p-0 glass-panel overflow-hidden stack gap-0" style={{ borderRadius: '20px' }}>
          <div className="p-6">
            <div className="cluster gap-2 mb-2">
              <Receipt size={18} style={{ color: 'var(--accent)' }} />
              <span className="eyebrow">Outstanding Invoices</span>
            </div>
            <p className="muted small">Select invoices to allocate the payment amount.</p>
          </div>

          <div className="overflow-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full professional-table">
              <thead style={{ background: 'var(--bg-soft)', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Invoice</th>
                  <th>Date</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Balance</th>
                  <th className="text-right" style={{ paddingRight: '24px' }}>Allocate</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center p-20">
                      <div className="spinner accent" style={{ margin: '0 auto' }} />
                      <p className="muted small mt-3">Syncing ledger records...</p>
                    </td>
                  </tr>
                ) : invoices.length > 0 ? (
                  invoices.map(inv => {
                    const balance = inv.balanceAmount ?? inv.totalAmount
                    const isFullyAllocated = (parseFloat(allocations[inv._id]) || 0) >= balance

                    return (
                      <tr key={inv._id} className="table-row-hover">
                        <td style={{ paddingLeft: '24px' }}>
                          <strong className="small">{inv.invoiceNo || inv.invoiceNumber}</strong>
                        </td>
                        <td className="muted small">{new Date(inv.date).toLocaleDateString()}</td>
                        <td className="text-right muted small">{formatCurrency(inv.totalAmount)}</td>
                        <td className="text-right font-strong small">{formatCurrency(balance)}</td>
                        <td className="text-right" style={{ paddingRight: '24px', width: '150px' }}>
                          <div className="input-shell compact" style={{ borderRadius: '8px', border: isFullyAllocated ? '1px solid var(--success)' : '1px solid var(--border)' }}>
                            <input
                              type="number"
                              className="ghost-input x-small text-right font-bold"
                              placeholder="0.00"
                              value={allocations[inv._id] || ''}
                              onChange={(e) => handleAllocationChange(inv._id, e.target.value, balance)}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center p-20 muted small">
                      <div className="stack align-center gap-3">
                        <AlertCircle size={32} style={{ opacity: 0.2 }} />
                        <p>{selectedEntityId ? "No outstanding invoices for this customer." : "Select a customer to view pending items."}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
