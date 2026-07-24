/**
 * Module: Sidebar
 * 
 * Reusable React UI component: Sidebar.
 */

import React, { useState, useEffect } from 'react'
import {
  Boxes,
  Crown,
  LayoutDashboard,
  LogOut,
  Receipt,
  ScanLine,
  ShoppingCart,
  Warehouse,
  BarChart3,
  Clock,
  User,
  Bell,
  Wallet,
  Users,
  RotateCcw,
  Building2,
  ArrowRightLeft
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getBaseUrl } from '../utils'
export function Sidebar({
  session,
  activeView,
  handleLogout,
  unreadCount,
  company,
}) {
  const navigation = [
    ...(session?.user?.role === 'super_admin'
      ? [
          { path: '/super-admin', label: 'Overview', icon: LayoutDashboard },
          { path: '/super-admin/branches', label: 'Branches', icon: Warehouse },
          { path: '/super-admin/reports', label: 'Sales Reports', icon: BarChart3 },
          { path: '/inventory', label: 'Global Inventory', icon: Warehouse },
          { path: '/super-admin/exchange', label: 'Inventory Exchange', icon: ArrowRightLeft },
          { path: '/purchases', label: 'Purchases', icon: Receipt },
          { path: '/super-admin/returns', label: 'Returns', icon: RotateCcw },
          { path: '/suppliers', label: 'Suppliers', icon: User },
          { path: '/staff', label: 'Employees', icon: Users },
        ]
      : [
          { path: '/', label: 'Overview', icon: LayoutDashboard },
        ]),
    ...(session?.user?.role !== 'admin' && session?.user?.role !== 'super_admin'
      ? [
          { path: '/pos', label: 'Billing Desk', icon: ShoppingCart },
          { path: '/sales-history', label: 'Sales History', icon: Clock },
          { path: '/customers', label: 'Customers', icon: User },
          { path: '/returns', label: 'Returns', icon: RotateCcw },
          { path: '/settlements', label: 'Settlements', icon: Wallet }
        ]
      : []),
    ...(session?.user?.role === 'admin'
      ? [
          { path: '/pos', label: 'Billing Desk', icon: ShoppingCart },
          { path: '/inventory', label: 'Inventory', icon: Warehouse },
          { path: '/suppliers', label: 'Suppliers', icon: User },
          { path: '/customers', label: 'Customers', icon: User },
          { path: '/staff', label: 'Employees', icon: Users },
          { path: '/purchases', label: 'Purchases', icon: Receipt },
          { path: '/invoices', label: 'Invoices', icon: Receipt },
          { path: '/returns', label: 'Returns', icon: RotateCcw },
          { path: '/payments', label: 'Settlements', icon: Wallet },
          { path: '/reports', label: 'Sales Reports', icon: BarChart3 },
          { path: '/company-profile', label: 'Company Profile', icon: Building2 },
        ]
      : []),
  ]

  const logoUrl = company?.logo ? `${getBaseUrl()}${company.logo}` : '/logo.png'
  const companyName = company?.name || 'NILMA Alliance'
  const companyTagline = company?.tagline || 'Alliance Group'

  return (
    <aside className="sidebar panel glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Fixed Header */}
      <div className="brand-lockup between" style={{
        paddingBottom: '24px',
        marginBottom: '10px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }}>
        <div className="cluster gap-3">
          <div className="brand-badge glow-on-hover" style={{ boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)', width: '42px', height: '42px', borderRadius: '12px', background: 'white', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            <img src={logoUrl} alt="Logo" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1.4rem', letterSpacing: '-0.02em', fontWeight: 800, color: 'var(--accent-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={companyName}>{companyName}</h2>
            <p className="eyebrow" style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={companyTagline}>{companyTagline}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="stack gap-2" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>

        <div className="user-profile panel-strong p-3 glow-on-hover" style={{ borderRadius: '16px', border: '1px solid var(--border)', background: 'linear-gradient(145deg, var(--panel-strong), var(--bg-soft))' }}>
          <div className="cluster between">
            <div className="cluster gap-3">
              <div className="avatar" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', color: 'var(--accent-strong)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                {session.user.role === 'admin' ? <Crown size={22} /> : <User size={22} />}
              </div>
              <div className="stack">
                <strong style={{ fontSize: '0.95rem' }}>{session.user.name}</strong>
                <div className="cluster gap-1">
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div>
                  <span className="muted small" style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>{session.user.role} Status</span>
                </div>
              </div>
            </div>
            <NavLink
              to="/notifications"
              className="icon-btn glow-on-hover"
              style={{
                color: 'var(--muted)',
                position: 'relative',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                width: '34px',
                height: '34px',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: '#ef4444',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  border: '2px solid var(--panel-strong)',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
                }}></span>
              )}
            </NavLink>
          </div>
        </div>

        <nav className="stack gap-1">
          {navigation.map((item, index) => {
            const Icon = item.icon

            // Add a visual separator before admin items if first admin item
            const showDivider = session?.user?.role === 'admin' && index === 3

            return (
              <React.Fragment key={item.path}>

                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link between ${isActive ? 'active glow-on-hover' : ''}`}
                  style={({ isActive }) => isActive ? { borderLeft: '3px solid var(--accent-strong)', paddingLeft: '13px', background: 'linear-gradient(90deg, var(--accent-soft), transparent)', fontWeight: 600 } : { borderLeft: '3px solid transparent' }}
                >
                  {({ isActive }) => (
                    <>
                      <div className="cluster gap-2">
                        <Icon size={18} style={{ color: isActive ? 'var(--accent-strong)' : 'inherit' }} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className="pill" style={{ background: 'var(--danger)', color: 'white', padding: '2px 6px', fontSize: '0.65rem', minWidth: '20px', textAlign: 'center' }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </React.Fragment>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          className="btn w-full cluster justify-start gap-3"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            color: 'var(--muted)',
            background: 'transparent',
            border: '1px solid var(--border)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--danger)';
            e.currentTarget.style.background = 'var(--danger-soft)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--muted)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Sign out session</span>
        </button>
      </div>
    </aside>
  )
}
