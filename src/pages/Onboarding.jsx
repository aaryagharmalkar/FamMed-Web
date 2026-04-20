import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useMedicines } from '../hooks/useMedicines';
import { useReminders } from '../hooks/useReminders';

const ONBOARDING_STORAGE_KEY = 'onboardingComplete:v1';

const Step = ({ title, description, done, actionLabel, actionTo }) => (
  <article className="rounded-xl border p-4" style={{ borderColor: done ? 'rgba(22, 163, 74, 0.35)' : 'var(--border)', background: done ? 'rgba(220, 252, 231, 0.4)' : 'var(--surface)' }}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{description}</p>
      </div>
      {done ? <CheckCircle2 size={18} className="text-success-700" /> : <Circle size={18} style={{ color: 'var(--muted)' }} />}
    </div>
    {!done && (
      <Link to={actionTo} className="mt-3 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)' }}>
        {actionLabel}
      </Link>
    )}
  </article>
);

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, familyId, isAuthenticated } = useAuthContext();
  const { data: medicines = [] } = useMedicines(familyId, { isActive: true });
  const { data: reminders = [] } = useReminders(familyId);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const key = `${ONBOARDING_STORAGE_KEY}:${user?.id || 'anon'}`;
  const isFamilyDone = Boolean(familyId);
  const isMedicinesDone = medicines.length > 0;
  const isRemindersDone = reminders.length > 0;
  const allDone = isFamilyDone && isMedicinesDone && isRemindersDone;

  const handleFinish = () => {
    localStorage.setItem(key, 'true');
    navigate('/', { replace: true });
  };

  return (
    <section className="mx-auto max-w-3xl space-y-4 py-4">
      <div className="card section-title">
        <p className="badge badge-primary">First-time setup</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Let's get you ready in 3 quick steps</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Complete these once, then your dashboard becomes your daily home.</p>
      </div>

      <Step
        title="1. Create or join your family"
        description="Pick your family space so reminders and medicines are scoped correctly."
        done={isFamilyDone}
        actionLabel="Open Family Setup"
        actionTo="/family"
      />

      <Step
        title="2. Add your first medicine"
        description="Use quick add, scan, or bulk paste to create your medication list."
        done={isMedicinesDone}
        actionLabel="Go to Medicines"
        actionTo="/medicines"
      />

      <Step
        title="3. Set your first reminder"
        description="Create at least one reminder so the dose queue can start guiding daily actions."
        done={isRemindersDone}
        actionLabel="Open Dose Queue"
        actionTo="/reminders"
      />

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {allDone ? 'All set. You are ready to start daily tracking.' : 'You can finish setup later, but completing it now improves reminders and trends.'}
        </p>
        <button type="button" className="btn-primary min-h-[44px] px-4 py-2" onClick={handleFinish}>
          {allDone ? 'Finish setup' : 'Skip for now'}
        </button>
      </div>
    </section>
  );
};

export default Onboarding;
