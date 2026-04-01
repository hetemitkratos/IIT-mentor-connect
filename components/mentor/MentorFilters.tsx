'use client'

import { useEffect, useRef, useState } from 'react'
import { IIT_OPTIONS, YEAR_OPTIONS, LANGUAGE_OPTIONS } from '@/constants/iitOptions'

export interface FilterState {
  search:   string
  iit:      string
  branch:   string
  year:     string
  language: string
}

interface MentorFiltersProps {
  filters:  FilterState
  onChange: (filters: FilterState) => void
}

// Indian states for "Native State" filter
const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry',
] as const

// Common engineering branches
const BRANCH_OPTIONS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Chemical Engineering', 'Aerospace Engineering',
  'Electronics & Communication', 'Mathematics & Computing',
  'Engineering Physics', 'Biotechnology', 'Metallurgy',
] as const

export function MentorFilters({ filters, onChange }: MentorFiltersProps) {
  const [panelOpen, setPanelOpen] = useState(false)

  // Local draft state inside the panel — only committed on "Apply"
  const [draft, setDraft] = useState<FilterState>(filters)
  const panelRef  = useRef<HTMLDivElement>(null)
  const btnRef    = useRef<HTMLButtonElement>(null)

  // Keep draft in sync if parent clears externally
  useEffect(() => { setDraft(filters) }, [filters])

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return
    function handle(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current   && !btnRef.current.contains(e.target as Node)
      ) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [panelOpen])

  const updateDraft = (field: keyof FilterState, value: string) =>
    setDraft((d) => ({ ...d, [field]: value }))

  const applyFilters = () => {
    onChange(draft)
    setPanelOpen(false)
  }

  const clearAll = () => {
    const empty: FilterState = { search: '', iit: '', branch: '', year: '', language: '' }
    setDraft(empty)
    onChange(empty)
    setPanelOpen(false)
  }

  // Active filter tags (excluding search)
  const LABELS: Record<string, string> = {
    iit: 'College', branch: 'Branch', year: 'Year', language: 'Language',
  }
  const activeTags = (Object.keys(LABELS) as Array<keyof Omit<FilterState,'search'>>)
    .filter((k) => filters[k])

  const countActiveNonSearch = activeTags.length

  return (
    <div className="w-full max-w-5xl mx-auto py-6">

      {/* ── Row: Search + Filters button ──────────────────────── */}
      <div className="flex items-center gap-3">

        {/* Search bar */}
        <div className="flex-1 flex items-center bg-white border border-[#cbd5e1] rounded-full shadow-sm px-4 h-12 hover:border-[#94a3b8] transition-colors focus-within:border-[#f5820a] focus-within:ring-2 focus-within:ring-[#f5820a]/20">
          <svg className="w-5 h-5 text-[#94a3b8] mr-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by Name, Specialization..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full bg-transparent border-none outline-none text-[#334155] text-[15px] font-['Inter'] placeholder-[#94a3b8]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, search: '' })}
              className="ml-2 text-[#94a3b8] hover:text-[#475569] transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters toggle button */}
        <button
          ref={btnRef}
          type="button"
          onClick={() => { setDraft(filters); setPanelOpen((o) => !o) }}
          className="flex items-center gap-2 bg-[#f5820a] hover:bg-[#e07009] text-white font-semibold text-[15px] px-5 h-12 rounded-full shadow-sm transition-all active:scale-95 relative"
        >
          Filters
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {countActiveNonSearch > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-[#f5820a] text-xs font-bold flex items-center justify-center shadow">
              {countActiveNonSearch}
            </span>
          )}
        </button>
      </div>

      {/* ── Dropdown filter panel ──────────────────────────────── */}
      {panelOpen && (
        <div
          ref={panelRef}
          className="mt-3 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-6 z-50"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

            {/* College / IIT */}
            <FilterSelect
              label="College"
              value={draft.iit}
              onChange={(v) => updateDraft('iit', v)}
              placeholder="All Institutes"
              options={IIT_OPTIONS as unknown as string[]}
            />

            {/* Branch */}
            <FilterSelect
              label="Branch"
              value={draft.branch}
              onChange={(v) => updateDraft('branch', v)}
              placeholder="All Branches"
              options={BRANCH_OPTIONS as unknown as string[]}
            />

            {/* Year */}
            <FilterSelect
              label="Year"
              value={draft.year}
              onChange={(v) => updateDraft('year', v)}
              placeholder="All Years"
              options={YEAR_OPTIONS.map((y) => ({ label: `Year ${y}`, value: String(y) }))}
            />

            {/* Native State */}
            <FilterSelect
              label="Native State"
              value={''}
              onChange={() => {}}
              placeholder="All States"
              options={STATES as unknown as string[]}
              disabled // placeholder — not yet in FilterState, wired up later
            />

            {/* Language */}
            <FilterSelect
              label="Language"
              value={draft.language}
              onChange={(v) => updateDraft('language', v)}
              placeholder="All Languages"
              options={LANGUAGE_OPTIONS as unknown as string[]}
            />
          </div>

          {/* Footer: Clear + Apply */}
          <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-[#f1f5f9]">
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-[#64748b] hover:text-[#ef4444] transition-colors"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="flex items-center gap-2 bg-[#f5820a] hover:bg-[#e07009] text-white font-semibold text-sm px-6 h-10 rounded-full shadow-sm transition-all active:scale-95"
            >
              Apply
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Active filter tags ─────────────────────────────────── */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {activeTags.map((key) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 bg-white border border-[#e2e8f0] rounded-full px-3 py-1 text-sm font-medium text-[#334155] shadow-sm"
            >
              {key === 'iit' ? filters[key] :
               key === 'year' ? `Year ${filters[key]}` :
               filters[key]}
              <button
                type="button"
                onClick={() => onChange({ ...filters, [key]: '' })}
                className="text-[#94a3b8] hover:text-[#ef4444] transition-colors"
                aria-label={`Remove ${LABELS[key]} filter`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-medium text-[#f5820a] hover:text-[#e07009] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Reusable select wrapper ──────────────────────────────────────────────── */
type OptionItem = string | { label: string; value: string }

function FilterSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: {
  label:        string
  value:        string
  onChange:     (v: string) => void
  placeholder:  string
  options:      OptionItem[]
  disabled?:    boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 pr-8 text-sm text-[#334155] font-['Inter'] focus:outline-none focus:border-[#f5820a] focus:ring-2 focus:ring-[#f5820a]/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) =>
            typeof opt === 'string' ? (
              <option key={opt} value={opt}>{opt}</option>
            ) : (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )
          )}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
