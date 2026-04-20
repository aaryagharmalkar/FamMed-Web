import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const getMemberId = (member) => member?.member_profile_id || member?.profile_id || member?.user_id || null;

const getMemberName = (member) => {
	const fullName = String(member?.profiles?.full_name || '').trim();
	if (fullName) return fullName;

	const memberId = getMemberId(member);
	if (!memberId) return 'Family member';

	return `Member (${memberId.slice(0, 6)})`;
};

const schema = z.object({
	name: z.string().min(2),
	generic_name: z.string().optional(),
	form: z.string().min(1),
	dosage: z.string().min(1),
	dosage_unit: z.string().min(1),
	frequency: z.string().min(1),
	duration: z.string().optional(),
	start_date: z.string().optional(),
	end_date: z.string().optional(),
	instructions: z.string().optional(),
	stock_count: z.coerce.number().int().min(0),
	assigned_to: z.string().optional(),
	interactions: z.string().optional(),
	side_effects: z.string().optional(),
});

const AddMedicineForm = ({
	onSubmit,
	onValidationError,
	isSubmitting = false,
	members = [],
	showAssignedToField = true,
}) => {
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
		<form onSubmit={handleSubmit(onSubmit, onValidationError)} className="card space-y-4">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-lg font-semibold">Add Medicine - {stepTitle}</h3>
				<div className="flex items-center gap-1.5">
					{[1, 2, 3].map((value) => (
						<span key={value} className="h-2.5 w-8 rounded-full" style={{ background: value <= step ? 'var(--primary)' : 'var(--border)' }} />
					))}
				</div>
			</div>

			{step === 1 && (
				<div className="grid gap-2 md:grid-cols-2">
					<input {...register('name')} placeholder="Medicine name" className="h-11 px-3" />
					<input {...register('generic_name')} placeholder="Generic name" className="h-11 px-3" />
					<select {...register('form')} className="h-11 px-3"><option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="syrup">Syrup</option></select>
					<input {...register('dosage')} placeholder="Dosage" className="h-11 px-3" />
				</div>
			)}

			{step === 2 && (
				<div className="grid gap-2 md:grid-cols-2">
					<input {...register('frequency')} placeholder="Frequency" className="h-11 px-3" />
					<input {...register('duration')} placeholder="Duration (e.g., 5 days)" className="h-11 px-3" />
					<input type="date" {...register('start_date')} className="h-11 px-3" />
					<input type="date" {...register('end_date')} className="h-11 px-3" />
					<textarea {...register('instructions')} placeholder="Instructions" className="min-h-[84px] px-3 py-2 md:col-span-2" />
				</div>
			)}

			{step === 3 && (
				<div className="grid gap-2 md:grid-cols-2">
					<input type="number" {...register('stock_count')} placeholder="Stock" className="h-11 px-3" />
					{showAssignedToField && (
						<select {...register('assigned_to')} className="h-11 px-3">
							<option value="">Assign member</option>
							{members.map((m) => (
								<option key={getMemberId(m)} value={getMemberId(m)}>
									{getMemberName(m)}
								</option>
							))}
						</select>
					)}
					<input {...register('side_effects')} placeholder="Side effects (comma-separated)" className="h-11 px-3 md:col-span-2" />
					<input {...register('interactions')} placeholder="Interactions (comma-separated)" className="h-11 px-3 md:col-span-2" />
				</div>
			)}

			{Object.values(errors).length > 0 && <p className="text-xs text-danger-600">Please correct highlighted fields.</p>}

			<div className="flex justify-between">
				<button type="button" disabled={isSubmitting} className="btn-ghost px-4 py-2 disabled:opacity-60" onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</button>
				{step < 3 ? (
					<button type="button" disabled={isSubmitting} className="btn-primary px-4 py-2 disabled:opacity-60" onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</button>
				) : (
					<button type="submit" disabled={isSubmitting} className="btn-primary px-4 py-2 disabled:opacity-60">{isSubmitting ? 'Saving...' : 'Save medicine'}</button>
				)}
			</div>
		</form>
	);
};

export default AddMedicineForm;
