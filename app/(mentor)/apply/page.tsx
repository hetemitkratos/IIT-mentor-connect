'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function ApplyPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    iit: '',
    branch: '',
    year: '',
    languages: '',
    bio: '',
    calendlyLink: '',
    collegeIdUrl: '',
  })

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/mentors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iit: form.iit.trim(),
          branch: form.branch.trim(),
          year: Number(form.year),
          languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
          bio: form.bio.trim(),
          calendlyLink: form.calendlyLink.trim(),
          collegeIdUrl: form.collegeIdUrl.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || 'Something went wrong')
        return
      }

      setStatus('success')
      setTimeout(() => router.push('/apply/status'), 2000)
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600">Redirecting to status page...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Apply to Become a Mentor</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* IIT */}
          <div>
            <label htmlFor="iit" className="block text-sm font-medium text-gray-700 mb-1">
              IIT <span className="text-red-500">*</span>
            </label>
            <input
              id="iit"
              name="iit"
              type="text"
              required
              placeholder="e.g. IIT Bombay"
              value={form.iit}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Branch */}
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
              Branch <span className="text-red-500">*</span>
            </label>
            <input
              id="branch"
              name="branch"
              type="text"
              required
              placeholder="e.g. Computer Science"
              value={form.branch}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Year */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year <span className="text-red-500">*</span>
            </label>
            <select
              id="year"
              name="year"
              required
              value={form.year}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
          </div>

          {/* Languages */}
          <div>
            <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-1">
              Languages <span className="text-red-500">*</span>
            </label>
            <input
              id="languages"
              name="languages"
              type="text"
              required
              placeholder="e.g. Hindi, English, Tamil"
              value={form.languages}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              required
              maxLength={600}
              rows={4}
              placeholder="Tell us about yourself and why you want to mentor JEE aspirants (min 50 characters)"
              value={form.bio}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
            <p className="text-xs text-gray-500 mt-1">{form.bio.length}/600 characters maximum</p>
          </div>

          {/* Calendly Link */}
          <div>
            <label htmlFor="calendlyLink" className="block text-sm font-medium text-gray-700 mb-1">
              Calendly Link <span className="text-red-500">*</span>
            </label>
            <input
              id="calendlyLink"
              name="calendlyLink"
              type="url"
              required
              placeholder="https://calendly.com/your-link"
              value={form.calendlyLink}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* College ID URL (temporary text input) */}
          <div>
            <label htmlFor="collegeIdUrl" className="block text-sm font-medium text-gray-700 mb-1">
              College ID URL <span className="text-red-500">*</span>
            </label>
            <input
              id="collegeIdUrl"
              name="collegeIdUrl"
              type="url"
              required
              placeholder="https://drive.google.com/... (link to your college ID)"
              value={form.collegeIdUrl}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Paste a link to your college ID image (Google Drive, Imgur, etc.)</p>
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </main>
  )
}
