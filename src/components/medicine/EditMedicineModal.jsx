import AddMedicineForm from './AddMedicineForm';

const EditMedicineModal = ({ isOpen, onClose, medicine, onSubmit, members }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
			<div className="w-full max-w-2xl rounded-lg bg-white p-4 dark:bg-slate-800">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-lg font-semibold">Edit {medicine?.name}</h2>
					<button type="button" className="rounded border px-2 py-1 text-sm" onClick={onClose}>Close</button>
				</div>
				<AddMedicineForm onSubmit={onSubmit} members={members} />
			</div>
		</div>
	);
};

export default EditMedicineModal;
