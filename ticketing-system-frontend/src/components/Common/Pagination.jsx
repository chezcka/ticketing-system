import React from 'react';
import './Pagination.css';

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const IconChevronsLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>
  </svg>
);

const IconChevronsRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>
  </svg>
);

/**
 * Pagination
 *
 * Props:
 *   currentPage   – 1-based current page number
 *   totalItems    – total number of items across all pages
 *   pageSize      – how many items per page (default 10)
 *   onPageChange  – (newPage: number) => void
 *   onPageSizeChange – optional (newSize: number) => void
 *   pageSizeOptions  – optional array of numbers, e.g. [5, 10, 20, 50]
 *   className     – optional extra class on the root element
 */
const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // Build the visible page numbers with ellipsis logic
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '…', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages);
    }
    return pages;
  };

  const go = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <div className={`pgn ${className}`}>
      {/* Left: item range info */}
      <span className="pgn__info">
        {totalItems === 0
          ? 'No results'
          : `${from}–${to} of ${totalItems}`}
      </span>

      {/* Center: page buttons */}
      <div className="pgn__controls">
        <button
          className="pgn__btn pgn__btn--icon"
          onClick={() => go(1)}
          disabled={currentPage === 1}
          title="First page"
        >
          <IconChevronsLeft />
        </button>
        <button
          className="pgn__btn pgn__btn--icon"
          onClick={() => go(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <IconChevronLeft />
        </button>

        {getPageNumbers().map((page, i) =>
          page === '…' ? (
            <span key={`ellipsis-${i}`} className="pgn__ellipsis">…</span>
          ) : (
            <button
              key={page}
              className={`pgn__btn pgn__btn--page${page === currentPage ? ' pgn__btn--active' : ''}`}
              onClick={() => go(page)}
              disabled={page === currentPage}
            >
              {page}
            </button>
          )
        )}

        <button
          className="pgn__btn pgn__btn--icon"
          onClick={() => go(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <IconChevronRight />
        </button>
        <button
          className="pgn__btn pgn__btn--icon"
          onClick={() => go(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
        >
          <IconChevronsRight />
        </button>
      </div>

      {/* Right: rows-per-page selector */}
      {onPageSizeChange && (
        <div className="pgn__size">
          <span className="pgn__size-label">Rows</span>
          <select
            className="pgn__size-select"
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;