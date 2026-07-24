/**
 * Module: SectionHeading
 * 
 * Reusable React UI component: SectionHeading.
 */

import React from 'react'

export function SectionHeading({ title, text }) {
  return (
    <div className="stack gap-1">
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </div>
  )
}
