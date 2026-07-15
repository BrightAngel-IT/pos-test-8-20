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
  FileText
} from 'lucide-react'
import { MetricCard } from '../../components/MetricCard'
import { SectionHeading } from '../../components/SectionHeading'
import { formatCurrency, formatDate, authConfig } from '../../utils'

export function SuperAdminDashboard({ api, session }) {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [overviewRes, branchesRes] = await Promise.all([
          api.get('/dashboard/overview', authConfig(session.token)),
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
  }, [api])

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
      {/* Metrics Row */}
      <section className="metric-grid">
        <MetricCard
          icon={TrendingUp}
          title="Consolidated Rev (7d)"
          value={formatCurrency(overview?.metrics.revenueWeekly ?? 0)}
          helper={`Monthly velocity: ${formatCurrency(overview?.metrics.revenueMonthly ?? 0)}`}
        />
        <MetricCard
          icon={Warehouse}
          title="Consolidated Stock"
          value={formatCurrency(overview?.metrics.inventoryValue ?? 0)}
          helper={`Across ${overview?.metrics.totalProducts ?? 0} SKUs`}
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
            )})}
          </div>
        </section>

        {/* Recent Operations */}
        <section className="panel p-6 stack gap-5">
          <SectionHeading
            title="Recent Activity"
            text="Latest transactions across all terminals."
          />
          <div className="stack gap-3">
            {(overview?.recentSales || []).slice(0, 7).map((sale) => (
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
                    <strong style={{ fontSize: '0.9rem' }}>{sale.invoiceNumber}</strong>
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
    </div>
  )
}
