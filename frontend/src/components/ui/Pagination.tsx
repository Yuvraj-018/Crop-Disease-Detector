import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { Button } from './Button'

// ─── Pagination ────────────────────────────────────────────────────────────

interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  page:        number
  totalPages:  number
  hasNext:     boolean
  hasPrev:     boolean
  onNext:      () => void
  onPrev:      () => void
  onPage?:     (page: number) => void
  /** Max number of page buttons to show (excluding prev/next) */
  maxVisible?: number
}

export function Pagination({
  page,
  totalPages,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  onPage,
  maxVisible = 5,
  className,
  ...props
}: PaginationProps) {
  // Build page number array with ellipsis
  const getPages = (): (number | '...')[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const half = Math.floor((maxVisible - 2) / 2)
    let start = Math.max(2, page - half)
    let end   = Math.min(totalPages - 1, page + half)

    if (page - 1 <= half) end = Math.min(totalPages - 1, maxVisible - 1)
    if (totalPages - page <= half) start = Math.max(2, totalPages - maxVisible + 2)

    const pages: (number | '...')[] = [1]
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const pages = getPages()

  return (
    <div
      className={cn('flex items-center justify-center gap-1', className)}
      {...props}
    >
      {/* Prev */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Previous page"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="w-8 text-center text-on-surface-variant text-body-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage?.(p)}
            className={cn(
              'h-8 w-8 rounded-xl text-label-sm font-label transition-all duration-150',
              p === page
                ? 'bg-primary text-on-primary shadow-neon-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
            )}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next page"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  )
}
