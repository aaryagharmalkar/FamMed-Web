import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useMedicine, useMedicineInsights, useUpdateMedicine } from '../hooks/useMedicines';
import { formatDate } from '../lib/utils';
import { clearMedicineInsights } from '../services/medicineService';

const MedicineDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: medicine, isLoading } = useMedicine(id);
  const updateMutation = useUpdateMedicine();
  const { data: insights, isLoading: isInsightsLoading } = useMedicineInsights({
    medicine,
    enabled: Boolean(medicine?.name),
  });

  const handleRefreshInsights = async () => {
    if (!id) return;

    const { error } = await clearMedicineInsights(id);
    if (error) {
      toast.error(error.message || 'Failed to clear AI insights cache.');
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['medicine', id] });
    await queryClient.invalidateQueries({ queryKey: ['medicine-insights', id, medicine?.name, medicine?.dosage, medicine?.frequency] });
    toast.success('Refreshing AI insights...');
  };

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshInsights}
              className="rounded border border-primary-600 px-3 py-2 text-sm text-primary-700"
            >
              🔄 Refresh AI Insights
            </button>
            <button
              type="button"
              onClick={() => updateMutation.mutate({ id, updates: { is_active: !medicine.is_active } })}
              className="rounded bg-primary-600 px-3 py-2 text-sm text-white"
            >
              {medicine.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
        <p className="mt-4 text-sm">Instructions: {medicine.instructions || 'None'}</p>
        <p className="mt-2 text-sm">Start: {formatDate(medicine.start_date)} | End: {formatDate(medicine.end_date)}</p>
      </div>

      {insights?._warning && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          {insights._warning}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-semibold">Side Effects</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(insights?.common_side_effects?.length ? insights.common_side_effects : medicine.side_effects || []).map((item) => (
              <span key={item} className="rounded-full bg-accent-100 px-2 py-1 text-xs text-accent-700 dark:bg-accent-900/30 dark:text-accent-200">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-semibold">Interactions</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(insights?.interactions?.length ? insights.interactions : medicine.interactions || []).map((item) => (
              <span key={item} className="rounded-full bg-danger-100 px-2 py-1 text-xs text-danger-700 dark:bg-danger-900/30 dark:text-danger-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-semibold">Uses</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700 dark:text-slate-200 sm:text-sm">
            {(insights?.uses || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {!isInsightsLoading && !(insights?.uses || []).length && <li>No additional Gemini insights found.</li>}
          </ul>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-semibold">Warnings & Contraindications</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700 dark:text-slate-200 sm:text-sm">
            {[...(insights?.warnings || []), ...(insights?.contraindications || [])].map((item) => (
              <li key={item}>{item}</li>
            ))}
            {!isInsightsLoading && ![...(insights?.warnings || []), ...(insights?.contraindications || [])].length && <li>No warnings available.</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-xl font-semibold">Gemini Guidance</h2>
        <div className="mt-2 space-y-2 text-xs text-slate-700 dark:text-slate-200 sm:text-sm">
          <p><strong>Missed dose:</strong> {insights?.missed_dose_advice || 'Not available.'}</p>
          <p><strong>Overdose:</strong> {insights?.overdose_advice || 'Not available.'}</p>
          <p><strong>Storage:</strong> {insights?.storage_guidance || 'Not available.'}</p>
          {!!(insights?.food_and_alcohol_notes || []).length && (
            <p><strong>Food / Alcohol:</strong> {insights.food_and_alcohol_notes.join(', ')}</p>
          )}
          {!!(insights?.monitoring_tips || []).length && (
            <p><strong>Monitoring tips:</strong> {insights.monitoring_tips.join(', ')}</p>
          )}
          <p className="text-xs text-slate-500">{insights?.disclaimer || 'This information is educational and not a substitute for professional medical advice.'}</p>
        </div>
      </div>

      {medicine.prescription_url && (
        <div className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-2 text-xl font-semibold">Prescription</h2>
          <a className="text-primary-600 underline" href={medicine.prescription_url} target="_blank" rel="noreferrer">
            View uploaded file
          </a>
        </div>
      )}
    </section>
  );
};

export default MedicineDetail;
