import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LayoutGrid, List, Plus, Search } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import AddMedicineForm from '../components/medicine/AddMedicineForm';
import PrescriptionUpload from '../components/medicine/PrescriptionUpload';
import GoogleReminderToggle from '../components/google/GoogleReminderToggle';
import { useFamilyMembers } from '../hooks/useFamily';
import { useAddMedicine, useBulkAddMedicines, useMedicines } from '../hooks/useMedicines';
import { useMedicineStore } from '../store/medicineStore';
import MedicineCard from '../components/medicine/MedicineCard';
import { uploadPrescriptionForCurrentUser } from '../services/medicineService';
import { useCreateGoogleEvents, useGoogleConnectionStatus } from '../hooks/useGoogleCalendar';

const getMemberId = (member) => member?.member_profile_id || member?.profile_id || member?.user_id || null;

const getMemberName = (member) => {
	const fullName = String(member?.profiles?.full_name || '').trim();
	if (fullName) return fullName;

	const memberId = getMemberId(member);
	if (!memberId) return 'Family member';

	return `Member (${memberId.slice(0, 6)})`;
};

const Medicines = () => {
	const { familyId, user, profile, memberships = [] } = useAuthContext();
	const { filters, setFilter } = useMedicineStore();
	const { data: medicines = [], isLoading } = useMedicines(familyId, filters);
	const { data: members = [] } = useFamilyMembers(familyId);
	const addMedicineMutation = useAddMedicine();
	const bulkAddMedicinesMutation = useBulkAddMedicines();
	const createGoogleEventsMutation = useCreateGoogleEvents();
	const { data: googleStatus } = useGoogleConnectionStatus(Boolean(user?.id));
	const [view, setView] = useState(localStorage.getItem('medicinesView') || 'grid');
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [entryMode, setEntryMode] = useState('quick');
	const [assignedTo, setAssignedTo] = useState('');
	const [bulkText, setBulkText] = useState('');
	const [googleReminderConfig, setGoogleReminderConfig] = useState({
		enabled: false,
		frequency: 1,
		duration: 7,
		timeSlots: ['09:00'],
		timezone: 'UTC',
	});

	const familyName = useMemo(() => {
		const match = memberships.find((membership) => (membership?.family_id || membership?.families?.id) === familyId);
		return match?.families?.name || 'No family selected';
	}, [familyId, memberships]);

	const activeMembership = useMemo(
		() => memberships.find((membership) => (membership?.family_id || membership?.families?.id) === familyId),
		[familyId, memberships]
	);
	const isAdmin = activeMembership?.role === 'admin';
	const recipientName = useMemo(() => {
		if (!assignedTo) return '';
		return getMemberName(members.find((member) => getMemberId(member) === assignedTo)) || 'Selected member';
	}, [assignedTo, members]);

	useEffect(() => {
		if (!user?.id) return;

		if (!isAdmin) {
			setAssignedTo(user.id);
			return;
		}

		setAssignedTo((current) => (current && members.some((member) => getMemberId(member) === current) ? current : ''));
	}, [isAdmin, members, user?.id]);

	const displayList = useMemo(() => medicines, [medicines]);

	const queueGoogleReminderCreation = (sourceMedicines, createdMedicines) => {
		if (!googleReminderConfig.enabled || !googleStatus?.connected || !createdMedicines?.length) {
			return;
		}

		const googlePromises = sourceMedicines
			.map((source, index) => {
				const insertedMedicine = createdMedicines?.[index];
				if (!insertedMedicine?.id) return null;

				return createGoogleEventsMutation.mutateAsync({
					medicineId: insertedMedicine.id,
					familyId,
					name: source.name,
					dosage: source.dosage,
					instructions: source.instructions || '',
					frequency: googleReminderConfig.frequency,
					duration: googleReminderConfig.duration,
					timeSlots: googleReminderConfig.timeSlots,
					timezone: googleReminderConfig.timezone,
				});
			})
			.filter(Boolean);

		if (!googlePromises.length) {
			return;
		}

		void Promise.allSettled(googlePromises).then((results) => {
			const failedCount = results.filter((result) => result.status === 'rejected').length;
			if (failedCount > 0) {
				console.error('Some Google Calendar events failed to create:', results);
				toast.error('Some Google Calendar reminders failed. Medicines were saved.');
			}
		});
	};

	const handleView = (mode) => {
		setView(mode);
		localStorage.setItem('medicinesView', mode);
	};

	const handleAddMedicine = async (values) => {
		if (!familyId) {
			toast.error('Join or create a family before adding medicines.');
			return;
		}

		const resolvedAssignedTo = isAdmin ? assignedTo : user?.id;
		if (isAdmin && !resolvedAssignedTo) {
			toast.error('Choose who this medicine is for.');
			return;
		}

		const payload = {
			...values,
			family_id: familyId,
			created_by: user?.id,
			assigned_to: resolvedAssignedTo || null,
			side_effects: values.side_effects
				? values.side_effects.split(',').map((item) => item.trim()).filter(Boolean)
				: [],
			interactions: values.interactions
				? values.interactions.split(',').map((item) => item.trim()).filter(Boolean)
				: [],
		};

		try {
			const created = await addMedicineMutation.mutateAsync(payload);

			if (googleReminderConfig.enabled) {
				if (!googleStatus?.connected) {
					toast.error('Connect Google Calendar first to create calendar reminders.');
				} else {
					queueGoogleReminderCreation(
						[
							{
								name: values.name,
								dosage: values.dosage,
								instructions: values.instructions || '',
							},
						],
						[created]
					);
				}
			}

			setIsAddOpen(false);
		} catch (error) {
			toast.error(error.message || 'Failed to save medicine');
		}
	};

	const handleConfirmExtractedMedicines = async ({ medicines: extractedMedicines, file }) => {
		if (!familyId) {
			toast.error('Join or create a family before adding medicines.');
			return;
		}

		const resolvedAssignedTo = isAdmin ? assignedTo : user?.id;
		if (isAdmin && !resolvedAssignedTo) {
			toast.error('Choose who this medicine is for.');
			return;
		}

		const validMedicines = (extractedMedicines || []).filter(
			(item) => item?.name?.trim() && item?.dosage?.trim() && item?.frequency?.trim()
		);

		if (validMedicines.length === 0) {
			toast.error('No valid medicines found. Add required fields before saving.');
			return;
		}

		try {
			toast.loading('Saving medicines...', { id: 'save-progress' });

			let prescriptionUrl = null;
			if (file) {
				const uploadResult = await uploadPrescriptionForCurrentUser(file);
				if (uploadResult.error) {
					console.warn('Prescription upload skipped:', uploadResult.error);
				} else {
					prescriptionUrl = uploadResult.data?.url || null;
				}
			}

			const payload = validMedicines.map((item) => ({
				family_id: familyId,
				created_by: user?.id,
				assigned_to: resolvedAssignedTo || null,
				name: item.name.trim(),
				dosage: item.dosage.trim(),
				frequency: item.frequency.trim(),
				duration: item.duration?.trim() || null,
				instructions: item.instructions?.trim() || null,
				form: 'tablet',
				dosage_unit: 'mg',
				stock_count: 0,
				prescription_url: prescriptionUrl,
			}));

			const created = await bulkAddMedicinesMutation.mutateAsync({ medicines: payload, familyId });
			toast.dismiss('save-progress');
			toast.success(`Saved ${created?.length || 0} medicine(s)!`);
			queueGoogleReminderCreation(validMedicines, created);

			setIsAddOpen(false);
		} catch (error) {
			toast.dismiss('save-progress');
			const message = error?.response?.data?.error || error?.message || 'Failed to save extracted medicines';
			console.error('[handleConfirmExtractedMedicines] Error:', message, error);
			toast.error(message);
			throw error;
		}
	};

	const handleBulkPasteSave = async () => {
		if (!familyId) {
			toast.error('Join or create a family before adding medicines.');
			return;
		}

		const resolvedAssignedTo = isAdmin ? assignedTo : user?.id;
		if (isAdmin && !resolvedAssignedTo) {
			toast.error('Choose who this medicine is for.');
			return;
		}

		const lines = bulkText
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

		const parsed = lines
			.map((line) => line.split('|').map((part) => part.trim()))
			.map(([name, dosage, frequency, duration, instructions]) => ({
				name,
				dosage,
				frequency,
				duration,
				instructions,
			}));

		const validMedicines = parsed.filter((item) => item.name && item.dosage && item.frequency);
		if (validMedicines.length === 0) {
			toast.error('Use one medicine per line: name | dosage | frequency | duration | instructions');
			return;
		}

		try {
			toast.loading('Saving medicines...', { id: 'save-progress' });

			const payload = validMedicines.map((item) => ({
				family_id: familyId,
				created_by: user?.id,
				assigned_to: resolvedAssignedTo || null,
				name: item.name,
				dosage: item.dosage,
				frequency: item.frequency,
				duration: item.duration || null,
				instructions: item.instructions || null,
				form: 'tablet',
				dosage_unit: 'mg',
				stock_count: 0,
			}));

			const created = await bulkAddMedicinesMutation.mutateAsync({ medicines: payload, familyId });
			toast.dismiss('save-progress');
			toast.success(`Saved ${created?.length || 0} medicine(s)!`);
			queueGoogleReminderCreation(validMedicines, created);

			setBulkText('');
			setIsAddOpen(false);
		} catch (error) {
			toast.dismiss('save-progress');
			const message = error?.message || 'Failed to save bulk medicines';
			console.error('[handleBulkPasteSave] Error:', message, error);
			toast.error(message);
		}
	};

	return (
		<section className="space-y-4">
			<div className="card section-title">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="badge badge-primary">Medicine tracker</p>
						<h1 className="mt-2 text-3xl sm:text-4xl">Manage Medicines</h1>
						<p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Search, organize, and monitor medicine stock with ease.</p>
						<p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>Showing data for: {familyName}</p>
					</div>
					<div className="flex items-center gap-2 rounded-xl p-1" style={{ background: 'var(--surface-2)' }}>
						<button type="button" className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${view === 'grid' ? 'bg-white text-primary-600 shadow-sm' : ''}`} onClick={() => handleView('grid')}>
							<LayoutGrid size={14} />
							Grid
					</button>
						<button type="button" className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${view === 'list' ? 'bg-white text-primary-600 shadow-sm' : ''}`} onClick={() => handleView('list')}>
							<List size={14} />
							List
					</button>
				</div>
			</div>
			</div>

			<div className="card">
				<p className="text-sm font-semibold">Calendar reminder setup</p>
				<p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Choose once, then apply to any quick add, scan, or bulk import.</p>
				<div className="mt-3">
					<GoogleReminderToggle value={googleReminderConfig} onChange={setGoogleReminderConfig} />
				</div>
			</div>

			<div className="card">
				<div className="grid gap-3 md:grid-cols-4">
					<label className="relative block md:col-span-2">
						<Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						<input placeholder="Search medicines" className="h-11 w-full pl-10 pr-3" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
					</label>
					<select className="h-11 w-full px-3" value={filters.form} onChange={(e) => setFilter('form', e.target.value)}>
					<option value="">All forms</option>
					<option value="tablet">Tablet</option>
					<option value="capsule">Capsule</option>
					<option value="syrup">Syrup</option>
				</select>
				<label className="flex h-11 items-center gap-2 rounded-[10px] border px-3" style={{ borderColor: 'var(--border)' }}>
					<input type="checkbox" checked={Boolean(filters.isActive)} onChange={(e) => setFilter('isActive', e.target.checked)} />
					Active only
				</label>
				</div>
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
				<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
					<div className="flex min-h-full items-start justify-center py-6">
						<div className="w-full max-w-3xl max-h-[calc(100vh-3rem)] overflow-y-auto">
						<div className="card">
							<p className="text-sm font-semibold">How would you like to add medicines?</p>
							{isAdmin ? (
								<div className="mt-3 rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
									<p className="text-sm font-semibold">For whom is this medicine?</p>
									<p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>This selection applies to quick add, scan, and bulk import.</p>
									<select
										className="mt-3 h-11 w-full px-3"
										value={assignedTo}
										onChange={(event) => setAssignedTo(event.target.value)}
									>
										<option value="">Select family member</option>
										{members.map((member) => (
											<option key={getMemberId(member)} value={getMemberId(member)}>
												{getMemberName(member)}
											</option>
										))}
									</select>
									{recipientName && <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>Saving for: {recipientName}</p>}
								</div>
							) : (
								<div className="mt-3 rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
									Saving for: {profile?.full_name || user?.email || 'your profile'}
								</div>
							)}
							<div className="mt-3 grid gap-2 sm:grid-cols-3">
								{[
									{ key: 'quick', label: 'Quick add', hint: 'One medicine now' },
									{ key: 'scan', label: 'Scan', hint: 'From prescription photo' },
									{ key: 'bulk', label: 'Bulk', hint: 'Paste many medicines' },
								].map((mode) => (
									<button
										key={mode.key}
										type="button"
										onClick={() => setEntryMode(mode.key)}
										className={`rounded-xl border p-3 text-left ${entryMode === mode.key ? 'shadow-sm' : ''}`}
										style={{ borderColor: entryMode === mode.key ? 'var(--primary)' : 'var(--border)', background: entryMode === mode.key ? 'rgba(15,118,110,0.06)' : 'var(--surface)' }}
									>
										<p className="text-sm font-semibold">{mode.label}</p>
										<p className="text-xs" style={{ color: 'var(--muted)' }}>{mode.hint}</p>
									</button>
								))}
							</div>
						</div>

						{entryMode === 'quick' && (
							<AddMedicineForm
								onSubmit={handleAddMedicine}
								onValidationError={() => toast.error('Please complete all required medicine fields.')}
								isSubmitting={addMedicineMutation.isPending || bulkAddMedicinesMutation.isPending}
								members={members}
								showAssignedToField={false}
							/>
						)}

						{entryMode === 'scan' && (
							<PrescriptionUpload
								onConfirm={handleConfirmExtractedMedicines}
								isSaving={bulkAddMedicinesMutation.isPending}
							/>
						)}

						{entryMode === 'bulk' && (
							<div className="card">
								<p className="text-sm font-semibold">Bulk import (paste text)</p>
								<p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>One medicine per line: name | dosage | frequency | duration | instructions</p>
								<textarea
									className="mt-3 min-h-[170px] w-full rounded-xl border p-3 text-sm"
									style={{ borderColor: 'var(--border)' }}
									placeholder="Paracetamol | 500mg | 2 times daily | 5 days | after food"
									value={bulkText}
									onChange={(e) => setBulkText(e.target.value)}
								/>
								<div className="mt-3 text-right">
									<button
										type="button"
										disabled={bulkAddMedicinesMutation.isPending}
										className="btn-accent min-h-[44px] px-4 py-2 text-sm disabled:opacity-60"
										onClick={handleBulkPasteSave}
									>
										Save bulk list
									</button>
								</div>
							</div>
						)}

						<div className="mt-2 text-right">
							<button
								type="button"
								disabled={addMedicineMutation.isPending || bulkAddMedicinesMutation.isPending}
								className="btn-ghost px-4 py-2 text-sm disabled:opacity-60"
								onClick={() => setIsAddOpen(false)}
							>
								Cancel
							</button>
						</div>
						</div>
					</div>
				</div>
			)}

			<button type="button" onClick={() => setIsAddOpen(true)} aria-label="Add Medicine" className="fixed bottom-20 right-4 rounded-full p-4 text-white shadow-lg transition hover:scale-105 md:bottom-6 md:right-6" style={{ background: 'var(--primary)' }}>
				<Plus size={20} />
			</button>
		</section>
	);
};

export default Medicines;
