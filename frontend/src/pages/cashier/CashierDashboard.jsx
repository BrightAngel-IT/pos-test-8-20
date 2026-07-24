/**
 * Module: CashierDashboard
 * 
 * React UI page component representing the CashierDashboard view.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  TrendingUp,
  ScanLine,
  User,
  Package,
  Activity,
  History,
  FileText,
  Users,
  BarChart3,
  Banknote,
  Layers
} from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'
import { formatCurrency } from '../../utils'

export function CashierDashboard({ overview, session }) {
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const currentTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const quickActions = [
    { label: 'New Bill', icon: ShoppingCart, path: '/pos', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', subtitle: 'Start sale' },
    { label: 'Sales History', icon: History, path: '/sales-history', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', subtitle: 'View bills' },
    { label: 'Fast Scan', icon: ScanLine, path: '/pos', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', subtitle: 'Scan items' },
    { label: 'Customers', icon: Users, path: '/customers', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', subtitle: 'Open list' },
  ]

  return (
    <div className="stack gap-6 animate-fade">
      {/* Premium High-Density Metrics (Matching Requested Style) */}
      <section className="grid cols-1 md-cols-3 gap-6">
        {/* Gross Revenue */}
        <div className="panel glass-panel p-6 stack gap-4 relative overflow-hidden" style={{ borderRadius: '24px', border: '1px solid var(--border)', minHeight: '140px', boxShadow: '0 6px 18px rgba(14, 30, 37, 0.04)' }}>
          <div className="between align-start">
            <span className="eyebrow accent-text font-bold" style={{ letterSpacing: '0.05em', fontSize: '0.75rem' }}>GROSS REVENUE</span>
            <div className="icon-badge success-soft sm" style={{ borderRadius: '8px' }}>
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="stack gap-1">
            <h2 className="font-strong" style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>
              {formatCurrency(overview?.metrics.revenueToday ?? 0)}
            </h2>
            <div style={{ height: '4px', background: 'var(--success)', borderRadius: '2px', width: '85%', marginTop: '8px' }}></div>
          </div>
        </div>

        {/* Bills Issued */}
        <div className="panel glass-panel p-6 stack gap-4 relative overflow-hidden" style={{ borderRadius: '24px', border: '1px solid var(--border)', minHeight: '140px', boxShadow: '0 6px 18px rgba(14, 30, 37, 0.04)' }}>
          <div className="between align-start">
            <span className="eyebrow accent-text font-bold" style={{ letterSpacing: '0.05em', fontSize: '0.75rem' }}>BILLS ISSUED</span>
            <div className="icon-badge neutral-soft sm" style={{ borderRadius: '8px' }}>
              <Layers size={14} />
            </div>
          </div>
          <div className="stack gap-1">
            <h2 className="font-strong" style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>
              {overview?.metrics.totalOrdersToday ?? 0} <span style={{ fontSize: '1.2rem', color: 'var(--text-soft)', fontWeight: 600 }}>Bills</span>
            </h2>
            <p className="muted small mt-1">Finalized Transactions</p>
          </div>
        </div>

        {/* Cash Flow */}
        <div className="panel glass-panel p-6 stack gap-4 relative overflow-hidden" style={{ borderRadius: '24px', border: '1px solid var(--border)', minHeight: '140px', boxShadow: '0 6px 18px rgba(14, 30, 37, 0.04)' }}>
          <div className="between align-start">
            <span className="eyebrow accent-text font-bold" style={{ letterSpacing: '0.05em', fontSize: '0.75rem' }}>CASH FLOW</span>
            <div className="icon-badge neutral-soft sm" style={{ borderRadius: '8px' }}>
              <Banknote size={14} />
            </div>
          </div>
          <div className="stack gap-1">
            <h2 className="font-strong" style={{ fontSize: '2rem', letterSpacing: '-0.5px', color: 'var(--success)' }}>
              {formatCurrency(overview?.metrics.revenueToday ?? 0)}
            </h2>
            <p className="muted small mt-1">Physical Collections</p>
          </div>
        </div>
      </section>

      {/* Modern Compact Shortcut Tiles */}
      <section className="stack gap-4">
        <div className="stack">
          <h3 className="font-strong" style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Quick Shortcuts</h3>
          <p className="muted x-small">Accelerate your workflow with one-click access.</p>
        </div>

        <div className="grid cols-2 md-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              className="panel glass-panel p-4 stack align-center justify-center text-center gap-2 glow-on-hover transition-all group"
              style={{
                borderRadius: '16px',
                background: 'var(--panel-strong)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                minHeight: '130px',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(14,30,37,0.04)',
                transition: 'transform .12s ease, box-shadow .12s ease'
              }}
              onClick={() => navigate(action.path)}
            >
              <div className="avatar transition-transform group-hover-scale" style={{
                background: action.bg,
                color: action.color,
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <action.icon size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 800, marginTop: '8px' }}>{action.label}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '4px' }}>{action.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Activity Table */}
      <section className="panel glass-panel p-0 overflow-hidden" style={{ borderRadius: '24px' }}>
        <div className="p-6 pb-2 between border-b" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-strong" style={{ fontSize: '1.1rem' }}>Recent Activity</h3>
          <button className="btn btn-ghost sm" onClick={() => navigate('/sales-history')}>All Records</button>
        </div>
        <div className="stack p-2 gap-1">
          {(overview?.recentSales || []).slice(0, 5).map((sale) => (
            <div key={sale._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', transition: 'background .12s ease', cursor: 'default' }} className="hover-soft">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar neutral-soft sm" style={{ borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} />
                </div>
                <div>
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/invoice/${sale._id}`) }} style={{ fontWeight: 700, color: 'var(--text)' }}>{sale.invoiceNumber.replace(/^saayi-?/i, '').replace(/^c-/i, 'INVC-')}</a>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginTop: '4px' }}>{sale.customerName || 'Walk-in customer'} · {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '140px' }}>
                <div style={{ fontWeight: 800 }}>{formatCurrency(sale.total)}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginTop: '4px' }}>{sale.paymentMethod}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
