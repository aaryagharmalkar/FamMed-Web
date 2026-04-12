import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
	name: z.string().min(2),
	generic_name: z.string().optional(),
	form: z.string().min(1),
	dosage: z.string().min(1),
	dosage_unit: z.string().min(1),
	frequency: z.string().min(1),
	start_date: z.string().optional(),
	end_date: z.string().optional(),
	instructions: z.string().optional(),
	stock_count: z.coerce.number().int().min(0),
	assigned_to: z.string().optional(),
	interactions: z.string().optional(),
	side_effects: z.string().optional(),
});

const AddMedicineForm = ({ onSubmit, onValidationError, isSubmitting = false, members = [] }) => {
	const [step, setStep] = useState(1);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
		defaultValues: { dosage_unit: 'mg', form: 'tablet', stock_count: 0 },
	});

	const stepTitle = useMemo(() => ({ 1: 'Basic Info', 2: 'Schedule', 3: 'Additional' }[step]), [step]);

	return (
		<form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-4 rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
			<h3 className="text-lg font-semibold">Add Medicine - {stepTitle}</h3>

			{step === 1 && (
				<div className="grid gap-2 md:grid-cols-2">
					<input {...register('name')} placeholder="Medicine name" className="rounded border p-2" />
					<input {...register('generic_name')} placeholder="Generic name" className="rounded border p-2" />
					<select {...register('form')} className="rounded border p-2"><option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="syrup">Syrup</option></select>
					<input {...register('dosage')} placeholder="Dosage" className="rounded border p-2" />
				</div>
			)}

			{step === 2 && (
				<div className="grid gap-2 md:grid-cols-2">
					<input {...register('frequency')} placeholder="Frequency" className="rounded border p-2" />
					<input type="date" {...register('start_date')} className="rounded border p-2" />
					<input type="date" {...register('end_date')} className="rounded border p-2" />
					<textarea {...register('instructions')} placeholder="Instructions" className="rounded border p-2 md:col-span-2" />
				</div>
			)}

			{step === 3 && (
				<div className="grid gap-2 md:grid-cols-2">
					<input type="number" {...register('stock_count')} placeholder="Stock" className="rounded border p-2" />
					<select {...register('assigned_to')} className="rounded border p-2"><option value="">Assign member</option>{members.map((m) => <option key={m.profile_id} value={m.profile_id}>{m.profiles?.full_name}</option>)}</select>
					<input {...register('side_effects')} placeholder="Side effects (comma-separated)" className="rounded border p-2 md:col-span-2" />
					<input {...register('interactions')} placeholder="Interactions (comma-separated)" className="rounded border p-2 md:col-span-2" />
				</div>
			)}

			{Object.values(errors).length > 0 && <p className="text-xs text-danger-600">Please correct highlighted fields.</p>}

			<div className="flex justify-between">
				<button type="button" disabled={isSubmitting} className="rounded border px-3 py-1.5 disabled:opacity-60" onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</button>
				{step < 3 ? (
					<button type="button" disabled={isSubmitting} className="rounded bg-primary-600 px-3 py-1.5 text-white disabled:opacity-60" onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</button>
				) : (
					<button type="submit" disabled={isSubmitting} className="rounded bg-primary-600 px-3 py-1.5 text-white disabled:opacity-60">{isSubmitting ? 'Saving...' : 'Save medicine'}</button>
				)}
			</div>
		</form>
	);
};

export default AddMedicineForm;
