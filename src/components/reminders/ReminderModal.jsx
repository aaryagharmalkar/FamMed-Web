import { useState } from 'react';

const ReminderModal = ({ isOpen, onClose, onCreate }) => {
	const [scheduledTime, setScheduledTime] = useState('08:00');

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
			<div className="w-full max-w-md rounded-lg bg-white p-4 dark:bg-slate-800">
				<h2 className="text-lg font-semibold">Set Reminder</h2>
				<input type="time" className="mt-3 w-full rounded border p-2" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
				<div className="mt-4 flex justify-end gap-2">
					<button type="button" className="rounded border px-3 py-1.5" onClick={onClose}>Cancel</button>
					<button type="button" className="rounded bg-primary-600 px-3 py-1.5 text-white" onClick={() => onCreate({ scheduled_time: scheduledTime })}>Create</button>
				</div>
			</div>
		</div>
	);
};

export default ReminderModal;
