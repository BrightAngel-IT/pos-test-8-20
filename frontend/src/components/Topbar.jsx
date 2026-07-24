/**
 * Module: Topbar
 * 
 * Reusable React UI component: Topbar.
 */

import React, { useState, useEffect } from 'react'
import { Clock, Moon, SunMedium } from 'lucide-react'
import { formatCurrency } from '../utils'

export function Topbar({ activeView, session, overview, theme, setTheme }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="topbar panel py-5 px-8 between items-center wrap-row gap-5">
      <div className="stack gap-1">
        <p className="eyebrow" style={{ color: 'var(--accent-strong)' }}>Active Workspace</p>
        <h1 style={{ fontSize: '1.75rem' }}>
          {activeView === 'overview' && (session.user.role === 'admin' ? 'Operations Command' : 'Cashier Terminal')}
          {activeView === 'pos' && 'Billing Desk'}
          {activeView === 'inventory' && 'Warehouse Control'}
          {activeView === 'reports' && 'Revenue Analytics'}
          {activeView === 'suppliers' && 'Supplier Management'}
          {activeView === 'customers' && 'Customer Management'}
          {activeView === 'purchases' && 'Purchases Log'}
          {activeView === 'invoices' && 'Invoices Log'}
          {activeView === 'payments' && 'Payments Log'}
          {activeView === 'staff' && 'Staff Management'}
          {activeView === 'notifications' && 'Notification Management'}
          {activeView === 'product-manager' && 'Product Management'}
          {activeView === 'sales-history' && 'Sales History'}
          {activeView === 'settlements' && 'Settlements Control'}
          {activeView === 'returns' && 'Returns Management'}
          {activeView === 'company-profile' && 'Company Profile'}
        </h1>
        <div className="cluster gap-3 muted small mt-1">
          <span>Branch: <strong className="font-strong" style={{ color: 'var(--text)' }}>{session.user.branch}</strong></span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <div className="cluster gap-2 pill success-soft" style={{ padding: '4px 10px', background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Clock size={12} />
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
          </div>
        </div>
      </div>

      <div className="topbar-actions cluster gap-4">
        {session.user.role === 'admin' && (
          <>
            <div className="mini-stat panel-strong" style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <span className="muted eyebrow" style={{ fontSize: '0.6rem' }}>Total SKUs</span>
              <div className="font-strong" style={{ fontSize: '1.25rem' }}>{overview?.metrics.totalProducts ?? 0}</div>
            </div>
            <div className="mini-stat panel-strong" style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <span className="muted eyebrow" style={{ fontSize: '0.6rem', color: 'var(--danger)' }}>Alerts</span>
              <div className="font-strong" style={{ fontSize: '1.25rem', color: 'var(--danger)' }}>{overview?.metrics.lowStockCount ?? 0}</div>
            </div>
          </>
        )}
        <div className="mini-stat panel-strong" style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--accent-soft)' }}>
          <span className="muted eyebrow" style={{ fontSize: '0.6rem' }}>{session.user.role === 'admin' ? "Today's Rev" : "My Sales"}</span>
          <div className="font-strong" style={{ fontSize: '1.25rem', color: 'var(--accent-strong)' }}>{formatCurrency(overview?.metrics.revenueToday ?? 0)}</div>
        </div>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--bg-soft)', 
            border: '1px solid var(--border)', 
            borderRadius: '20px', 
            padding: '3px',
            gap: '2px',
            height: '44px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
          }}
        >
          {/* Light Mode Button */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              background: theme === 'light' ? 'var(--accent-soft)' : 'transparent',
              color: theme === 'light' ? 'var(--accent-strong)' : 'var(--muted)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: theme === 'light' ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none',
            }}
            title="Light Mode"
          >
            <SunMedium size={18} style={{ transform: theme === 'light' ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s' }} />
          </button>

          {/* Dark Mode Button */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              background: theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: theme === 'dark' ? '#6366f1' : 'var(--muted)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: theme === 'dark' ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
            }}
            title="Dark Mode"
          >
            <Moon size={18} style={{ transform: theme === 'dark' ? 'scale(1.1) rotate(-15deg)' : 'scale(1)', transition: 'all 0.2s' }} />
          </button>
        </div>
      </div>
    </header>
  )
}
