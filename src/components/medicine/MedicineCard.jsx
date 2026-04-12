import { memo } from 'react';
import { Link } from 'react-router-dom';

const formColor = {
	tablet: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200',
	capsule: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-200',
	syrup: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-200',
};

const MedicineCard = ({ medicine }) => {
	const lowStock = Number(medicine.stock_count) <= Number(medicine.low_stock_threshold);

	return (
		<Link to={`/medicines/${medicine.id}`} className="block rounded-lg border bg-white p-4 shadow-card transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold">{medicine.name}</h3>
				<span className={`rounded-full px-2 py-1 text-xs ${formColor[medicine.form] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
					{medicine.form || 'other'}
				</span>
			</div>
			<p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{medicine.dosage} {medicine.dosage_unit}</p>
			<div className="mt-3 flex items-center justify-between text-xs">
				<span className={`rounded px-2 py-1 ${medicine.is_active ? 'bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
					{medicine.is_active ? 'Active' : 'Inactive'}
				</span>
				<span className={lowStock ? 'text-accent-600 dark:text-accent-300' : 'text-slate-500'}>
					Stock: {medicine.stock_count}
				</span>
			</div>
		</Link>
	);
};

export default memo(MedicineCard);
