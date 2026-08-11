/**
 * Module: Dashboard
 * 
 * React UI page component representing the Dashboard view.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  TrendingUp,
  Warehouse,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileText,
  ShoppingCart,
  Package,
  CornerDownLeft,
  CornerUpLeft,
  CreditCard,
  RefreshCcw,
  X,
  Zap
} from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { MetricCard } from '../../components/MetricCard'
import { SectionHeading } from '../../components/SectionHeading'
import { formatCurrency, formatDate, authConfig } from '../../utils'

export function SuperAdminDashboard({ api, session }) {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showActivitiesModal, setShowActivitiesModal] = useState(false)
  const [selectedActivityCategory, setSelectedActivityCategory] = useState(null)
  const [trendRange, setTrendRange] = useState('monthly')
  const [customDates, setCustomDates] = useState({ start: '', end: '' })
  const [selectedBranch, setSelectedBranch] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [overviewRes, branchesRes] = await Promise.all([
          api.get(`/dashboard/overview?trendRange=${trendRange}&startDate=${customDates.start}&endDate=${customDates.end}${selectedBranch ? `&branch=${encodeURIComponent(selectedBranch)}` : ''}`, authConfig(session.token)),
          api.get('/branches', authConfig(session.token))
        ])
        setOverview(overviewRes.data)
        setBranches(branchesRes.data)
      } catch (err) {
        console.error('Error fetching super admin dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [api, trendRange, customDates.start, customDates.end, selectedBranch])

  if (loading) {
    return (
      <div className="panel loading-state">
        <div className="spinner" />
        <p>Analyzing corporate workspace...</p>
      </div>
    )
  }

  return (
    <div className="stack gap-6 animate-fade">
      {/* Filters Row */}
      <div className="between align-center panel p-4 glass-panel" style={{ borderRadius: '16px' }}>
        <h2 className="font-strong m-0">Operations Command</h2>
        <div className="cluster gap-3 wrap">
          {trendRange === 'custom' && (
            <div className="cluster gap-2 align-center">
              <input type="date" className="input" value={customDates.start} onChange={e => setCustomDates(prev => ({ ...prev, start: e.target.value }))} style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
              <span className="muted small">to</span>
              <input type="date" className="input" value={customDates.end} onChange={e => setCustomDates(prev => ({ ...prev, end: e.target.value }))} style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
            </div>
          )}
          <select 
            className="input" 
            value={trendRange} 
            onChange={e => setTrendRange(e.target.value)} 
            style={{ padding: '8px 12px', fontSize: '0.9rem', width: '160px', backgroundColor: 'var(--panel-strong)' }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
            <option value="custom">Custom Range</option>
          </select>

          <select 
            className="input" 
            value={selectedBranch} 
            onChange={e => setSelectedBranch(e.target.value)} 
            style={{ padding: '8px 12px', fontSize: '0.9rem', width: '200px', backgroundColor: 'var(--panel-strong)' }}
          >
            <option value="">All Branches</option>
            {branches.filter(b => b.status === 'active').map(b => (
              <option key={b._id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="metric-grid">
        <MetricCard
          icon={TrendingUp}
          title={selectedBranch ? "Branch Monthly Rev" : "Consolidated Monthly Rev"}
          value={formatCurrency(overview?.metrics.revenueMonthly ?? 0)}
          helper="Current month sales"
        />
        <MetricCard
          icon={Warehouse}
          title={selectedBranch ? "Branch Stock" : "Consolidated Stock"}
          value={formatCurrency(overview?.metrics.inventoryValue ?? 0)}
          helper={`Across ${overview?.metrics.totalProducts ?? 0} SKUs`}
        />
        <MetricCard
          icon={Zap}
          title={selectedBranch ? "Branch Balance" : "Consolidated Balance"}
          value={formatCurrency(overview?.metrics.totalBalance ?? 0)}
          helper={selectedBranch ? "Net cash position for branch" : "Net cash position across all branches"}
        />
        <MetricCard
          icon={Building2}
          title="Active Branches"
          value={String(branches.filter(b => b.status === 'active').length)}
          helper={`Out of ${branches.length} registered`}
        />
        <MetricCard
          icon={Users}
          title="System Operators"
          value={String(overview?.metrics.activeUsers ?? 0)}
          helper="Total branch employees"
        />
      </section>

      {/* Main Directory & Activity */}
      <div className="grid-2 gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {/* Branches Console */}
        <section className="panel p-6 stack gap-5 glass-panel">
          <div className="between align-center">
            <SectionHeading
              title="Branch Directory"
              text="Corporate network of storefronts and distribution warehouses."
            />
            <button
              className="btn btn-primary"
              style={{ padding: '10px 16px', borderRadius: '12px' }}
              onClick={() => navigate('/super-admin/branches')}
            >
              <Plus size={16} />
              Register Branch
            </button>
          </div>

          <div className="grid-2 gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[...branches].sort((a, b) => a.name === 'Main Branch' ? -1 : b.name === 'Main Branch' ? 1 : a.name.localeCompare(b.name)).map((branch) => {
              const isMain = branch.name === 'Main Branch' || branch.name === 'Main Warehouse';
              return (
                <div
                  key={branch._id}
                  className="panel-strong glow-on-hover p-4 cursor-pointer stack gap-3 relative"
                  style={{
                    borderRadius: '16px',
                    border: isMain ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: isMain ? 'linear-gradient(145deg, var(--panel), var(--accent-soft))' : 'linear-gradient(145deg, var(--panel-strong), var(--bg-soft))'
                  }}
                  onClick={() => navigate(`/super-admin/branches/${encodeURIComponent(branch.name)}`)}
                >
                  <div className="between align-center">
                    <div className="cluster gap-2">
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'var(--accent-soft)',
                          color: 'var(--accent-strong)',
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        <Building2 size={18} />
                      </div>
                      <strong style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                        {branch.name}
                        {isMain && <span className="pill small accent ml-2" style={{ fontSize: '0.6rem' }}>HEADQUARTERS</span>}
                      </strong>
                    </div>
                    <span className={`pill ${branch.status === 'active' ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem' }}>
                      {branch.status}
                    </span>
                  </div>

                  <div className="stack gap-1 muted small">
                    <p>📍 {branch.location || 'No location set'}</p>
                    <p>📞 {branch.phone || 'No phone set'}</p>
                    <p>👤 Manager: {branch.manager || 'Unassigned'}</p>
                  </div>

                  <div className="between align-center pt-2" style={{ borderTop: '1px solid var(--border)', marginTop: '4px' }}>
                    <span className="accent-text font-bold small cluster gap-1 align-center">
                      Enter Cockpit
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>



        {/* Recent Operations */}
        <section className="panel p-6 stack gap-5">
          <div className="cluster gap-2">
            <SectionHeading
              title="Recent Activity"
              text="Latest transactions across all terminals."
            />
            <button className="btn btn-outline btn-sm" onClick={() => setShowActivitiesModal(true)} title="See all activities">See All</button>

          </div>
          <div className="stack gap-3">
            {(overview?.recentSales || []).slice(0, 6).map((sale) => (
              <div
                key={sale._id}
                className="list-row p-3 panel-strong glow-on-hover"
                style={{
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'between',
                  alignItems: 'center'
                }}
              >
                <div className="stack gap-1">
                  <div className="cluster gap-2">
                    <FileText size={14} className="muted" />
                    <strong style={{ fontSize: '0.9rem' }}>{sale.invoiceNumber.replace(/^saayi-?/i, '').replace(/^c-/i, 'INVC-')}</strong>
                  </div>
                  <p className="muted small" style={{ fontSize: '0.75rem' }}>
                    🏢 {sale.branch} · 👤 {sale.cashierName}
                  </p>
                </div>
                <strong style={{ color: 'var(--accent-strong)', fontSize: '0.95rem' }}>
                  {formatCurrency(sale.total)}
                </strong>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Monthly Sales Trend */}
      <section className="panel p-6 stack gap-5 mt-6">

        <div className="between align-center">
          <SectionHeading title="Sales Trend" text="Revenue progression across selected timeline." />
        </div>

        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer>
            <BarChart data={overview?.branchMonthlySales || []} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-soft)" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" tickMargin={15} />
              <YAxis stroke="var(--text-soft)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                      <p className="font-strong mb-2">{label}</p>
                      {payload.map((entry, index) => (
                        <div key={index} className="cluster gap-2 mb-1">
                          <div style={{ width: '12px', height: '12px', backgroundColor: entry.color, borderRadius: '3px' }} />
                          <span className="small">{entry.name} : {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }} cursor={{ fill: 'var(--accent)', opacity: 0.1 }} />
              {(overview?.allBranches || []).map((branch, index) => {
                const colors = ['var(--accent)', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                return (
                  <Bar
                    key={branch}
                    dataKey={branch}
                    name={branch}
                    fill={colors[index % colors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>


      {/* Expanded Activities Modal */}
      {showActivitiesModal && (
        <div className="modal-backdrop animate-fade" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="panel p-6" style={{ width: '90vw', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}>
            <div className="between align-center mb-5">
              <SectionHeading title="All Recent Activities" text="Comprehensive view of all recent transactions across the system." />
              <button className="icon-btn hover-danger" onClick={() => setShowActivitiesModal(false)}><X size={24} /></button>
            </div>

            <div className="grid-3 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

              {/* Billing Column */}
              <div className="stack gap-3">
                <div className="between align-center">
                  <h4 className="cluster gap-2"><ShoppingCart size={16} className="accent-text" /> Billing (Sales)</h4>
                  <button className="btn btn-sm btn-outline" onClick={() => setSelectedActivityCategory('billing')}>See All</button>
                </div>
                <div className="stack gap-2">
                  {(overview?.recentSales || []).slice(0, 6).map(sale => (
                    <div key={sale._id} className="p-3 panel-strong glow-on-hover small" style={{ borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div className="between align-center mb-1">
                        <strong>{sale.invoiceNumber}</strong>
                        <span className="accent-text font-bold">{formatCurrency(sale.total)}</span>
                      </div>
                      <div className="muted">{sale.branch} &middot; {sale.cashierName}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchase Column */}
              <div className="stack gap-3">
                <div className="between align-center">
                  <h4 className="cluster gap-2"><Warehouse size={16} className="accent-text" /> Purchases</h4>
                  <button className="btn btn-sm btn-outline" onClick={() => setSelectedActivityCategory('purchases')}>See All</button>
                </div>
                <div className="stack gap-2">
                  {(overview?.recentPurchases || []).slice(0, 6).map(p => (
                    <div key={p._id} className="p-3 panel-strong glow-on-hover small" style={{ borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div className="between align-center mb-1">
                        <strong>{p.invoiceNumber || p._id.substring(0, 8)}</strong>
                        <span className="accent-text font-bold">{formatCurrency(p.total)}</span>
                      </div>
                      <div className="muted">{p.supplierName}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Returns Column */}
              <div className="stack gap-3">
                <div className="between align-center">
                  <h4 className="cluster gap-2"><RefreshCcw size={16} className="accent-text" /> Returns (Customer)</h4>
                  <button className="btn btn-sm btn-outline" onClick={() => setSelectedActivityCategory('returns_customer')}>See All</button>
                </div>
                <div className="stack gap-2">
                  {(overview?.recentCustomerReturns || []).slice(0, 6).map(r => (
                    <div key={r._id} className="p-3 panel-strong glow-on-hover small" style={{ borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div className="between align-center mb-1">
                        <strong>{r.returnNo}</strong>
                        <span className="accent-text font-bold">{formatCurrency(r.totalAmount)}</span>
                      </div>
                      <div className="muted">{r.entityName || 'Customer'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supplier Returns Column */}
              <div className="stack gap-3">
                <div className="between align-center">
                  <h4 className="cluster gap-2"><RefreshCcw size={16} className="accent-text" /> Returns (Supplier)</h4>
                  <button className="btn btn-sm btn-outline" onClick={() => setSelectedActivityCategory('returns_supplier')}>See All</button>
                </div>
                <div className="stack gap-2">
                  {(overview?.recentSupplierReturns || []).slice(0, 6).map(r => (
                    <div key={r._id} className="p-3 panel-strong glow-on-hover small" style={{ borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div className="between align-center mb-1">
                        <strong>{r.returnNo}</strong>
                        <span className="accent-text font-bold">{formatCurrency(r.totalAmount)}</span>
                      </div>
                      <div className="muted">{r.entityName || 'Supplier'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Settlements */}
              <div className="stack gap-3">
                <div className="between align-center">
                  <h4 className="cluster gap-2"><CreditCard size={16} className="accent-text" /> Settlements (Customer)</h4>
                  <button className="btn btn-sm btn-outline" onClick={() => setSelectedActivityCategory('settlements_customer')}>See All</button>
                </div>
                <div className="stack gap-2">
                  {(overview?.recentCustomerSettlements || []).slice(0, 6).map(s => (
                    <div key={s._id} className="p-3 panel-strong glow-on-hover small" style={{ borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div className="between align-center mb-1">
                        <strong>{s.invoiceNo}</strong>
                        <span className="accent-text font-bold">{formatCurrency(s.totalAmount - s.balanceAmount)} Paid</span>
                      </div>
                      <div className="muted">{s.customerId?.name || 'Customer'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supplier Settlements */}
              <div className="stack gap-3">
                <div className="between align-center">
                  <h4 className="cluster gap-2"><CreditCard size={16} className="accent-text" /> Settlements (Supplier)</h4>
                  <button className="btn btn-sm btn-outline" onClick={() => setSelectedActivityCategory('settlements_supplier')}>See All</button>
                </div>
                <div className="stack gap-2">
                  {(overview?.recentSupplierSettlements || []).slice(0, 6).map(s => (
                    <div key={s._id} className="p-3 panel-strong glow-on-hover small" style={{ borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div className="between align-center mb-1">
                        <strong>{s.invoiceNo}</strong>
                        <span className="accent-text font-bold">{formatCurrency(s.totalAmount - s.balanceAmount)} Paid</span>
                      </div>
                      <div className="muted">{s.supplierId?.name || 'Supplier'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedActivityCategory && (
        <div className="modal-overlay animate-fade" onClick={() => setSelectedActivityCategory(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content animate-slide-up panel p-6" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto', borderRadius: '12px' }}>
            <div className="between align-center mb-4">
              <h3 className="font-strong">
                {selectedActivityCategory === 'billing' && 'All Recent Billing (Sales)'}
                {selectedActivityCategory === 'purchases' && 'All Recent Purchases'}
                {selectedActivityCategory === 'returns_customer' && 'All Recent Returns (Customer)'}
                {selectedActivityCategory === 'returns_supplier' && 'All Recent Returns (Supplier)'}
                {selectedActivityCategory === 'settlements_customer' && 'All Recent Settlements (Customer)'}
                {selectedActivityCategory === 'settlements_supplier' && 'All Recent Settlements (Supplier)'}
              </h3>
              <button className="icon-btn hover-danger" onClick={() => setSelectedActivityCategory(null)}><X size={24} /></button>
            </div>

            <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Entity</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedActivityCategory === 'billing' && (overview?.recentSales || []).map(s => (
                    <tr key={s._id}>
                      <td>{s.receiptNumber || s.invoiceNo || s.invoiceNumber}</td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td>{s.customerName || s.customer?.name || 'Walk-in'}</td>
                      <td className="text-right accent-text font-bold">{s.total ? `$${s.total}` : '-'}</td>
                    </tr>
                  ))}
                  {selectedActivityCategory === 'purchases' && (overview?.recentPurchases || []).map(p => (
                    <tr key={p._id}>
                      <td>{p._id.substring(0, 8)}</td>
                      <td>{new Date(p.date || p.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td>{p.supplierName}</td>
                      <td className="text-right accent-text font-bold">{p.total ? `$${p.total}` : '-'}</td>
                    </tr>
                  ))}
                  {selectedActivityCategory === 'returns_customer' && (overview?.recentCustomerReturns || []).map(r => (
                    <tr key={r._id}>
                      <td>{r.returnNo}</td>
                      <td>{new Date(r.createdAt || r.date || Date.now()).toLocaleDateString()}</td>
                      <td>{r.entityName || r.customer?.name || r.customerName || 'Customer'}</td>
                      <td className="text-right text-red font-bold">-{r.totalAmount ? `$${r.totalAmount}` : '-'}</td>
                    </tr>
                  ))}
                  {selectedActivityCategory === 'returns_supplier' && (overview?.recentSupplierReturns || []).map(r => (
                    <tr key={r._id}>
                      <td>{r.returnNo}</td>
                      <td>{new Date(r.createdAt || r.date || Date.now()).toLocaleDateString()}</td>
                      <td>{r.entityName || r.supplier?.name || r.supplierName || 'Supplier'}</td>
                      <td className="text-right text-green font-bold">+{r.totalAmount ? `$${r.totalAmount}` : '-'}</td>
                    </tr>
                  ))}
                  {selectedActivityCategory === 'settlements_customer' && (overview?.recentCustomerSettlements || []).map(s => (
                    <tr key={s._id}>
                      <td>{s.invoiceNo}</td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td>{s.customerId?.name || 'Customer'}</td>
                      <td className="text-right text-green font-bold">+{s.totalAmount ? `$${s.totalAmount - (s.balanceAmount || 0)}` : '-'}</td>
                    </tr>
                  ))}
                  {selectedActivityCategory === 'settlements_supplier' && (overview?.recentSupplierSettlements || []).map(s => (
                    <tr key={s._id}>
                      <td>{s.invoiceNo}</td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td>{s.supplierId?.name || 'Supplier'}</td>
                      <td className="text-right text-red font-bold">-{s.totalAmount ? `$${s.totalAmount - (s.balanceAmount || 0)}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
