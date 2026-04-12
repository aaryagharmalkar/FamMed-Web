import { Download, Eye, Trash2 } from 'lucide-react';
import { formatDate, formatFileSize } from '../../lib/utils';

const HealthRecordCard = ({ record, onPreview, onDownload, onDelete }) => (
	<article className="rounded-lg border bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-800">
		<div className="flex items-start justify-between gap-2">
			<div>
				<h3 className="font-semibold">{record.title}</h3>
				<p className="text-xs text-slate-500">{formatDate(record.recorded_date)} | {record.doctor_name || 'N/A'}</p>
			</div>
			<span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700">{record.record_type}</span>
		</div>
		<p className="mt-2 text-xs text-slate-500">{record.file_name} ({formatFileSize(record.file_size)})</p>
		<div className="mt-3 flex gap-2">
			<button type="button" className="rounded border p-1.5" onClick={() => onPreview(record)} aria-label="Preview"><Eye size={14} /></button>
			<button type="button" className="rounded border p-1.5" onClick={() => onDownload(record)} aria-label="Download"><Download size={14} /></button>
			<button type="button" className="rounded border p-1.5 text-danger-600" onClick={() => onDelete(record.id)} aria-label="Delete"><Trash2 size={14} /></button>
		</div>
	</article>
);

export default HealthRecordCard;
