import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getApplicationStatus } from '@/services/application.service'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentor Application Status — IIT Mentor Connect',
  description: 'Follow your journey to becoming a certified mentor on India\'s most elite peer-to-peer academic platform.',
}

export default async function ApplicationStatusPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/signin?callbackUrl=/apply/status')

  const application = await getApplicationStatus(session.user.id)

  // Format application ID for display
  const appDisplayId = application
    ? `APP${application.id.slice(0, 4).toUpperCase()}`
    : null

  return (
    <main className="min-h-screen bg-[#f3f4f5]">
      <div className="max-w-[1440px] mx-auto px-6 pt-28 pb-20 flex flex-col gap-16">

        {/* ── Page Title ──────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1
            className="font-extrabold text-5xl md:text-[60px] tracking-[-3px] text-[#191c1d] leading-[1]"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Mentor Application{' '}
            <span className="text-[#f5820a]">Status</span>
          </h1>
          <p
            className="text-[#564335] text-lg leading-7 max-w-[672px]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Follow your journey to becoming a certified mentor on India&apos;s
            most elite peer-to-peer academic platform.
          </p>
        </div>

        {/* ── Status Cards ─────────────────────────────────────────────── */}
        <div className="flex justify-center">

          {/* ─ No Application ─────────────────────────────────────────── */}
          {!application && (
            <NoApplicationCard />
          )}

          {/* ─ Pending / Under Review ──────────────────────────────────── */}
          {application?.status === 'pending' && (
            <PendingCard appId={appDisplayId!} />
          )}

          {/* ─ Rejected ───────────────────────────────────────────────── */}
          {application?.status === 'rejected' && (
            <RejectedCard
              appId={appDisplayId!}
              reason={application.rejectionReason ?? null}
            />
          )}

          {/* ─ Approved ───────────────────────────────────────────────── */}
          {application?.status === 'approved' && (
            <ApprovedCard appId={appDisplayId!} />
          )}
        </div>

        {/* ── Support Strip ────────────────────────────────────────────── */}
        <div className="flex justify-center pt-4">
          <div
            className="bg-white border border-[rgba(221,193,175,0.1)] shadow-sm rounded-full flex items-center gap-4 px-8 py-4"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <span className="text-[#564335] text-sm font-medium">
              Have questions about your status?
            </span>
            <a
              href="mailto:support@iitmentorconnect.com"
              className="text-[#f5820a] text-sm font-bold flex items-center gap-1 hover:underline"
            >
              Contact Support
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATE COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function AppIdBadge({ id }: { id: string }) {
  return (
    <div className="absolute top-4 right-4">
      <span
        className="bg-[#edeeef] text-[#564335] text-[12px] font-bold px-3 py-1 rounded-full"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Application #{id}
      </span>
    </div>
  )
}

/* ─── No Application ──────────────────────────────────────────────────────── */
function NoApplicationCard() {
  return (
    <div
      className="bg-white rounded-2xl shadow-[0px_20px_40px_0px_rgba(147,75,0,0.05)] p-8 pt-16 flex flex-col items-center gap-5 w-full max-w-sm text-center relative"
    >
      <div className="w-20 h-20 rounded-full bg-[#f3f4f5] flex items-center justify-center text-4xl">
        📋
      </div>
      <div>
        <h2
          className="font-bold text-2xl text-[#191c1d] mb-2"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          No Application Found
        </h2>
        <p
          className="text-[#564335] text-sm leading-[22.75px]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          You have not applied to become a mentor yet.
        </p>
      </div>
      <Link
        href="/apply"
        className="w-full bg-[#f5820a] hover:bg-[#e07509] text-white font-bold rounded-full py-4 flex items-center justify-center gap-2 transition-colors shadow-[0px_10px_15px_-3px_rgba(245,130,10,0.2)]"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Apply Now
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  )
}

/* ─── Pending / Under Review ──────────────────────────────────────────────── */
function PendingCard({ appId }: { appId: string }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-[0px_20px_40px_0px_rgba(147,75,0,0.05)] pt-16 pb-8 px-8 flex flex-col items-start gap-0 w-full max-w-sm relative overflow-hidden"
    >
      <AppIdBadge id={appId} />

      {/* Icon */}
      <div className="self-center mb-6 relative">
        <div className="w-20 h-20 rounded-full bg-[#fff7ed] flex items-center justify-center relative">
          {/* Clock icon */}
          <svg className="w-8 h-8 text-[#f5820a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          </svg>
          {/* Pulsing overlay */}
          <div className="absolute inset-0 rounded-full bg-[rgba(245,130,10,0.15)] animate-pulse" />
        </div>
      </div>

      {/* Title */}
      <h2
        className="self-center font-bold text-2xl text-[#191c1d] text-center mb-2"
        style={{ fontFamily: "'Epilogue', sans-serif" }}
      >
        Application Under Review
      </h2>

      {/* Subtitle */}
      <p
        className="self-center text-[#564335] text-[14px] leading-[22.75px] text-center mb-8 max-w-[310px]"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Our team of senior mentors is currently verifying your IIT credentials and
        profile details.
      </p>

      {/* Progress box */}
      <div className="w-full bg-[#f3f4f5] rounded-[48px] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span
            className="text-[#564335] text-[12px] font-bold uppercase tracking-[0.6px]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Verification Phase
          </span>
          <span
            className="text-[#f5820a] text-[12px] font-bold"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Step 2 of 3
          </span>
        </div>

        {/* Progress bar at ~65% */}
        <div className="w-full h-2 bg-[#edeeef] rounded-full overflow-hidden">
          <div className="h-full w-[65%] bg-[#f5820a] rounded-full" />
        </div>

        <p
          className="text-[#564335] text-[12px]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Estimated response time: 24–48 hours
        </p>
      </div>
    </div>
  )
}

