import React from 'react'
import { AlertTriangle, Check, CheckCircle2, PackageX } from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'

export function Notifications({ notifications, markNotificationRead, markAllNotificationsRead }) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="stack gap-6 animate-fade">
      <div className="between wrap-row panel p-6 glass-panel">
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: 'var(--warning-soft)', color: 'var(--warning)', border: 'none' }}>
            <AlertTriangle size={24} />
          </div>
          <SectionHeading
            title="System Notifications"
            text="Alerts, stock warnings, and system messages."
          />
        </div>
        <div className="cluster gap-3">
          <button 
            className="btn btn-secondary glow-on-hover" 
            onClick={markAllNotificationsRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 size={18} />
            Mark All as Read
          </button>
        </div>
      </div>

      <div className="panel p-6 stack gap-4 glass-panel">
        {notifications.length === 0 ? (
          <div className="empty-state compact" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ color: 'var(--muted)', marginBottom: '16px' }}><CheckCircle2 size={48} /></div>
            <h3 style={{ fontSize: '1.25rem' }}>You're all caught up!</h3>
            <p className="muted mt-2">No new notifications at this time.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`list-row p-4 panel-strong glow-on-hover ${notification.read ? 'muted' : ''}`}
              style={{ 
                borderRadius: '16px', 
                border: notification.read ? '1px solid var(--border)' : '1px solid var(--warning)',
                background: notification.read ? 'var(--panel)' : 'var(--warning-soft)',
                transition: 'all 0.3s'
              }}
            >
              <div className="cluster gap-4">
                <div className="icon-btn small" style={{ background: 'var(--panel)', color: 'var(--warning)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {notification.type === 'low_stock' ? <PackageX size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div>
                  <strong className="font-strong" style={{ fontSize: '1rem', color: notification.read ? 'inherit' : 'var(--warning)' }}>
                    {notification.title}
                  </strong>
                  <p className="small mt-1" style={{ color: notification.read ? 'var(--muted)' : 'var(--text)' }}>
                    {notification.message}
                  </p>
                </div>
              </div>
              {!notification.read && (
                <button 
                  className="icon-btn small glow-on-hover" 
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
                  onClick={() => markNotificationRead(notification.id)}
                  title="Mark as read"
                >
                  <Check size={16} style={{ color: 'var(--success)' }} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
