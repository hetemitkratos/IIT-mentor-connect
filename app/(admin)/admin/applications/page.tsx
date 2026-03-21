'use client'

import { useState, useEffect, useCallback } from 'react'

interface Application {
  id: string
  iit: string
  branch: string
  year: number
  languages: string[]
  bio: string
  calendlyLink: string
  collegeIdUrl: string
  status: string
  createdAt: string
  user: { name: string | null; email: string | null }
}

type StatusFilter = 'pending' | 'approved' | 'rejected'

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; msg: string } | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/applications?status=${filter}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setApplications(data.data.applications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  async function handleApprove(id: string) {
    setProcessingId(id)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/applications/${id}/approve`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to approve')
      setFeedback({ id, type: 'success', msg: 'Approved! Mentor account created.' })
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a))
    } catch (err) {
      setFeedback({ id, type: 'error', msg: err instanceof Error ? err.message : 'Approve failed' })
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(id: string) {
    if (rejectReason.trim().length < 10) {
      setFeedback({ id, type: 'error', msg: 'Rejection reason must be at least 10 characters' })
      return
    }
    setProcessingId(id)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/applications/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reject')
      setFeedback({ id, type: 'success', msg: 'Application rejected.' })
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a))
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      setFeedback({ id, type: 'error', msg: err instanceof Error ? err.message : 'Reject failed' })
    } finally {
      setProcessingId(null)
    }
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mentor Applications</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'rejected'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-500">Loading applications...</div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            No {filter} applications found.
          </div>
        )}

        {/* Application cards */}
        {!loading && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {app.user.name || 'Unnamed User'}
                    </h3>
                    <p className="text-sm text-gray-500">{app.user.email}</p>
                  </div>
                  {statusBadge(app.status)}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">IIT:</span>{' '}
                    <span className="text-gray-900 font-medium">{app.iit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Branch:</span>{' '}
                    <span className="text-gray-900 font-medium">{app.branch}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Year:</span>{' '}
                    <span className="text-gray-900 font-medium">{app.year}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-gray-500">Languages:</span>{' '}
                    <span className="text-gray-900 font-medium">{app.languages.join(', ')}</span>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Bio:</p>
                  <p className="text-sm text-gray-800 bg-gray-50 rounded px-3 py-2">
                    {app.bio.length > 200 ? app.bio.slice(0, 200) + '…' : app.bio}
                  </p>
                </div>

                {/* Links */}
                <div className="flex gap-4 text-sm mb-4">
                  <a
                    href={app.calendlyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Calendly ↗
                  </a>
                  <a
                    href={app.collegeIdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    College ID ↗
                  </a>
                </div>

                {/* Feedback */}
                {feedback && feedback.id === app.id && (
                  <div className={`text-sm rounded-md px-3 py-2 mb-3 ${
                    feedback.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {feedback.msg}
                  </div>
                )}

                {/* Actions — only for pending */}
                {app.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={processingId === app.id}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === app.id ? 'Processing...' : '✅ Approve'}
                    </button>

                    {rejectingId === app.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          placeholder="Rejection reason (min 10 chars)"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={processingId === app.id}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason('') }}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectingId(app.id)}
                        disabled={processingId === app.id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ❌ Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
