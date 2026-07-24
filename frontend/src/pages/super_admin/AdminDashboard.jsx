/**
 * Module: AdminDashboard
 * 
 * React UI page component representing the AdminDashboard view.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Warehouse,
  ShoppingCart,
  PackagePlus,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertCircle,
  FileText,
  UserPlus,
} from 'lucide-react'
import { MetricCard } from '../../components/MetricCard'
import { SectionHeading } from '../../components/SectionHeading'
import { formatCurrency, formatDate } from '../../utils'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

const CHART_COLORS = [
  'var(--accent)',
  'var(--info)',
  'var(--success)',
  'var(--warning)',
  'var(--danger)',
  '#8884d8',
  '#82ca9d'
];

export function AdminDashboard({ overview, session, startTransition }) {
  const navigate = useNavigate()
  const quickActions = [
    { label: 'New Bill', icon: ShoppingCart, path: '/pos', color: 'var(--accent)' },
    { label: 'Add SKU', icon: PackagePlus, path: '/inventory', color: 'var(--info)' },
    { label: 'View Reports', icon: Zap, path: '/reports', color: 'var(--success)' },
    { label: 'Manage Staff', icon: UserPlus, path: '/staff', color: 'var(--text-soft)' },
  ]

  return (
    <div className="stack gap-6 animate-fade">
      <section className="metric-grid">
        <MetricCard
          icon={Warehouse}
          title="Inventory Assets"
          value={formatCurrency(overview?.metrics.inventoryValue ?? 0)}
          helper={`Market value of ${overview?.metrics.totalStock ?? 0} units`}
        />
        <MetricCard
          icon={TrendingUp}
          title="Monthly Revenue"
          value={formatCurrency(overview?.metrics.revenueMonthly ?? 0)}
          helper="Current month sales"
        />
        <MetricCard
          icon={AlertCircle}
          title="Critical Alerts"
          value={String(overview?.metrics.lowStockCount ?? 0)}
          helper="Items requiring immediate restock"
          variant={overview?.metrics.lowStockCount > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          icon={ShieldCheck}
          title="Terminal Mode"
          value="Administrator"
          helper={`${overview?.metrics.activeUsers ?? 0} active session(s)`}
        />
      </section>

      <section className="panel p-6 stack gap-5 glass-panel">
        <SectionHeading title="Admin Shortcuts" text="Accelerate your workflow with one-click access." />
        <div className="cluster gap-4 wrap-row">
          {quickActions.map((action) => (
            <button
              key={action.label}
              className="quick-action-card glow-on-hover"
              style={{ flex: 1, minWidth: '160px' }}
              onClick={() => navigate(action.path)}
            >
              <div className="quick-action-icon" style={{ color: action.color }}>
                <action.icon size={24} />
              </div>
              <span className="font-strong" style={{ fontSize: '0.9rem' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <div className="panel p-6 stack gap-5">
          <SectionHeading
            title="Stock Watchlist"
            text="High-priority replenishment items."
          />
          <div className="stack gap-3">
            {(overview?.lowStockProducts || []).slice(0, 5).map((product) => (
              <div key={product._id} className="list-row p-3 panel-strong glow-on-hover" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div className="cluster gap-3">
                  <img src={product.image} alt={product.name} className="thumb" />
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{product.name}</strong>
                    <p className="muted small">
                      {product.quantityInStock} {product.unit} left · {product.rackLabel}
                    </p>
                  </div>
                </div>
                <div className={`pill ${product.quantityInStock <= 0 ? 'danger' : 'warning'}`}>
                  {product.quantityInStock <= 0 ? 'Empty' : 'Low'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6 stack gap-5">
          <SectionHeading
            title="Top Velocity"
            text="Best selling products this period."
          />
          <div className="stack gap-3">
            {(overview?.topProducts || []).slice(0, 5).map((product) => (
              <div key={product.productId} className="list-row p-3 panel-strong glow-on-hover" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div className="cluster gap-3">
                  <img src={product.image} alt={product.name} className="thumb" />
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{product.name}</strong>
                    <p className="muted small">
                      {product.quantity} sold · {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
                <div className="pill success" style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>Peak</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6 stack gap-5">
          <SectionHeading
            title="Latest Invoices"
            text="Recent transaction stream."
          />
          <div className="stack gap-3">
            {(overview?.recentSales || []).slice(0, 5).map((sale) => (
              <div key={sale._id} className="list-row p-3 panel-strong glow-on-hover" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div className="stack gap-1">
                  <div className="cluster gap-2">
                    <FileText size={14} className="muted" />
                    <strong style={{ fontSize: '0.95rem' }}>{sale.invoiceNumber.replace(/^saayi-?/i, '').replace(/^c-/i, 'INVC-')}</strong>
                  </div>
                  <p className="muted small">
                    {sale.cashierName} · {formatDate(sale.createdAt)}
                  </p>
                </div>
                <strong style={{ color: 'var(--accent-strong)' }}>{formatCurrency(sale.total)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-6 stack gap-5 glass-panel mt-6">
        <SectionHeading title="Branch-wise Monthly Sales" text="Revenue progression compared across branches for the current year." />
        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer>
            <BarChart data={overview?.branchMonthlySales || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-soft)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-soft)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text)' }}
                cursor={{ fill: 'var(--accent)', opacity: 0.1 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {(overview?.allBranches || []).map((branch, index) => (
                <Bar key={branch} dataKey={branch} fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
