import { useParams } from 'react-router-dom';
import { useMedicine, useUpdateMedicine } from '../hooks/useMedicines';
import { formatDate } from '../lib/utils';

const MedicineDetail = () => {
  const { id } = useParams();
  const { data: medicine, isLoading } = useMedicine(id);
  const updateMutation = useUpdateMedicine();

  if (isLoading) return <div className="animate-pulse rounded-lg border bg-white p-6 dark:bg-slate-800">Loading medicine...</div>;
  if (!medicine) return <p>Medicine not found.</p>;

  return (
    <section className="space-y-6">
      <div className="rounded-lg border bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{medicine.name}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{medicine.dosage} {medicine.dosage_unit}</p>
          </div>
          <button
            type="button"
            onClick={() => updateMutation.mutate({ id, updates: { is_active: !medicine.is_active } })}
            className="rounded bg-primary-600 px-3 py-2 text-sm text-white"
          >
            {medicine.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
        <p className="mt-4 text-sm">Instructions: {medicine.instructions || 'None'}</p>
        <p className="mt-2 text-sm">Start: {formatDate(medicine.start_date)} | End: {formatDate(medicine.end_date)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-semibold">Side Effects</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(medicine.side_effects || []).map((item) => (
              <span key={item} className="rounded-full bg-accent-100 px-2 py-1 text-xs text-accent-700 dark:bg-accent-900/30 dark:text-accent-200">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-semibold">Interactions</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(medicine.interactions || []).map((item) => (
              <span key={item} className="rounded-full bg-danger-100 px-2 py-1 text-xs text-danger-700 dark:bg-danger-900/30 dark:text-danger-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {medicine.prescription_url && (
        <div className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-2 font-semibold">Prescription</h2>
          <a className="text-primary-600 underline" href={medicine.prescription_url} target="_blank" rel="noreferrer">
            View uploaded file
          </a>
        </div>
      )}
    </section>
  );
};

export default MedicineDetail;
