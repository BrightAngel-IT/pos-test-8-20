import React, { useEffect, useState, useMemo } from 'react'
import { 
  Receipt, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  ChevronRight,
  TrendingUp,
  History,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { authConfig, formatCurrency, formatDate, printReceipt, exportToCSV } from '../../utils'
import { SectionHeading } from '../../components/SectionHeading'

export default function SalesHistory({ api, session, onNotice, company }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('today') // 'today', 'this-month', 'all'

  useEffect(() => {
    fetchSales()
  }, [dateFilter])

  async function fetchSales() {
    setLoading(true)
    try {
      const response = await api.get(`/sales?date=${dateFilter}&cashierId=${session.user._id}`, authConfig(session.token))
      setSales(response.data.sales || [])
    } catch (err) {
      onNotice?.({ type: 'error', text: 'Failed to fetch sales history.' })
    } finally {
      setLoading(false)
    }
  }

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredSales = useMemo(() => {
    return sales.filter(sale => 
      sale.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (sale.customerName || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [sales, search])

  // Reset to first page when search or date filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, dateFilter])

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredSales.slice(start, start + itemsPerPage)
  }, [filteredSales, currentPage])

  const stats = useMemo(() => {
    const total = filteredSales.reduce((sum, s) => sum + s.total, 0)
    const count = filteredSales.length
    
    const breakdown = {
      cash: filteredSales.reduce((sum, s) => {
        if (s.paymentMethod === 'split' && s.splitPayments) {
          const cashPart = s.splitPayments.find(p => p.method === 'cash');
          return sum + (cashPart ? cashPart.amount : 0);
        }
        return sum + (s.paymentMethod === 'cash' ? s.total : 0);
      }, 0),
      card: filteredSales.reduce((sum, s) => {
        if (s.paymentMethod === 'split' && s.splitPayments) {
          const cardPart = s.splitPayments.find(p => p.method === 'card');
          return sum + (cardPart ? cardPart.amount : 0);
        }
        return sum + (s.paymentMethod === 'card' ? s.total : 0);
      }, 0),
      digital: filteredSales.reduce((sum, s) => {
        if (s.paymentMethod === 'split' && s.splitPayments) {
          const upiPart = s.splitPayments.find(p => p.method === 'upi');
          const bankPart = s.splitPayments.find(p => p.method === 'bank-transfer');
          return sum + (upiPart ? upiPart.amount : 0) + (bankPart ? bankPart.amount : 0);
        }
        return sum + (s.paymentMethod === 'upi' || s.paymentMethod === 'bank-transfer' ? s.total : 0);
      }, 0),
    }

    return { total, count, breakdown }
  }, [filteredSales])

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash': return <Banknote size={14} />
      case 'card': return <CreditCard size={14} />
      case 'split': return <Layers size={14} />
      default: return <Smartphone size={14} />
    }
  }

  const getPaymentColor = (method) => {
    switch (method) {
      case 'cash': return 'success'
      case 'card': return 'info'
      case 'upi': return 'warning'
      case 'bank-transfer': return 'accent'
      case 'split': return 'primary'
      default: return 'neutral'
    }
  }

  return (
    <div className="stack gap-6 animate-fade">
      {/* Premium Header Section */}
      <div className="between wrap-row panel p-6 glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', width: '48px', height: '48px' }}>
            <History size={24} />
          </div>
          <div>
            <SectionHeading 
              title="Personal Sales Ledger" 
              text="Audit-ready stream of your processed transactions." 
            />
          </div>
        </div>
        <div className="cluster gap-3 wrap-row">
          <div className="range-switcher p-1" style={{ background: 'var(--bg-soft)', borderRadius: '14px', display: 'flex', gap: '4px' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'this-week', label: 'This Week' },
              { id: 'this-month', label: 'This Month' },
              { id: 'all', label: 'All' }
            ].map(range => (
              <button 
                key={range.id}
                type="button" 
                className={`btn sm ${dateFilter === range.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ 
                  borderRadius: '10px', 
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: dateFilter === range.id ? 700 : 500,
                  boxShadow: dateFilter === range.id ? 'var(--shadow-accent)' : 'none'
                }}
                onClick={() => setDateFilter(range.id)}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button 
            className="btn btn-secondary glow-on-hover" 
            style={{ borderRadius: '14px', padding: '10px 20px' }}
            onClick={() => exportToCSV(filteredSales, `My_Sales_${dateFilter}`)}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* High Density Analytical Metrics */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="panel glass-panel p-5 stack gap-3 glow-on-hover">
          <div className="between">
            <span className="muted eyebrow x-small">Gross Revenue</span>
            <div className="pill success-soft"><TrendingUp size={12} /></div>
          </div>
          <h2 className="font-strong">{formatCurrency(stats.total)}</h2>
          <div className="progress-bar" style={{ height: '4px', background: 'var(--bg-soft)', borderRadius: '2px' }}>
            <div style={{ width: '100%', height: '100%', background: 'var(--success)', borderRadius: '2px' }}></div>
          </div>
        </div>

        <div className="panel glass-panel p-5 stack gap-3 glow-on-hover">
          <div className="between">
            <span className="muted eyebrow x-small">Bills Issued</span>
            <div className="pill info-soft"><Layers size={12} /></div>
          </div>
          <h2 className="font-strong">{stats.count} Bills</h2>
          <span className="muted x-small">Finalized Transactions</span>
        </div>

        <div className="panel glass-panel p-5 stack gap-3 glow-on-hover">
          <div className="between">
            <span className="muted eyebrow x-small">Cash Flow</span>
            <Banknote size={14} className="success-text" />
          </div>
          <h2 className="font-strong" style={{ color: 'var(--success)' }}>{formatCurrency(stats.breakdown.cash)}</h2>
          <span className="muted x-small">Physical Collections</span>
        </div>

        <div className="panel glass-panel p-5 stack gap-3 glow-on-hover">
          <div className="between">
            <span className="muted eyebrow x-small">Digital / Card</span>
            <CreditCard size={14} className="accent-text" />
          </div>
          <h2 className="font-strong" style={{ color: 'var(--accent)' }}>{formatCurrency(stats.breakdown.card + stats.breakdown.digital)}</h2>
          <span className="muted x-small">Electronic Settlement</span>
        </div>
      </div>

      {/* Main Ledger Content */}
      <div className="glass-panel" style={{ 
        borderRadius: '28px', 
        border: '1px solid var(--border)', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '700px', 
        overflow: 'hidden',
        background: 'var(--panel-strong)',
        boxShadow: 'var(--shadow)',
        position: 'relative'
      }}>
        {/* Background Watermark */}
        <div className="document-watermark" style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: '6.5rem',
          fontWeight: 900,
          color: 'var(--text)',
          opacity: 0.02,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}>
          {company?.watermark || (company?.name ? company.name.split(' ')[0] : 'NILMA')}
        </div>
        {/* Header - Fixed */}
        <div className="p-6 border-b" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-soft)', flexShrink: 0 }}>
          <div className="between wrap-row gap-4">
            <div className="input-shell compact" style={{ maxWidth: '450px', flex: 1, background: 'var(--panel-strong)', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <Search size={18} className="muted" />
              <input 
                className="ghost-input" 
                placeholder="Find invoice number, customer name..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div className="cluster gap-4">
              <div className="pill neutral-soft cluster gap-2" style={{ padding: '6px 14px' }}>
                <Filter size={14} />
                <span className="font-strong small">{filteredSales.length} Matches</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', background: 'var(--panel-strong)' }}>
          <table className="w-full professional-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-soft)', zIndex: 20 }}>
                <th style={{ paddingLeft: '24px', borderBottom: '1px solid var(--border)' }}>Invoice ID</th>
                <th style={{ borderBottom: '1px solid var(--border)' }}>Customer Detail</th>
                <th style={{ borderBottom: '1px solid var(--border)' }}>Channel</th>
                <th className="text-right" style={{ borderBottom: '1px solid var(--border)' }}>Valuation</th>
                <th className="text-right" style={{ borderBottom: '1px solid var(--border)' }}>Timestamp</th>
                <th style={{ textAlign: 'right', paddingRight: '24px', borderBottom: '1px solid var(--border)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale, idx) => (
                <tr key={sale._id} className="table-row-hover">
                  <td style={{ paddingLeft: '24px', borderBottom: idx === paginatedSales.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>
                    <div className="cluster gap-2">
                      <div className="avatar sm neutral-soft" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                        <FileText size={16} className="muted" />
                      </div>
                      <strong className="small font-mono">{sale.invoiceNumber.replace(/^saayi-?/i, '').replace(/^c-/i, 'INVC-')}</strong>
                    </div>
                  </td>
                  <td style={{ borderBottom: idx === paginatedSales.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>
                    <div className="stack">
                      <strong className="small">{sale.customerName || 'Walk-in Guest'}</strong>
                      <div className="cluster gap-2 muted x-small">
                        <Layers size={10} />
                        <span>{sale.items.length} Product{sale.items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ borderBottom: idx === paginatedSales.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>
                    <div className="stack gap-1">
                      <div className={`pill ${getPaymentColor(sale.paymentMethod)}-soft cluster gap-2`} style={{ fontSize: '0.65rem', textTransform: 'capitalize', padding: '4px 10px', width: 'fit-content' }}>
                        {getPaymentIcon(sale.paymentMethod)}
                        {sale.paymentMethod}
                      </div>
                      {sale.paymentMethod === 'split' && sale.splitPayments && (
                        <span className="muted x-small font-mono" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                          {sale.splitPayments.map(p => `${p.method}: ${formatCurrency(p.amount)}`).join(' | ')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right" style={{ borderBottom: idx === paginatedSales.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>
                    <strong className="font-strong accent-text" style={{ fontSize: '1rem' }}>{formatCurrency(sale.total)}</strong>
                  </td>
                  <td className="text-right" style={{ borderBottom: idx === paginatedSales.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>
                    <div className="stack align-end">
                      <span className="small font-strong">{new Date(sale.createdAt).toLocaleDateString()}</span>
                      <span className="muted x-small">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px', borderBottom: idx === paginatedSales.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>
                    <div className="cluster gap-1 justify-end">
                      <button className="btn btn-ghost sm" title="View Detailed Bill" onClick={() => printReceipt(sale, session.user, 0, company)}><Eye size={16} /></button>
                      <button className="btn btn-ghost sm" title="Export Document" onClick={() => printReceipt(sale, session.user, 0, company)}><Download size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSales.length === 0 && !loading && (
            <div className="p-20 text-center muted stack align-center gap-4">
              <div className="empty-state-icon" style={{ opacity: 0.1 }}><Receipt size={80} /></div>
              <h3 className="font-strong">No Records Identified</h3>
              <p className="small">We couldn't find any transactions for the selected criteria.</p>
              <button className="btn btn-secondary mt-4" onClick={() => {setSearch(''); setDateFilter('all')}}>Clear All Filters</button>
            </div>
          )}
        </div>

        {/* Footer - Pagination */}
        {totalPages > 1 && (
          <div className="p-4 between border-t" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-soft)', flexShrink: 0 }}>
            <span className="muted x-small font-bold">
              PAGE {currentPage} OF {totalPages} 
              <span style={{ opacity: 0.5, marginLeft: '8px' }}>
                (Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length})
              </span>
            </span>
            <div className="cluster gap-2">
              <button className="btn btn-secondary sm" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
              <div className="cluster gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <button key={i + 1} className={`btn sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCurrentPage(i + 1)} style={{ minWidth: '36px' }}>{i + 1}</button>
                ))}
              </div>
              <button className="btn btn-secondary sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
