import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useAdherenceAnalytics } from '../hooks/useMedicationLogs';
import SummaryStats from '../components/dashboard/SummaryStats';
import AdherenceChart from '../components/dashboard/AdherenceChart';

const Analytics = () => {
  const { familyId, user, profile } = useAuthContext();
  const [days, setDays] = useState(30);

  const { data: analytics, isLoading } = useAdherenceAnalytics({
    userId: user?.id,
    days,
    enabled: Boolean(user?.id),
  });

  const summary = useMemo(() => {
    const adherenceRate = analytics?.weekly?.adherenceRate || 0;
    const daily = analytics?.daily || [];
    const worstDay = daily.length
      ? daily.reduce((min, entry) => (entry.adherence < min.adherence ? entry : min), daily[0])
      : null;

    const memberName =
      profile?.full_name?.split(' ')[0] ||
      user?.user_metadata?.full_name?.split(' ')[0] ||
      'A member';

    return `This week, your family took ${adherenceRate}% of scheduled doses. ${memberName} missed the most doses on ${worstDay?.label || 'N/A'}.`;
  }, [analytics?.daily, analytics?.weekly?.adherenceRate, profile?.full_name, user?.user_metadata?.full_name]);

  if (!familyId) {
    return (
      <section className="card space-y-4">
        <h1 className="text-2xl font-semibold">No active family selected</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No active family selected. Please join or create a family.
        </p>
        <Link to="/family" className="btn-primary inline-flex w-fit items-center justify-center px-4 py-2">
          Go to Family Setup
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="section-title card">
        <p className="badge badge-primary">Trends</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Adherence Trends</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          How your family has been doing over time
        </p>
        <div className="mt-4 inline-flex rounded-xl p-1" style={{ background: 'var(--surface-2)' }}>
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`rounded-lg px-3 py-1.5 text-sm ${days === value ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600'}`}
            >
              {value} days
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <article className="card">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading analytics...</p>
        </article>
      ) : (
        <>
          <article className="card">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{summary}</p>
          </article>

          <SummaryStats weekly={analytics?.weekly} streak={analytics?.streak} score={analytics?.score} />
          <AdherenceChart dailyData={analytics?.daily || []} pieData={analytics?.statusPie || []} />

          <article className="card">
            <h2 className="mb-3 text-xl font-bold">Streak calendar</h2>
            <div className="grid grid-cols-7 gap-2">
              {(analytics?.daily || []).map((entry) => (
                <div
                  key={entry.date}
                  className="rounded-lg p-2 text-center"
                  style={{
                    background:
                      entry.adherence >= 100
                        ? 'rgba(22, 163, 74, 0.15)'
                        : entry.adherence >= 70
                          ? 'rgba(14, 165, 164, 0.16)'
                          : 'rgba(239, 68, 68, 0.14)',
                  }}
                >
                  <p className="text-[11px] font-semibold">{entry.label}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{entry.adherence}%</p>
                </div>
              ))}
            </div>
          </article>
        </>
      )}
    </section>
  );
};

export default Analytics;