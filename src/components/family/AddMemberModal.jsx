import { useState } from 'react';

const AddMemberModal = ({ isOpen, onClose, onJoin }) => {
	const [inviteCode, setInviteCode] = useState('');

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
			<div className="w-full max-w-md rounded-lg bg-white p-4 dark:bg-slate-800">
				<h2 className="text-lg font-semibold">Add Family Member</h2>
				<input
					className="mt-3 w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900"
					placeholder="Enter invite code"
					value={inviteCode}
					onChange={(e) => setInviteCode(e.target.value)}
				/>
				<div className="mt-4 flex justify-end gap-2">
					<button type="button" className="rounded border px-3 py-1.5" onClick={onClose}>Cancel</button>
					<button type="button" className="rounded bg-primary-600 px-3 py-1.5 text-white" onClick={() => onJoin(inviteCode)}>Join</button>
				</div>
			</div>
		</div>
	);
};

export default AddMemberModal;
