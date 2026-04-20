import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Pencil, Trash2 } from 'lucide-react';

const formColor = {
	tablet: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200',
	capsule: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-200',
	syrup: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-200',
};

const MedicineCard = ({ medicine }) => {
	const lowStock = Number(medicine.stock_count) <= Number(medicine.low_stock_threshold);
	const threshold = Number(medicine.low_stock_threshold) || 10;
	const stock = Number(medicine.stock_count) || 0;
	const stockPercent = Math.max(0, Math.min(100, Math.round((stock / (threshold * 2)) * 100)));
	const accent = medicine.form === 'capsule' ? '#34c98a' : medicine.form === 'syrup' ? '#f59e0b' : '#0ea5a4';

	return (
		<Link to={`/medicines/${medicine.id}`} className="card block p-0">
			<div className="h-1.5 rounded-t-[16px]" style={{ background: accent }} />
			<div className="p-4">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold">{medicine.name}</h3>
				<span className={`rounded-full px-2 py-1 text-xs ${formColor[medicine.form] || 'bg-slate-100 text-slate-700'}`}>
					{medicine.form || 'other'}
				</span>
			</div>
			<p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{medicine.dosage} {medicine.dosage_unit}</p>
			{medicine?.profiles?.full_name && (
				<p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>For: {medicine.profiles.full_name}</p>
			)}
			<div className="mt-3 flex items-center justify-between text-xs">
				<span className={`rounded px-2 py-1 ${medicine.is_active ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-700'}`}>
					{medicine.is_active ? 'Active' : 'Inactive'}
				</span>
				<span className={lowStock ? 'text-amber-600' : 'text-slate-500'}>
					Stock: {medicine.stock_count}
				</span>
			</div>

			<div className="mt-3">
				<div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: 'var(--muted)' }}>
					<span>Stock health</span>
					<span>{stockPercent}%</span>
				</div>
				<div className="h-2 rounded-full" style={{ background: 'var(--surface-2)' }}>
					<div className="h-2 rounded-full" style={{ width: `${stockPercent}%`, background: accent }} />
				</div>
			</div>

			<div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border)' }}>
				<span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Quick actions</span>
				<div className="flex items-center gap-1 text-slate-600">
					<span className="rounded-lg p-1.5" style={{ background: 'var(--surface-2)' }}><Pencil size={14} /></span>
					<span className="rounded-lg p-1.5" style={{ background: 'var(--surface-2)' }}><ClipboardList size={14} /></span>
					<span className="rounded-lg p-1.5" style={{ background: 'var(--surface-2)' }}><Trash2 size={14} /></span>
				</div>
			</div>
			</div>
		</Link>
	);
};

export default memo(MedicineCard);
