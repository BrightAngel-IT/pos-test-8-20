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
import { formatCurrency, authConfig } from '../../utils'

export function PaymentAllocation({ api, session, onNotice }) {
  const [settlementMode, setSettlementMode] = useState('customer') // 'customer' or 'supplier'
  const [entities, setEntities] = useState([]) // Customers or Suppliers
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

  // Load Entities (Customers or Suppliers)
  useEffect(() => {
    async function fetchEntities() {
      try {
        const endpoint = settlementMode === 'customer' ? '/customers' : '/suppliers'
        const res = await api.get(endpoint, authConfig(session.token))
        setEntities(res.data)
        // Reset selection when mode changes
        setSelectedEntityId('')
        setInvoices([])
        setAllocations({})
      } catch (err) {
        onNotice({ type: 'error', text: `Failed to load ${settlementMode}s` })
      }
    }
    fetchEntities()
  }, [api, session.token, onNotice, settlementMode])

  // Load Invoices when entity is selected
  useEffect(() => {
    if (selectedEntityId) {
      fetchInvoices(selectedEntityId)
    } else {
      setInvoices([])
      setAllocations({})
    }
  }, [selectedEntityId, settlementMode])

  async function fetchInvoices(id) {
    setLoading(true)
    try {
      const endpoint = settlementMode === 'customer'
        ? `/customer-invoices/customer/${id}`
        : `/supplier-invoices/supplier/${id}`
      const res = await api.get(endpoint, authConfig(session.token))
      // Filter to show only unpaid/partially paid invoices
      const outstanding = res.data.filter(inv => (inv.balanceAmount ?? inv.totalAmount) > 0)
      setInvoices(outstanding)
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to load outstanding invoices' })
    } finally {
      setLoading(false)
    }
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
    try {
      const endpoint = settlementMode === 'customer' ? '/payments' : '/supplier-payments'

      const payload = {
        [settlementMode === 'customer' ? 'customerId' : 'supplierId']: selectedEntityId,
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

      await api.post(endpoint, payload, authConfig(session.token))
      onNotice({ type: 'success', text: `${settlementMode === 'customer' ? 'Collection' : 'Settlement'} processed successfully` })

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
      onNotice({ type: 'error', text: err.response?.data?.message || 'Transaction failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const modeAccent = settlementMode === 'customer' ? 'var(--accent)' : 'var(--accent)'
  const modeAccentSoft = settlementMode === 'customer' ? 'var(--accent-soft)' : 'var(--accent-soft)'

  return (
    <div className="stack gap-6 animate-fade">
      {/* Header with Mode Toggle */}
      <div className="between wrap-row panel p-6 glass-panel" style={{ borderLeft: `4px solid ${modeAccent}`, borderRadius: '16px' }}>
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: modeAccentSoft, color: modeAccent, border: 'none', width: '48px', height: '48px' }}>
            <Wallet size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {settlementMode === 'customer' ? 'Customer Collections' : 'Supplier Settlements'}
            </h2>
            <p className="muted small">
              {settlementMode === 'customer'
                ? 'Record payments received from clients and reconcile balances.'
                : 'Process outgoing payments to vendors and settle outstanding bills.'}
            </p>
          </div>
        </div>

        <div className="cluster p-1 panel-strong" style={{ background: 'var(--bg-soft)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <button
            className={`btn sm ${settlementMode === 'customer' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSettlementMode('customer')}
            style={{ borderRadius: '10px', minWidth: '120px' }}
          >
            <Users size={16} />
            Customer
          </button>
          <button
            className={`btn sm ${settlementMode === 'supplier' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '10px', minWidth: '120px', background: settlementMode === 'supplier' ? 'var(--accent)' : 'transparent' }}
            onClick={() => setSettlementMode('supplier')}
          >
            <Building2 size={16} />
            Supplier
          </button>
        </div>
      </div>

      <div className="grid-2 gap-6 align-start">
        {/* Settlement Setup */}
        <section className="panel p-6 glass-panel stack gap-6" style={{ borderRadius: '20px' }}>
          <div className="cluster gap-2 mb-2">
            <CreditCard size={18} style={{ color: modeAccent }} />
            <span className="eyebrow">
              {settlementMode === 'customer' ? 'Customer Payment Entry' : 'Supplier Payment Entry'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="stack gap-5">
            <label className="field">
              <span className="muted x-small font-bold uppercase tracking-wider">Select {settlementMode === 'customer' ? 'Client' : 'Vendor'}</span>
              <select
                className="input"
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                required
              >
                <option value="">Choose a {settlementMode}...</option>
                {entities.map(e => (
                  <option key={e._id} value={e._id}>{e.name}</option>
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
                <span className="muted x-small font-bold uppercase tracking-wider">
                  {settlementMode === 'customer' ? 'Amount Received' : 'Amount Paid'}
                </span>
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
                  <option value="CARD">Card Payment</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="TRANSFER">Bank Transfer</option>
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
                <span>Total {settlementMode === 'customer' ? 'Allocated' : 'Settled'}</span>
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
                  Post {settlementMode === 'customer' ? 'Collection' : 'Settlement'}
                </div>
              )}
            </button>
          </form>
        </section>

        {/* Invoices List */}
        <section className="panel p-0 glass-panel overflow-hidden stack gap-0" style={{ borderRadius: '20px' }}>
          <div className="p-6">
            <div className="cluster gap-2 mb-2">
              <Receipt size={18} style={{ color: modeAccent }} />
              <span className="eyebrow">Pending {settlementMode === 'customer' ? 'Receivables' : 'Payables'}</span>
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
                        <p>{selectedEntityId ? `No outstanding invoices for this ${settlementMode}.` : `Select a ${settlementMode} to view pending items.`}</p>
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
