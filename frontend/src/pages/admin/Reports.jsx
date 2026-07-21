import React, { useState, useMemo } from 'react'
import {
  BarChart3,
  Boxes,
  Receipt,
  ShoppingCart,
  Download,
  Search,
  Filter,
  Calendar,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Package,
  Layers
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import { MetricCard } from '../../components/MetricCard'
import { SectionHeading } from '../../components/SectionHeading'
import { formatCurrency, formatDate, exportToCSV } from '../../utils'
import { Pagination } from '../../components/Pagination'

export function Reports({ report, reportRange, setReportRange }) {
  const ranges = ['daily', 'weekly', 'monthly', 'annual']
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [catPage, setCatPage] = useState(1)
  const [skuPage, setSkuPage] = useState(1)
  const catItemsPerPage = 7
  const skuItemsPerPage = 5
  const filteredSales = useMemo(() => {
    const sales = report?.recentSales || []
    if (!ledgerSearch) return sales
    return sales.filter(s => 
      s.invoiceNumber.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (s.customerName || '').toLowerCase().includes(ledgerSearch.toLowerCase())
    )
  }, [report?.recentSales, ledgerSearch])

  // Reset page on search or range change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [ledgerSearch, reportRange])

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const paginatedSales = useMemo(() => {
    return filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredSales, currentPage])

  const catBreakdown = report?.categoryBreakdown || []
  const totalCatPages = Math.ceil(catBreakdown.length / catItemsPerPage)
  const paginatedCats = useMemo(() => {
    return catBreakdown.slice((catPage - 1) * catItemsPerPage, catPage * catItemsPerPage)
  }, [catBreakdown, catPage])

  const topSkus = report?.topSellingProducts || []
  const totalSkuPages = Math.ceil(topSkus.length / skuItemsPerPage)
  const paginatedSkus = useMemo(() => {
    return topSkus.slice((skuPage - 1) * skuItemsPerPage, skuPage * skuItemsPerPage)
  }, [topSkus, skuPage])

  return (
    <div className="stack gap-6 animate-fade">
      {/* Premium Header */}
      <div className="between wrap-row panel p-6 glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', width: '48px', height: '48px' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <SectionHeading
              title="Revenue Intelligence"
              text="Analyze financial velocity and inventory turnover."
            />
          </div>
        </div>
        <div className="cluster gap-3 wrap-row">
          <div className="range-switcher p-1" style={{ background: 'var(--bg-soft)', borderRadius: '14px', display: 'flex', gap: '4px' }}>
            {ranges.map((range) => (
              <button
                key={range}
                className={`btn ${reportRange === range ? 'btn-primary' : ''}`}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '10px', 
                  fontSize: '0.8rem', 
                  textTransform: 'capitalize',
                  background: reportRange === range ? '' : 'transparent',
                  color: reportRange === range ? '' : 'var(--text-soft)',
                  border: 'none',
                  boxShadow: reportRange === range ? 'var(--shadow)' : 'none'
                }}
                onClick={() => setReportRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            className="btn btn-secondary glow-on-hover" 
            style={{ borderRadius: '14px', padding: '10px 20px' }}
            onClick={() => exportToCSV(filteredSales, `Sales_Report_${reportRange}`)}
          >
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      {/* High Density Metrics */}
      <div className="metric-grid">
        <MetricCard
          icon={ShoppingCart}
          title="Gross Revenue"
          value={formatCurrency(report?.summary.totalRevenue ?? 0)}
          helper="Total settled billing"
          accent="var(--accent)"
        />
        <MetricCard
          icon={Receipt}
          title="Order Count"
          value={String(report?.summary.totalOrders ?? 0)}
          helper="Success transactions"
          accent="var(--accent)"
        />
        <MetricCard
          icon={Package}
          title="Units Moved"
          value={String(report?.summary.unitsSold ?? 0)}
          helper="Total items processed"
          accent="var(--accent)"
        />
        <MetricCard
          icon={TrendingUp}
          title="Ticket Mean"
          value={formatCurrency(report?.summary.averageTicket ?? 0)}
          helper="Average bill value"
          accent="var(--accent)"
        />
      </div>

      <div className="grid-2 gap-6">
        {/* Main Pacing Chart */}
        <div className="panel p-6 stack gap-6 glass-panel" style={{ gridColumn: 'span 2' }}>
          <div className="between">
            <SectionHeading
              title="Performance Pacing"
              text="Historical revenue trends for the selected window."
            />
            <div className="pill success-soft cluster gap-2" style={{ fontSize: '0.7rem' }}>
              <ArrowUpRight size={14} />
              Real-time Sync
            </div>
          </div>
          <div style={{ width: '100%', height: '380px', position: 'relative', minWidth: 0 }}>
            {report?.trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={report.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                  <XAxis 
                    dataKey="label" 
                    stroke="var(--muted)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="var(--muted)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value >= 1000 ? (value / 1000) + 'k' : value}`} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--panel-strong)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px', 
                      boxShadow: 'var(--shadow)',
                      color: 'var(--text)' 
                    }}
                    itemStyle={{ color: 'var(--accent-strong)', fontWeight: 700 }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    labelStyle={{ color: 'var(--muted)', marginBottom: '4px' }}
                    cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--accent)" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state compact" style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                <BarChart3 size={48} className="muted mb-3" style={{ opacity: 0.2 }} />
                <p className="muted">No sufficient data for trend analysis.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="panel p-0 glass-panel overflow-hidden">
          <div className="p-6">
            <SectionHeading
              title="High Velocity Items"
              text="Top 5 products driving revenue."
            />
          </div>
          <table className="w-full professional-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Product</th>
                <th className="text-right">Units</th>
                <th className="text-right" style={{ paddingRight: '24px' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSkus.map((p) => (
                <tr key={p.productId} className="table-row-hover">
                  <td style={{ paddingLeft: '24px' }}>
                    <div className="cluster gap-3">
                      {p.image ? (
                        <img src={p.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-soft)', display: 'grid', placeItems: 'center' }}>
                          <Package size={14} className="muted" />
                        </div>
                      )}
                      <div className="stack">
                        <strong className="small">{p.name}</strong>
                        <span className="muted x-small">{p.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-right"><span className="pill neutral small">{p.quantity}</span></td>
                  <td className="text-right font-strong" style={{ paddingRight: '24px', color: 'var(--accent-strong)' }}>
                    {formatCurrency(p.revenue)}
                  </td>
                </tr>
              ))}
              {paginatedSkus.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center p-8 muted small">No sales data recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalSkuPages > 1 && (
            <div className="p-3">
              <Pagination 
                currentPage={skuPage} 
                totalPages={totalSkuPages} 
                onPageChange={setSkuPage} 
                totalItems={topSkus.length} 
                itemsPerPage={skuItemsPerPage} 
              />
            </div>
          )}
        </div>

        {/* Breakdown Lists */}
        <div className="panel p-6 stack gap-6 glass-panel">
          <SectionHeading
            title="Distribution Mix"
            text="Revenue weighted by category and channel."
          />
          <div className="stack gap-5">
            <div className="stack gap-3">
              <div className="cluster gap-2 mb-1">
                <Layers size={14} className="accent-text" />
                <span className="eyebrow" style={{ fontSize: '0.65rem' }}>Top Categories</span>
              </div>
              <div className="stack gap-2">
                {paginatedCats.map((entry) => {
                  const maxVal = Math.max(...catBreakdown.map(b => b.value));
                  const percentage = (entry.value / maxVal) * 100;
                  return (
                    <div key={entry.label} className="stack gap-1">
                      <div className="between x-small">
                        <span className="font-strong">{entry.label}</span>
                        <span className="muted">{formatCurrency(entry.value)}</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--bg-soft)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--success)', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalCatPages > 1 && (
                <Pagination 
                  currentPage={catPage} 
                  totalPages={totalCatPages} 
                  onPageChange={setCatPage} 
                  totalItems={catBreakdown.length} 
                  itemsPerPage={catItemsPerPage} 
                />
              )}
            </div>
            
            <div className="stack gap-3 pt-4" style={{ borderTop: '1px dashed var(--border)' }}>
              <div className="cluster gap-2 mb-1">
                <ShoppingCart size={14} className="accent-text" />
                <span className="eyebrow" style={{ fontSize: '0.65rem' }}>Payment Channels</span>
              </div>
              <div className="grid-2 gap-3">
                {(report?.paymentBreakdown || []).map((entry) => (
                  <div key={entry.label} className="panel-strong p-3 text-center" style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p className="muted x-small uppercase font-strong mb-1">{entry.label}</p>
                    <strong className="accent-text">{formatCurrency(entry.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Transaction Ledger */}
        <div className="panel p-0 glass-panel overflow-hidden stack gap-0" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
          <div className="between p-6 wrap-row gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: '1 1 400px' }}>
              <SectionHeading
                title="Chronological Audit Trail"
                text="Verifiable transaction stream for the active period."
              />
            </div>
            <div className="input-shell compact" style={{ flex: '0 1 320px', minWidth: '200px' }}>
              <Search size={16} className="muted" />
              <input 
                className="ghost-input x-small" 
                placeholder="Search Invoice # or Customer..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-auto" style={{ flex: 1 }}>
            <table className="w-full professional-table">
              <thead style={{ background: 'var(--bg-soft)', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Transaction ID</th>
                  <th>Customer Profile</th>
                  <th>Payment Type</th>
                  <th className="text-right">Valuation</th>
                  <th className="text-right" style={{ paddingRight: '24px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map((sale) => (
                  <tr key={sale._id} className="table-row-hover">
                    <td style={{ paddingLeft: '24px' }}>
                      <div className="cluster gap-2">
                        <FileText size={14} className="muted" />
                        <strong className="small">{sale.invoiceNumber.replace(/^saayi-?/i, '').replace(/^c-/i, 'INVC-')}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="stack">
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{sale.customerName || 'Walk-in Guest'}</span>
                        {sale.cashierName && (
                          <span className="muted x-small" style={{ opacity: 0.8 }}>Processed by {sale.cashierName}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="pill neutral small" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>{sale.paymentMethod}</span>
                    </td>
                    <td className="text-right">
                      <strong className="accent-text" style={{ fontSize: '1rem' }}>{formatCurrency(sale.total)}</strong>
                    </td>
                    <td className="text-right" style={{ paddingRight: '24px' }}>
                      <div className="stack align-end">
                        <span className="small font-strong">{formatDate(sale.createdAt).split(',')[0]}</span>
                        <span className="muted x-small">{formatDate(sale.createdAt).split(',')[1]}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center p-12">
                      <div className="stack align-center gap-3 muted">
                        <Filter size={32} style={{ opacity: 0.3 }} />
                        <p>No transactions match your search filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredSales.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </div>
  )
}
