/**
 * Module: Pagination
 * 
 * Reusable React UI component: Pagination.
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="p-4 between border-t" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-soft)', flexShrink: 0, borderRadius: '0 0 24px 24px' }}>
      <span className="muted x-small font-bold">
        PAGE {currentPage} OF {totalPages} 
        <span style={{ opacity: 0.5, marginLeft: '8px' }}>
          (Showing {startItem}-{endItem} of {totalItems})
        </span>
      </span>
      <div className="cluster gap-2">
        <button 
          className="btn btn-secondary sm" 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ borderRadius: '10px', padding: '6px 12px' }}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <div className="cluster gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const page = i + 1;
            return (
              <button 
                key={page}
                className={`btn sm ${currentPage === page ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => onPageChange(page)}
                style={{ minWidth: '36px', height: '36px', borderRadius: '10px', padding: 0 }}
              >
                {page}
              </button>
            );
          })}
          {totalPages > 5 && <span className="muted small">...</span>}
        </div>
        <button 
          className="btn btn-secondary sm" 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ borderRadius: '10px', padding: '6px 12px' }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
