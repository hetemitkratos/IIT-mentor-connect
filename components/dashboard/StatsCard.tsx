interface StatItem {
  label: string
  value: string | number
  /** Optional highlight colour class */
  accent?: 'green' | 'blue' | 'amber'
}

interface StatsCardProps {
  stats: StatItem[]
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <div className="stats-card">
      {stats.map((stat) => (
        <div key={stat.label} className={`stats-card__item stats-card__item--${stat.accent ?? 'default'}`}>
          <p className="stats-card__value">{stat.value}</p>
          <p className="stats-card__label">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
