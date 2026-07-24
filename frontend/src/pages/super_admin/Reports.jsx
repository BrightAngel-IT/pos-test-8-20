/**
 * Module: Reports
 * 
 * React UI page component representing the Reports view.
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  BarChart3,
  Receipt,
  ShoppingCart,
  Download,
  Calendar,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Package,
  Building2
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { MetricCard } from '../../components/MetricCard'
import { SectionHeading } from '../../components/SectionHeading'
import { formatCurrency, formatDate, exportToCSV, authConfig } from '../../utils'
import { Pagination } from '../../components/Pagination'

export function SuperAdminReports({ api, session }) {
  const location = useLocation()
  const ranges = ['daily', 'weekly', 'monthly', 'annual']
  const [reportRange, setReportRange] = useState('weekly')
  const [selectedBranch, setSelectedBranch] = useState(location.state?.branch || '') // empty string means "All Branches"
  const [branches, setBranches] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [catPage, setCatPage] = useState(1)
  const [skuPage, setSkuPage] = useState(1)
  const catItemsPerPage = 7
  const skuItemsPerPage = 5

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await api.get('/branches', authConfig(session.token))
        setBranches(res.data)
      } catch (err) {
        console.error('Failed to load branches:', err)
      }
    }
    loadBranches()
  }, [])

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true)
        let url = `/reports/sales?range=${reportRange}`
        if (selectedBranch) {
          url += `&branch=${encodeURIComponent(selectedBranch)}`
        }
        const res = await api.get(url, authConfig(session.token))
        setReport(res.data)
      } catch (err) {
        console.error('Failed to load sales report:', err)
      } finally {
        setLoading(false)
      }
    }
    loadReport()
    setCurrentPage(1)
  }, [reportRange, selectedBranch])

  const filteredSales = useMemo(() => {
    const sales = report?.recentSales || []
    if (!ledgerSearch) return sales
    return sales.filter(s => 
      s.invoiceNumber.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (s.customerName || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (s.branch || '').toLowerCase().includes(ledgerSearch.toLowerCase())
    )
  }, [report?.recentSales, ledgerSearch])

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1)
  }, [ledgerSearch])

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

  if (loading && !report) {
    return (
      <div className="panel loading-state">
        <div className="spinner" />
        <p>Crunching consolidated intelligence...</p>
      </div>
    )
  }

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
              title="Consolidated Intelligence"
              text="Analyze financial velocity and metrics across the entire branch network."
            />
          </div>
        </div>

        <div className="cluster gap-3 wrap-row align-center">
          {/* Branch Filter Selector */}
          <div className="cluster gap-2 align-center" style={{ background: 'var(--bg-soft)', padding: '6px 12px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <Building2 size={16} className="muted" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </div>

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
            onClick={() => exportToCSV(filteredSales, `Consolidated_Sales_Report_${reportRange}`)}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="metric-grid">
        <MetricCard
          icon={ShoppingCart}
          title="Gross Revenue"
          value={formatCurrency(report?.summary.totalRevenue ?? 0)}
          helper={selectedBranch ? `${selectedBranch} Storefront` : 'Across all terminals'}
        />
        <MetricCard
          icon={Receipt}
          title="Order Count"
          value={String(report?.summary.totalOrders ?? 0)}
          helper="Success transactions"
        />
        <MetricCard
          icon={Package}
          title="Units Moved"
          value={String(report?.summary.unitsSold ?? 0)}
          helper="Total items processed"
        />
        <MetricCard
          icon={TrendingUp}
          title="Ticket Mean"
          value={formatCurrency(report?.summary.averageTicket ?? 0)}
          helper="Average bill value"
        />
      </div>

      {/* Chart Section */}
      <div className="grid-2 gap-6">
        <div className="panel p-6 stack gap-6 glass-panel" style={{ gridColumn: 'span 2' }}>
          <div className="between align-center">
            <SectionHeading
              title="Consolidated Performance Pacing"
              text="Historical revenue pacing trends for the selected network nodes."
            />
            <div className="pill success-soft cluster gap-2" style={{ fontSize: '0.7rem' }}>
              <ArrowUpRight size={14} />
              Real-time Sync
            </div>
          </div>
          <div style={{ width: '100%', height: '360px' }}>
            {report?.trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.trend}>
                  <defs>
                    <linearGradient id="colorReportSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--text-soft)" fontSize={12} />
                  <YAxis stroke="var(--text-soft)" fontSize={12} tickFormatter={(val) => `LKR ${val}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fillOpacity={1} fill="url(#colorReportSales)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="stack align-center justify-center h-full muted small">No billing trend data available for this range.</div>
            )}
          </div>
        </div>
      </div>

      {/* Category Split & Top Products */}
      <div className="grid-2 gap-6">
        {/* Category Breakdown */}
        <div className="panel p-6 stack gap-5" style={{ alignSelf: 'start' }}>
          <SectionHeading title="Category Volume" text="Revenue performance by product group." />
          <div className="stack gap-3">
            {paginatedCats.map((cat, idx) => (
              <div key={idx} className="stack gap-2">
                <div className="between small">
                  <strong>{cat.label}</strong>
                  <span className="accent-text font-bold">{formatCurrency(cat.value)}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--accent), var(--accent-strong))', 
                      width: `${report?.summary.totalRevenue ? (cat.value / report.summary.totalRevenue) * 100 : 0}%` 
                    }} 
                  />
                </div>
              </div>
            ))}
            {paginatedCats.length === 0 && <p className="muted small text-center">No categories recorded.</p>}
            
            {totalCatPages > 1 && (
              <div className="pt-3 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <Pagination 
                  currentPage={catPage} 
                  totalPages={totalCatPages} 
                  onPageChange={setCatPage} 
                  totalItems={catBreakdown.length} 
                  itemsPerPage={catItemsPerPage} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="panel p-6 stack gap-5" style={{ alignSelf: 'start' }}>
          <SectionHeading title="Top Velocity SKUs" text="High velocity products by billing contribution." />
          <div className="stack gap-3">
            {paginatedSkus.map((p, idx) => (
              <div key={idx} className="list-row p-3 panel-strong glow-on-hover" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div className="cluster gap-3">
                  <img src={p.image} alt={p.name} className="thumb" style={{ borderRadius: '8px' }} />
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                    <p className="muted small" style={{ fontSize: '0.75rem' }}>{p.quantity} units sold · {p.category}</p>
                  </div>
                </div>
                <strong className="accent-text" style={{ fontSize: '0.9rem' }}>{formatCurrency(p.revenue)}</strong>
              </div>
            ))}
            {paginatedSkus.length === 0 && <p className="muted small text-center">No velocity data.</p>}
            
            {totalSkuPages > 1 && (
              <div className="pt-3 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
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
        </div>
      </div>

      {/* Ledger Details */}
      <div className="panel p-6 stack gap-5 mt-6">
        <div className="between wrap-row align-center">
          <SectionHeading title="General Sales Ledger" text="Transaction logs matching the criteria." />
          <div className="search-input small" style={{ width: '100%', maxWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search invoice, customer, branch..."
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="stack gap-3">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Customer</th>
                <th>Cashier</th>
                <th>Refund status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale) => (
                <tr key={sale._id}>
                  <td>
                    <div className="cluster gap-2 align-center">
                      <FileText size={14} className="muted" />
                      <strong>{sale.invoiceNumber.replace(/^saayi-?/i, '').replace(/^c-/i, 'INVC-')}</strong>
                    </div>
                  </td>
                  <td>{formatDate(sale.createdAt)}</td>
                  <td><span className="rack-tag">{sale.branch || 'Main Branch'}</span></td>
                  <td>{sale.customerName}</td>
                  <td>{sale.cashierName}</td>
                  <td>
                    <span className={`pill ${sale.status === 'PAID' ? 'success-soft' : 'warning-soft'}`} style={{ fontSize: '0.65rem' }}>
                      {sale.status}
                    </span>
                  </td>
                  <td><strong>{formatCurrency(sale.total)}</strong></td>
                </tr>
              ))}
              {paginatedSales.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px 0' }} className="muted">No sales records match this query.</td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
                totalItems={filteredSales.length} 
                itemsPerPage={itemsPerPage} 
              />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
