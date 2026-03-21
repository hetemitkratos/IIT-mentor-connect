import { getMentorById } from '@/services/mentor.service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentor Profile — IIT Mentor Connect',
}

export default async function MentorProfilePage({ params }: { params: Promise<{ mentorId: string }> }) {
  const { mentorId } = await params
  const mentor = await getMentorById(mentorId)

  if (!mentor) return notFound()

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back link */}
        <Link href="/mentors" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Mentors
        </Link>

        {/* Profile card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-4">
              {mentor.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mentor.user.image}
                  alt={mentor.user.name ?? 'Mentor'}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  width={64}
                  height={64}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-blue-600">
                    {(mentor.user.name ?? 'M').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {mentor.user.name ?? 'IIT Mentor'}
                </h1>
                <span className="inline-block mt-1 px-3 py-0.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full">
                  {mentor.iit}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  {mentor.branch} · Year {mentor.year}
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">About</h2>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line">{mentor.bio}</p>
          </div>

          {/* Details */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Details</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Languages:</span>{' '}
                <span className="text-gray-900 font-medium">{mentor.languages.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-500">Session Duration:</span>{' '}
                <span className="text-gray-900 font-medium">20 minutes</span>
              </div>
              <div>
                <span className="text-gray-500">Price:</span>{' '}
                <span className="text-gray-900 font-medium">₹150</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="p-6">
            <Link
              href={`/book/${mentor.id}`}
              className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors text-base"
            >
              Book a Session — ₹150
            </Link>
            <p className="text-xs text-gray-400 text-center mt-2">
              20-minute 1:1 video call via Google Meet
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
