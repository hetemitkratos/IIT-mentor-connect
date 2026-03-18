'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Metadata } from 'next'
import { MentorFilters, type FilterState } from '@/components/mentor/MentorFilters'
import { MentorGrid } from '@/components/mentor/MentorGrid'
import { useMentors } from '@/hooks/useMentors'
import { useDebounce } from '@/hooks/useDebounce'

// NOTE: metadata must be in a separate server component when using 'use client'.
// This is handled by Next.js generating metadata from the nearest server-side layout.
// Title is set in the parent (public)/layout.tsx or via <head> in the app layout.

const LIMIT = 10

export default function MentorsPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // ── Initialise filter state from URL params ───────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    search:   searchParams.get('search')   ?? '',
    iit:      searchParams.get('iit')      ?? '',
    branch:   searchParams.get('branch')   ?? '',
    year:     searchParams.get('year')     ?? '',
    language: searchParams.get('language') ?? '',
  })
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1))

  // ── Debounce text inputs (search + branch) ───────────────────────────────
  const debouncedSearch = useDebounce(filters.search, 300)
  const debouncedBranch = useDebounce(filters.branch, 300)

  // ── Reset to page 1 whenever any filter changes ──────────────────────────
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.iit, debouncedBranch, filters.year, filters.language])

  // ── Sync state → URL (shallow, no full navigation) ───────────────────────
  useEffect(() => {
    const sp = new URLSearchParams()
    if (debouncedSearch) sp.set('search',   debouncedSearch)
    if (filters.iit)     sp.set('iit',      filters.iit)
    if (debouncedBranch) sp.set('branch',   debouncedBranch)
    if (filters.year)    sp.set('year',     filters.year)
    if (filters.language)sp.set('language', filters.language)
    if (page > 1)        sp.set('page',     String(page))

    const qs = sp.toString()
    router.replace(qs ? `/mentors?${qs}` : '/mentors', { scroll: false })
  }, [debouncedSearch, filters.iit, debouncedBranch, filters.year, filters.language, page, router])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useMentors({
    search:   debouncedSearch   || undefined,
    iit:      filters.iit       || undefined,
    branch:   debouncedBranch   || undefined,
    year:     filters.year ? Number(filters.year) : undefined,
    language: filters.language  || undefined,
    page,
    limit:    LIMIT,
  })

  const totalPages = data?.totalPages ?? 1
  const total      = data?.total      ?? 0

  const handleFiltersChange = useCallback((next: FilterState) => {
    setFilters(next)
  }, [])

  return (
    <main className="mentors-page">
      <div className="mentors-page__header">
        <h1 className="mentors-page__title">Find a Mentor</h1>
        <p className="mentors-page__subtitle">
          Browse IIT mentors by college, branch, year, and language. Book a 20-minute session for ₹150.
        </p>
      </div>

      {/* Filters */}
      <MentorFilters filters={filters} onChange={handleFiltersChange} />

      {/* Result count */}
      {!isLoading && !isError && (
        <p className="mentors-page__count" aria-live="polite">
          {total === 0
            ? 'No mentors found'
            : `${total} mentor${total === 1 ? '' : 's'} found`}
        </p>
      )}

      {/* Grid */}
      <MentorGrid
        mentors={data?.mentors ?? []}
        isLoading={isLoading}
        isError={isError}
      />

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <nav className="mentors-page__pagination" aria-label="Pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="mentors-page__page-btn"
            aria-label="Previous page"
          >
            ← Previous
          </button>

          <span className="mentors-page__page-info" aria-current="page">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="mentors-page__page-btn"
            aria-label="Next page"
          >
            Next →
          </button>
        </nav>
      )}
    </main>
  )
}
