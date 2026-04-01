/**
 * Pulse-skeleton placeholder for a MentorCard while data is loading.
 * Matches the MentorCard layout structure so the grid doesn't shift on paint.
 */
export function MentorCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden p-5 animate-pulse h-[340px]" aria-hidden="true">
      {/* Top Header - Avatar & Names */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0"></div>
        <div className="flex-1 pt-1">
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="h-6 w-16 bg-slate-200 rounded"></div>
        <div className="h-6 w-24 bg-slate-200 rounded"></div>
      </div>

      {/* Bio Excerpt */}
      <div className="mt-auto mb-5 min-h-[44px]">
        <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
      </div>

      {/* Footer info - Action */}
      <div className="mt-auto pt-4 border-t border-[#f1f5f9] flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
        </div>
        
        <div className="h-9 w-24 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  )
}
