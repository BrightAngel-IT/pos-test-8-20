/**
 * Module: NoticeBanner
 * 
 * Reusable React UI component: NoticeBanner.
 */

import React from 'react'

export function NoticeBanner({ notice }) {
  if (!notice) return null
  return (
    <div className={`notice-banner ${notice.type}`}>
      <span>{notice.text}</span>
    </div>
  )
}
