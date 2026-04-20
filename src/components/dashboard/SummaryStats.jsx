import { Award, BarChart3, Flame, ShieldCheck, XCircle } from 'lucide-react';

const cardBase = 'card';

const SummaryStats = ({ weekly, streak = 0, score = 0 }) => {
  const taken = weekly?.taken || 0;
  const missed = weekly?.missed || 0;
  const adherenceRate = weekly?.adherenceRate || 0;

  const cards = [
    { title: 'Taken (7 days)', value: taken, icon: ShieldCheck, color: '#34c98a' },
    { title: 'Missed (7 days)', value: missed, icon: XCircle, color: '#ef4444' },
    { title: 'Adherence rate', value: `${adherenceRate}%`, icon: BarChart3, color: '#0ea5a4' },
    { title: 'Current streak', value: `${streak} day${streak === 1 ? '' : 's'}`, icon: Flame, color: '#f59e0b' },
    { title: 'Adherence score', value: `${score}%`, icon: Award, color: '#0f766e' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <article key={card.title} className={cardBase}>
          <div className="mb-3 inline-flex rounded-xl p-2" style={{ background: `${card.color}1f` }}>
            <card.icon size={18} color={card.color} />
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{card.title}</p>
          <p className="mt-1 text-2xl font-semibold">{card.value}</p>
        </article>
      ))}
    </div>
  );
};

export default SummaryStats;
