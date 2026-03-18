'use client'

import { IIT_OPTIONS, YEAR_OPTIONS, LANGUAGE_OPTIONS } from '@/constants/iitOptions'

export interface FilterState {
  search:   string
  iit:      string
  branch:   string
  year:     string  // kept as string for select value; parsed to number in page
  language: string
}

interface MentorFiltersProps {
  filters:  FilterState
  onChange: (filters: FilterState) => void
}

export function MentorFilters({ filters, onChange }: MentorFiltersProps) {
  const update = (field: keyof FilterState, value: string) =>
    onChange({ ...filters, [field]: value })

  const clearAll = () =>
    onChange({ search: '', iit: '', branch: '', year: '', language: '' })

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div className="mentor-filters" role="search" aria-label="Filter mentors">
      {/* Search */}
      <div className="mentor-filters__field mentor-filters__field--search">
        <label htmlFor="filter-search" className="mentor-filters__label">Search</label>
        <input
          id="filter-search"
          type="text"
          placeholder="Name, IIT, or branch…"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className="mentor-filters__input"
          autoComplete="off"
        />
      </div>

      {/* IIT */}
      <div className="mentor-filters__field">
        <label htmlFor="filter-iit" className="mentor-filters__label">IIT</label>
        <select
          id="filter-iit"
          value={filters.iit}
          onChange={(e) => update('iit', e.target.value)}
          className="mentor-filters__select"
        >
          <option value="">All IITs</option>
          {IIT_OPTIONS.map((iit) => (
            <option key={iit} value={iit}>{iit}</option>
          ))}
        </select>
      </div>

      {/* Branch */}
      <div className="mentor-filters__field">
        <label htmlFor="filter-branch" className="mentor-filters__label">Branch</label>
        <input
          id="filter-branch"
          type="text"
          placeholder="e.g. Computer Science"
          value={filters.branch}
          onChange={(e) => update('branch', e.target.value)}
          className="mentor-filters__input"
          autoComplete="off"
        />
      </div>

      {/* Year */}
      <div className="mentor-filters__field">
        <label htmlFor="filter-year" className="mentor-filters__label">Year</label>
        <select
          id="filter-year"
          value={filters.year}
          onChange={(e) => update('year', e.target.value)}
          className="mentor-filters__select"
        >
          <option value="">All years</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={String(y)}>Year {y}</option>
          ))}
        </select>
      </div>

      {/* Language */}
      <div className="mentor-filters__field">
        <label htmlFor="filter-language" className="mentor-filters__label">Language</label>
        <select
          id="filter-language"
          value={filters.language}
          onChange={(e) => update('language', e.target.value)}
          className="mentor-filters__select"
        >
          <option value="">All languages</option>
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="mentor-filters__clear"
          aria-label="Clear all filters"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
