import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FileUpload from '../components/health/FileUpload';
import HealthRecordCard from '../components/health/HealthRecordCard';
import { useAuthContext } from '../context/AuthContext';
import { useDeleteHealthRecord, useHealthRecords, useUploadHealthRecord } from '../hooks/useHealthRecords';
import { getSignedUrl } from '../services/storageService';

const HealthRecords = () => {
	const { user } = useAuthContext();
	const [type, setType] = useState('');
	const [search, setSearch] = useState('');
	const [file, setFile] = useState(null);
	const [progress, setProgress] = useState(0);
	const fileInputRef = useRef(null);
	const { data: records = [] } = useHealthRecords(user?.id, { type, search });
	const uploadMutation = useUploadHealthRecord();
	const deleteMutation = useDeleteHealthRecord();

	const filtered = useMemo(() => records, [records]);

	const handleUpload = async () => {
		if (!file) return;
		try {
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
			}
		} catch (error) {
			toast.error(error.message || 'Upload failed');
		} finally {
			setProgress(0);
		}
	};

	const handleUploadButton = () => {
		if (!file) {
			fileInputRef.current?.click();
			return;
		}

		handleUpload();
	};

	const handleFileSelected = (selectedFile) => {
		setFile(selectedFile);
		setProgress(0);
	};

	const resolveRecordUrl = async (record) => {
		if (record?.file_url?.startsWith('http')) {
			return record.file_url;
		}

		if (!record?.file_path) {
			throw new Error('This record does not have a file attached.');
		}

		const { data, error } = await getSignedUrl('health-files', record.file_path, 60 * 15);
		if (error) throw error;
		return data;
	};

	const handleOpenRecord = async (record) => {
		try {
			const url = await resolveRecordUrl(record);
			window.open(url, '_blank', 'noopener,noreferrer');
		} catch (error) {
			toast.error(error.message || 'Could not open file.');
		}
	};

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h1 className="text-2xl font-semibold">Health Records</h1>
				<button
					type="button"
					className="rounded bg-primary-600 px-3 py-2 text-white disabled:opacity-60"
					onClick={handleUploadButton}
					disabled={uploadMutation.isPending}
				>
					{file ? (uploadMutation.isPending ? 'Uploading...' : 'Upload selected file') : 'Choose file'}
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

			<input
				ref={fileInputRef}
				type="file"
				accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
				className="hidden"
				onChange={(event) => {
					const selectedFile = event.target.files?.[0] || null;
					if (selectedFile) {
						handleFileSelected(selectedFile);
					}
					event.target.value = '';
				}}
			/>

			<FileUpload onFileSelected={handleFileSelected} progress={progress} selectedFile={file} />

			{file && (
				<div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
					<span className="truncate">Selected file: {file.name}</span>
					<button
						type="button"
						className="text-danger-600"
						onClick={() => {
							setFile(null);
							setProgress(0);
						}}
					>
						Clear
					</button>
				</div>
			)}

			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{filtered.map((record) => (
					<HealthRecordCard
						key={record.id}
						record={record}
						onPreview={handleOpenRecord}
						onDownload={handleOpenRecord}
						onDelete={(id) => deleteMutation.mutate({ id })}
					/>
				))}
			</div>
		</section>
	);
};

export default HealthRecords;
