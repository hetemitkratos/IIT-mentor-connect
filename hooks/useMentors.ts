'use client'

import { useQuery } from '@tanstack/react-query'
import type { MentorFilters } from '@/services/mentor.service'

export interface UseMentorsParams extends MentorFilters {
  page?: number
  limit?: number
}

export interface MentorListResponse {
  mentors: Array<{
    id: string
    iit: string
    branch: string
    year: number
    languages: string[]
    bio: string
    calLink: string
    profileImage: string | null
    isActive: boolean
    createdAt: string
    user: { name: string | null; image: string | null }
  }>
  total:      number
  page:       number
  totalPages: number
}

async function fetchMentors(params: UseMentorsParams): Promise<MentorListResponse> {
  const sp = new URLSearchParams()

  // Only append params that have a real value — strips undefined/null/empty strings
  const entries: [string, string | number | undefined][] = [
    ['search',   params.search],
    ['iit',      params.iit],
    ['branch',   params.branch],
    ['language', params.language],
    ['year',     params.year],
    ['page',     params.page],
    ['limit',    params.limit],
  ]

  for (const [key, value] of entries) {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value))
    }
  }

  const res = await fetch(`/api/mentors?${sp.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch mentors')

  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Failed to fetch mentors')
  return json.data
}

/**
 * Fetches the paginated, filtered mentor directory.
 *
 * queryKey is structured (not object reference) to guarantee stability
 * and prevent unnecessary refetches when object identity changes.
 */
export function useMentors(params: UseMentorsParams = {}) {
  const {
    search   = '',
    iit      = '',
    branch   = '',
    language = '',
    year,
    page     = 1,
    limit    = 10,
  } = params

  return useQuery<MentorListResponse, Error>({
    // Structured key — each primitive is a separate element; no object reference instability
    queryKey: ['mentors', search, iit, branch, language, year ?? '', page, limit],
    queryFn:  () => fetchMentors(params),
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  })
}
