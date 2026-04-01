'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MentorFilters, type FilterState } from '@/components/mentor/MentorFilters'
import { MentorGrid } from '@/components/mentor/MentorGrid'
import { useMentors } from '@/hooks/useMentors'
import { useDebounce } from '@/hooks/useDebounce'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { PublicFooter } from '@/components/layout/PublicFooter'

// NOTE: metadata must be in a separate server component when using 'use client'.
// This is handled by Next.js generating metadata from the nearest server-side layout.

const LIMIT = 12

export default function MentorsPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<FilterState>({
    search:   searchParams.get('search')   ?? '',
    iit:      searchParams.get('iit')      ?? '',
    branch:   searchParams.get('branch')   ?? '',
    year:     searchParams.get('year')     ?? '',
    language: searchParams.get('language') ?? '',
  })
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1))

  const debouncedSearch = useDebounce(filters.search, 300)
  const debouncedBranch = useDebounce(filters.branch, 300)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.iit, debouncedBranch, filters.year, filters.language])

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

  const handleFiltersChange = useCallback((next: FilterState) => {
    setFilters(next)
  }, [])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <PublicNavbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Header Hero Section */}
        <div className="pt-16 pb-6 text-center">
          <h1 className="text-[40px] md:text-[48px] font-extrabold text-[#0f172a] tracking-tight font-['Newsreader'] italic mb-4">
            Browse verified IIT mentors
          </h1>
          <p className="text-lg md:text-xl text-[#64748b] max-w-3xl mx-auto font-['Inter']">
            Find the perfect mentor to guide you through your JEE journey.<br />
            Book a 20-minute strategy session and transform your prep.
          </p>
        </div>

        {/* Filters */}
        <MentorFilters filters={filters} onChange={handleFiltersChange} />

        {/* Grid */}
        <MentorGrid
          mentors={data?.mentors ?? []}
          isLoading={isLoading}
          isError={isError}
          skeletonCount={12}
        />

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <nav className="mt-16 flex items-center justify-center gap-4" aria-label="Pagination">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#cbd5e1] text-[#475569] font-medium hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm bg-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Previous
            </button>

            <span className="text-[#64748b] font-medium px-4">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#cbd5e1] text-[#475569] font-medium hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm bg-white"
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </nav>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
