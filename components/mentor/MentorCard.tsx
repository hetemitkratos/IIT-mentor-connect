import Link from 'next/link'
import Image from 'next/image'

interface MentorCardProps {
  mentor: {
    id:           string
    iit:          string
    branch:       string
    year:         number
    languages:    string[]
    bio:          string
    profileImage: string | null
    user:         { name: string | null; image: string | null }
  }
}

const YEAR_LABEL: Record<number, string> = {
  1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year',
}

export function MentorCard({ mentor }: MentorCardProps) {
  const displayName  = mentor.user.name ?? 'IIT Mentor'
  const avatarSrc    = mentor.profileImage ?? mentor.user.image
  const bioExcerpt   = mentor.bio.length > 120 ? mentor.bio.slice(0, 117) + '…' : mentor.bio
  const initials     = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Link
      href={`/mentors/${mentor.id}`}
      className="mentor-card"
      aria-label={`View profile of ${displayName}`}
    >
      {/* Avatar */}
      <div className="mentor-card__avatar-wrap">
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={displayName}
            width={64}
            height={64}
            className="mentor-card__avatar"
          />
        ) : (
          <div className="mentor-card__avatar-fallback" aria-hidden="true">
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mentor-card__body">
        <p className="mentor-card__name">{displayName}</p>

        <div className="mentor-card__tags">
          <span className="mentor-card__badge mentor-card__badge--iit">{mentor.iit}</span>
          <span className="mentor-card__badge">{mentor.branch}</span>
          <span className="mentor-card__badge">{YEAR_LABEL[mentor.year] ?? `Year ${mentor.year}`}</span>
        </div>

        <div className="mentor-card__languages">
          {mentor.languages.slice(0, 3).map((lang) => (
            <span key={lang} className="mentor-card__lang">{lang}</span>
          ))}
          {mentor.languages.length > 3 && (
            <span className="mentor-card__lang mentor-card__lang--more">
              +{mentor.languages.length - 3}
            </span>
          )}
        </div>

        <p className="mentor-card__bio">{bioExcerpt}</p>

        <span className="mentor-card__cta">View Profile →</span>
      </div>
    </Link>
  )
}
