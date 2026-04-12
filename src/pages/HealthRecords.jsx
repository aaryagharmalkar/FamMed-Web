import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FileUpload from '../components/health/FileUpload';
import HealthRecordCard from '../components/health/HealthRecordCard';
import { useAuthContext } from '../context/AuthContext';
import { useDeleteHealthRecord, useHealthRecords, useUploadHealthRecord } from '../hooks/useHealthRecords';

const HealthRecords = () => {
	const { user } = useAuthContext();
	const [type, setType] = useState('');
	const [search, setSearch] = useState('');
	const [file, setFile] = useState(null);
	const [progress, setProgress] = useState(0);
	const { data: records = [] } = useHealthRecords(user?.id, { type, search });
	const uploadMutation = useUploadHealthRecord();
	const deleteMutation = useDeleteHealthRecord();

	const filtered = useMemo(() => records, [records]);

	const handleUpload = async () => {
		if (!file) return;
		const result = await uploadMutation.mutateAsync({
			file,
			profileId: user.id,
			onProgress: setProgress,
			recordData: {
				title: file.name,
				record_type: type || 'other',
				recorded_date: new Date().toISOString().slice(0, 10),
			},
		});

		if (result?.id) {
			toast.success('Record uploaded');
			setFile(null);
			setProgress(0);
		}
	};

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h1 className="text-2xl font-semibold">Health Records</h1>
				<button type="button" className="rounded bg-primary-600 px-3 py-2 text-white" onClick={handleUpload}>
					Upload file
				</button>
			</div>

			<div className="grid gap-2 md:grid-cols-3">
				<select value={type} onChange={(e) => setType(e.target.value)} className="rounded border p-2 dark:border-slate-700 dark:bg-slate-800">
					<option value="">All</option>
					<option value="prescription">Prescriptions</option>
					<option value="lab_report">Lab Reports</option>
					<option value="vaccination">Vaccinations</option>
					<option value="other">Other</option>
				</select>
				<input value={search} onChange={(e) => setSearch(e.target.value)} className="rounded border p-2 dark:border-slate-700 dark:bg-slate-800" placeholder="Search title/doctor/hospital" />
			</div>

			<FileUpload onFileSelected={setFile} progress={progress} />

			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{filtered.map((record) => (
					<HealthRecordCard
						key={record.id}
						record={record}
						onPreview={(r) => window.open(r.file_url, '_blank')}
						onDownload={(r) => window.open(r.file_url, '_blank')}
						onDelete={(id) => deleteMutation.mutate({ id })}
					/>
				))}
			</div>
		</section>
	);
};

export default HealthRecords;
