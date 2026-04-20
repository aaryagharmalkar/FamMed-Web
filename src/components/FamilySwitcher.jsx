import { Home } from 'lucide-react';
import { useMemo } from 'react';
import { useAuthContext } from '../context/AuthContext';

const FamilySwitcher = ({ compact = false }) => {
  const { familyId, memberships = [], setActiveFamily } = useAuthContext();

  const families = useMemo(
    () => memberships
      .map((membership) => ({
        id: membership?.family_id || membership?.families?.id,
        name: membership?.families?.name || 'Unnamed family',
      }))
      .filter((family) => Boolean(family.id)),
    [memberships]
  );

  const activeFamilyName =
    families.find((family) => family.id === familyId)?.name ||
    families[0]?.name ||
    'No active family';

  if (families.length <= 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs" style={{ background: 'var(--surface-2)' }}>
        <Home size={14} style={{ color: 'var(--primary)' }} />
        <span className="truncate">{activeFamilyName}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-lg p-2" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
        <Home size={14} style={{ color: 'var(--primary)' }} />
        <span className="truncate">{activeFamilyName}</span>
      </div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
        Switch Family
      </label>
      <select
        value={familyId || ''}
        className={`w-full rounded border px-2 py-1.5 text-xs ${compact ? 'max-w-full' : ''}`}
        style={{ borderColor: 'var(--border)' }}
        onChange={(event) => setActiveFamily(event.target.value)}
      >
        {families.map((family) => (
          <option key={family.id} value={family.id}>
            {family.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FamilySwitcher;