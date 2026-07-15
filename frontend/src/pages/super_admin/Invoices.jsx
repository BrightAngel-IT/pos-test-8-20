import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Receipt, 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  AlertCircle,
  Calendar,
  User,
  History
} from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'
import { authConfig, formatCurrency, formatDate, exportToCSV, printReceipt } from '../../utils'

export default function Invoices({ api, session, onNotice, sales: initialSales = [], customers = [], company }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('customer') // 'customer' or 'supplier'
  const [invoices, setInvoices] = useState([])
  const [sales, setSales] = useState(initialSales)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [cashiers, setCashiers] = useState([])
  
  // Filters
  const [dateFilter, setDateFilter] = useState('all') // 'today', 'this-week', 'this-month', 'all'
  const [cashierId, setCashierId] = useState('all')
  const [customerId, setCustomerId] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setCurrentPage(1) // Reset pagination on filter change
    if (activeTab === 'supplier') {
      fetchSupplierInvoices()
    } else {
      fetchSales()
      fetchCashiers()
    }
  }, [activeTab, dateFilter, cashierId, customerId])

  async function fetchSupplierInvoices() {
    setLoading(true)
    try {
      const response = await api.get('/supplier-invoices', authConfig(session.token))
      setInvoices(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      onNotice?.({ type: 'error', text: 'Failed to fetch supplier invoices.' })
    } finally {
      setLoading(false)
    }
  }

  async function fetchSales() {
    setLoading(true)
    try {
      let url = `/sales?date=${dateFilter}`
      if (cashierId !== 'all') url += `&cashierId=${cashierId}`
      const response = await api.get(url, authConfig(session.token))
      setSales(response.data.sales || [])
    } catch (err) {
      onNotice?.({ type: 'error', text: 'Failed to fetch sales invoices.' })
    } finally {
      setLoading(false)
    }
  }

  async function fetchCashiers() {
    try {
      const response = await api.get('/users', authConfig(session.token))
      setCashiers(response.data || [])
    } catch (err) {
      console.error('Failed to fetch cashiers')
    }
  }

  const displayData = useMemo(() => {
    if (activeTab === 'customer') {
      return sales
        .filter(s => {
          if (customerId !== 'all' && s.customerId !== customerId) return false
          return true
        })
        .map(s => ({
          _id: s._id,
          invoiceNo: s.invoiceNumber,
          customerName: s.customerName,
          totalAmount: s.total,
          balanceAmount: s.balanceAmount ?? (s.paymentMethod === 'credit' ? s.total : 0),
          status: s.status ?? (s.paymentMethod === 'credit' ? 'UNPAID' : 'PAID'),
          date: s.createdAt,
          type: 'sale',
          raw: s
        }))
    } else {
      return invoices.map(i => ({
        _id: i._id,
        invoiceNo: i.invoiceNo,
        customerName: i.supplierId?.name || 'Unknown Supplier',
        totalAmount: i.totalAmount,
        balanceAmount: i.balanceAmount,
        status: i.status,
        date: i.date,
        type: 'purchase',
        raw: i
      }))
    }
  }, [activeTab, sales, invoices, customerId])

  const filtered = useMemo(() => {
    return displayData.filter(inv => {
      const invNo = String(inv.invoiceNo || '').toLowerCase();
      const custName = String(inv.customerName || '').toLowerCase();
      const s = search.toLowerCase();
      return invNo.includes(s) || custName.includes(s);
    })
  }, [displayData, search])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  const getStatusPill = (status) => {
    switch (status) {
      case 'PAID': return <span className="pill success">Paid</span>
      case 'PARTIAL': return <span className="pill warning">Partial</span>
      case 'UNPAID': return <span className="pill danger">Unpaid</span>
      default: return <span className="pill neutral">{status}</span>
    }
  }

  return (
    <div className="stack gap-6 animate-fade">
      {/* Header Panel */}
      <div className="between wrap-row panel p-6 glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: 'var(--info-soft)', color: 'var(--info)', border: 'none' }}>
            <Receipt size={24} />
          </div>
          <SectionHeading 
            title="Invoice Central" 
            text="Manage accounts receivable and payable across the organization." 
          />
        </div>
        <div className="cluster gap-2">
          <button 
            className="btn btn-outline" 
            style={{ borderRadius: '10px', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--panel)', border: '1px solid var(--border)' }}
            onClick={() => exportToCSV(filtered, `${activeTab}_Invoices_Report`)}
          >
            <Download size={14} />
            Export Excel
          </button>
          <div className="range-switcher p-1" style={{ background: 'var(--bg-soft)', borderRadius: '12px' }}>
            <button 
              className={`btn ${activeTab === 'customer' ? 'btn-primary' : ''}`} 
              style={{ borderRadius: '10px', fontSize: '0.8rem', background: activeTab === 'customer' ? '' : 'transparent', color: activeTab === 'customer' ? '' : 'var(--text-soft)', border: 'none' }}
              onClick={() => setActiveTab('customer')}
            >
              Sales Invoices
            </button>
            <button 
              className={`btn ${activeTab === 'supplier' ? 'btn-primary' : ''}`} 
              style={{ borderRadius: '10px', fontSize: '0.8rem', background: activeTab === 'supplier' ? '' : 'transparent', color: activeTab === 'supplier' ? '' : 'var(--text-soft)', border: 'none' }}
              onClick={() => setActiveTab('supplier')}
            >
              Purchase Invoices
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="panel glass-panel p-6 stack gap-6">
        <div className="between wrap-row gap-4">
          <div className="input-shell compact" style={{ maxWidth: '400px', flex: 1 }}>
            <Search size={18} className="muted" />
            <input 
              className="ghost-input" 
              placeholder="Search by invoice # or name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="cluster gap-3 wrap-row">
            {activeTab === 'customer' && (
              <>
                <div className="cluster gap-2">
                  <User size={16} className="muted" />
                  <select 
                    className="ghost-input small" 
                    style={{ borderBottom: '1px solid var(--border)', padding: '4px' }}
                    value={cashierId}
                    onChange={e => setCashierId(e.target.value)}
                  >
                    <option value="all">All Cashiers</option>
                    {cashiers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
                
                <div className="cluster gap-2">
                  <User size={16} className="muted" />
                  <select 
                    className="ghost-input small" 
                    style={{ borderBottom: '1px solid var(--border)', padding: '4px' }}
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                  >
                    <option value="all">All Customers</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="cluster gap-2">
              <Calendar size={16} className="muted" />
              <div className="range-switcher p-1" style={{ background: 'var(--bg-soft)', borderRadius: '10px' }}>
                {['today', 'this-week', 'this-month', 'all'].map(r => (
                  <button 
                    key={r}
                    className={`btn btn-sm ${dateFilter === r ? 'btn-primary' : ''}`}
                    style={{ 
                      borderRadius: '8px', 
                      fontSize: '0.7rem', 
                      padding: '4px 10px',
                      background: dateFilter === r ? '' : 'transparent',
                      color: dateFilter === r ? '' : 'var(--text-soft)',
                      border: 'none'
                    }}
                    onClick={() => setDateFilter(r)}
                  >
                    {r.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full professional-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Invoice Details</th>
                <th>{activeTab === 'customer' ? 'Customer' : 'Supplier'}</th>
                <th>Total Value</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(inv => (
                <tr key={inv._id} className="table-row-hover">
                  <td style={{ paddingLeft: '24px' }}>
                    <div className="cluster gap-2">
                      <FileText size={14} className="muted" />
                      <strong className="small font-mono">{inv.invoiceNo}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="stack cursor-pointer hover-accent" onClick={() => {
                      const entityId = activeTab === 'customer' 
                        ? (inv.raw.customerId?._id || inv.raw.customerId)
                        : (inv.raw.supplierId?._id || inv.raw.supplierId);
                      if (entityId) navigate(`/accounts/${activeTab}/${entityId}`);
                    }}>
                      <strong className="small">{inv.customerName}</strong>
                      <span className="muted x-small">
                        {activeTab === 'customer' && inv.raw.cashier ? `By: ${inv.raw.cashier.name}` : `Transaction: ${inv.type}`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="font-strong">{formatCurrency(inv.totalAmount)}</span>
                  </td>
                  <td>
                    <span className={inv.balanceAmount > 0 ? 'danger-text font-strong' : 'success-text'}>
                      {formatCurrency(inv.balanceAmount)}
                    </span>
                  </td>
                  <td>{getStatusPill(inv.status)}</td>
                  <td>
                    <span className="muted small">{formatDate(inv.date)}</span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div className="cluster gap-2 justify-end">
                      {activeTab === 'customer' && (
                        <>
                          <button 
                            className="icon-btn sm glow-on-hover" 
                            title="Preview"
                            onClick={() => printReceipt(inv.raw, session.user, 0, company)}
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="icon-btn sm glow-on-hover" 
                            title="Download"
                            onClick={() => printReceipt(inv.raw, session.user, 0, company)}
                          >
                            <Download size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center muted stack align-center gap-4">
              <History size={48} opacity={0.1} />
              <p>No invoices matching your criteria.</p>
            </div>
          )}
          {loading && (
            <div className="p-12 text-center muted stack align-center gap-4">
              <div className="spinner" />
              <p>Fetching invoice records...</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="between p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-soft)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
            <span className="muted small">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="cluster gap-2">
              <button 
                className="btn btn-ghost btn-sm" 
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(prev => prev - 1);
                  document.querySelector('.overflow-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Previous
              </button>
              <div className="cluster gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i} 
                    className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => {
                      setCurrentPage(i + 1);
                      document.querySelector('.overflow-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ minWidth: '32px' }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                className="btn btn-ghost btn-sm" 
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(prev => prev + 1);
                  document.querySelector('.overflow-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
