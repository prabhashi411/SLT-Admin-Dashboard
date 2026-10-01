import type { StatCard } from '../../data/mockData';

interface StatsCardsProps {
  stats: StatCard[];
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.id}>
          <div className="stat-card-label">{stat.label}</div>
          <div className="stat-card-value">
            <span className="number">{stat.value}</span>
            {stat.suffix && <span className="suffix">{stat.suffix}</span>}
            {stat.trend && (
              <span className={`trend ${stat.trend.direction}`}>
                {stat.trend.value}
              </span>
            )}
          </div>
          <div className="stat-card-sub">{stat.sub}</div>
        </div>
      ))}
    </div>
  );
}
