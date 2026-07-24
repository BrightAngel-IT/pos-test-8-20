/**
 * Module: MetricCard
 * 
 * Reusable React UI component: MetricCard.
 */

import React from 'react'

export function MetricCard({ icon: Icon, title, value, helper, accent }) {
  const cardAccent = accent || 'var(--accent)';
  return (
    <article className="metric-card panel animate-fade" style={{ borderTop: `4px solid ${cardAccent}` }}>
      <div className="between">
        <div className="metric-icon" style={{ background: `${cardAccent}20`, color: cardAccent }}>
          <Icon size={24} />
        </div>
        <div className="pill" style={{ background: 'var(--bg-soft)', color: 'var(--text-soft)', fontSize: '0.6rem', border: '1px solid var(--border)' }}>LIVE</div>
      </div>
      <div className="stack gap-1 mt-4">
        <span className="eyebrow muted uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>{title}</span>
        <strong className="metric-value" style={{ fontSize: '1.6rem', letterSpacing: '-0.02em' }}>{value}</strong>
        <p className="muted small mt-2 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>{helper}</p>
      </div>
    </article>
  )
}