/* ─── Rejected ────────────────────────────────────────────────────────────── */
function RejectedCard({ appId, reason }: { appId: string; reason: string | null }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-[0px_20px_40px_0px_rgba(147,75,0,0.05)] pt-16 pb-8 px-8 flex flex-col items-center gap-0 w-full max-w-sm relative overflow-hidden"
    >
      <AppIdBadge id={appId} />

      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-[#fef2f2] flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-[#ba1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
      </div>

      {/* Title */}
      <h2
        className="font-bold text-2xl text-[#191c1d] text-center mb-2"
        style={{ fontFamily: "'Epilogue', sans-serif" }}
      >
        Application Not Approved
      </h2>

      {/* Subtitle */}
      <p
        className="text-[#564335] text-[14px] leading-[22.75px] text-center mb-8 max-w-[310px]"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        We encountered some issues while verifying your profile. Please address
        them to proceed.
      </p>

      {/* Rejection reason box */}
      <div className="w-full bg-[#fef2f2] border border-[#fee2e2] rounded-[48px] p-5 mb-8">
        <div className="flex gap-3 items-start">
          <svg
            className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
          </svg>
          <div className="flex flex-col gap-1">
            <span
              className="text-[#ba1a1a] text-[14px] font-bold"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Rejection Reason
            </span>
            <p
              className="text-[#93000a] text-[14px] leading-5"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {reason ?? 'No specific reason was provided. Please contact support for details.'}
            </p>
          </div>
        </div>
      </div>

      {/* Apply again CTA */}
      <Link
        href="/apply"
        className="w-full bg-[#f5820a] hover:bg-[#e07509] text-white font-bold rounded-full py-4 flex items-center justify-center gap-2 transition-colors shadow-[0px_10px_15px_-3px_rgba(245,130,10,0.2),0px_4px_6px_-4px_rgba(245,130,10,0.2)] relative"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Apply Again
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  )
}

/* ─── Approved ────────────────────────────────────────────────────────────── */
function ApprovedCard({ appId }: { appId: string }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-[0px_0px_0px_4px_rgba(245,130,10,0.1),0px_20px_40px_0px_rgba(147,75,0,0.05)] pt-16 pb-8 px-8 flex flex-col items-center gap-0 w-full max-w-sm relative overflow-hidden"
    >
      {/* Orange top accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#f5820a]" />

      <AppIdBadge id={appId} />

      {/* Verified badge icon */}
      <div className="w-24 h-24 rounded-full bg-[#f0fdf4] flex items-center justify-center mb-6">
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 12l2 2 4-4"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 2l2.4 1.8 3-.6 1.2 2.8 2.8 1.2-.6 3L22 12l-1.8 2.4.6 3-2.8 1.2-1.2 2.8-3-.6L12 22l-2.4-1.8-3 .6-1.2-2.8-2.8-1.2.6-3L2 12l1.8-2.4-.6-3 2.8-1.2 1.2-2.8 3 .6z"
            fill="#16a34a"
            stroke="#16a34a"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Title */}
      <h2
        className="font-bold text-[30px] text-[#191c1d] text-center mb-2 leading-9"
        style={{ fontFamily: "'Epilogue', sans-serif" }}
      >
        You&apos;re Verified! 🎉
      </h2>

      {/* Subtitle */}
      <p
        className="text-[#564335] text-[14px] leading-[22.75px] text-center mb-8 max-w-[265px]"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Welcome to the elite circle. Your mentor profile is now live and students
        can start booking sessions with you.
      </p>

      {/* CTAs */}
      <div className="w-full flex flex-col gap-3">
        <Link
          href="/mentor/dashboard"
          className="w-full bg-[#f5820a] hover:bg-[#e07509] text-white font-bold rounded-full py-4 flex items-center justify-center gap-2 transition-colors shadow-[0px_10px_15px_-3px_rgba(245,130,10,0.2)]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Go to My Dashboard
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </Link>

        <Link
          href="/mentors"
          className="w-full border border-[rgba(221,193,175,0.3)] text-[#564335] font-bold rounded-full py-4 flex items-center justify-center gap-2 hover:bg-[#fef9f5] transition-colors"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          View My Public Profile
          <svg className="w-4 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
