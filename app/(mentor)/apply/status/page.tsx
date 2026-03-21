import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getApplicationStatus } from '@/services/application.service'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Application Status — IIT Mentor Connect',
}

export default async function ApplicationStatusPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  const application = await getApplicationStatus(session.user.id)

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">

        {/* No application */}
        {!application && (
          <>
            <div className="text-4xl mb-4">📋</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">No Application Found</h1>
            <p className="text-gray-500 mb-6">You have not applied to become a mentor yet.</p>
            <Link
              href="/apply"
              className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Now
            </Link>
          </>
        )}

        {/* Pending */}
        {application?.status === 'pending' && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Application Under Review</h1>
            <p className="text-gray-500 mb-2">Your application is being reviewed by our team.</p>
            <p className="text-sm text-gray-400">We will notify you once it&apos;s reviewed.</p>
          </>
        )}

        {/* Approved */}
        {application?.status === 'approved' && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-xl font-semibold text-green-700 mb-2">Application Approved!</h1>
            <p className="text-gray-500 mb-6">You can now start mentoring JEE aspirants.</p>
            <Link
              href="/mentor/dashboard"
              className="inline-block px-6 py-2.5 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {/* Rejected */}
        {application?.status === 'rejected' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl font-semibold text-red-700 mb-2">Application Not Approved</h1>
            <p className="text-gray-500 mb-4">Unfortunately, your application was not approved.</p>
            {application.reviewedAt && (
              <p className="text-xs text-gray-400 mb-6">
                Reviewed on {application.reviewedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            <Link
              href="/apply"
              className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Again
            </Link>
          </>
        )}

      </div>
    </main>
  )
}
