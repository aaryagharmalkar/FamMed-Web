import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import AddMedicineForm from '../components/medicine/AddMedicineForm';
import { useFamilyMembers } from '../hooks/useFamily';
import { useAddMedicine, useMedicines } from '../hooks/useMedicines';
import { useMedicineStore } from '../store/medicineStore';
import MedicineCard from '../components/medicine/MedicineCard';

const Medicines = () => {
	const { familyId, user } = useAuthContext();
	const { filters, setFilter } = useMedicineStore();
	const { data: medicines = [], isLoading } = useMedicines(familyId, filters);
	const { data: members = [] } = useFamilyMembers(familyId);
	const addMedicineMutation = useAddMedicine();
	const [view, setView] = useState(localStorage.getItem('medicinesView') || 'grid');
	const [isAddOpen, setIsAddOpen] = useState(false);

	const displayList = useMemo(() => medicines, [medicines]);

	const handleView = (mode) => {
		setView(mode);
		localStorage.setItem('medicinesView', mode);
	};

	const handleAddMedicine = async (values) => {
		if (!familyId) {
			toast.error('Join or create a family before adding medicines.');
			return;
		}

		const payload = {
			...values,
			family_id: familyId,
			created_by: user?.id,
			side_effects: values.side_effects
				? values.side_effects.split(',').map((item) => item.trim()).filter(Boolean)
				: [],
			interactions: values.interactions
				? values.interactions.split(',').map((item) => item.trim()).filter(Boolean)
				: [],
		};

		try {
			await addMedicineMutation.mutateAsync(payload);
			setIsAddOpen(false);
		} catch (error) {
			toast.error(error.message || 'Failed to save medicine');
		}
	};

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h1 className="text-2xl font-semibold">Medicines</h1>
				<div className="flex items-center gap-2">
					<button type="button" className={`rounded border px-3 py-1.5 text-sm ${view === 'grid' ? 'bg-primary-600 text-white' : ''}`} onClick={() => handleView('grid')}>
						Grid
					</button>
					<button type="button" className={`rounded border px-3 py-1.5 text-sm ${view === 'list' ? 'bg-primary-600 text-white' : ''}`} onClick={() => handleView('list')}>
						List
					</button>
				</div>
			</div>

			<div className="grid gap-2 md:grid-cols-4">
				<input placeholder="Search medicines" className="rounded border p-2 dark:border-slate-700 dark:bg-slate-800" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
				<select className="rounded border p-2 dark:border-slate-700 dark:bg-slate-800" value={filters.form} onChange={(e) => setFilter('form', e.target.value)}>
					<option value="">All forms</option>
					<option value="tablet">Tablet</option>
					<option value="capsule">Capsule</option>
					<option value="syrup">Syrup</option>
				</select>
				<label className="flex items-center gap-2 rounded border p-2 dark:border-slate-700 dark:bg-slate-800">
					<input type="checkbox" checked={Boolean(filters.isActive)} onChange={(e) => setFilter('isActive', e.target.checked)} />
					Active only
				</label>
			</div>

			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, idx) => (
						<div key={idx} className="h-40 animate-pulse rounded-lg border bg-slate-100 dark:bg-slate-800" />
					))}
				</div>
			) : (
				<div className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
					{displayList.map((medicine) => (
						<MedicineCard key={medicine.id} medicine={medicine} view={view} />
					))}
				</div>
			)}

			{isAddOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
					<div className="w-full max-w-3xl">
						<AddMedicineForm
							onSubmit={handleAddMedicine}
							onValidationError={() => toast.error('Please complete all required medicine fields.')}
							isSubmitting={addMedicineMutation.isPending}
							members={members}
						/>
						<div className="mt-2 text-right">
							<button type="button" disabled={addMedicineMutation.isPending} className="rounded border bg-white px-3 py-1.5 text-sm disabled:opacity-60 dark:bg-slate-800" onClick={() => setIsAddOpen(false)}>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			<button type="button" onClick={() => setIsAddOpen(true)} aria-label="Add Medicine" className="fixed bottom-6 right-6 rounded-full bg-primary-600 p-4 text-white shadow-lg hover:scale-105">
				<Plus size={20} />
			</button>
		</section>
	);
};

export default Medicines;
