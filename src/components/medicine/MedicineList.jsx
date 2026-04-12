import MedicineCard from './MedicineCard';

const MedicineList = ({ medicines }) => (
	<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{medicines.map((medicine) => (
			<MedicineCard key={medicine.id} medicine={medicine} />
		))}
	</div>
);

export default MedicineList;
