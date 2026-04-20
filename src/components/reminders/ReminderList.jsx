import ReminderCard from './ReminderCard';

const ReminderList = ({ reminders, onTaken, onMissed, onRemindLater, isBusy = false }) => (
	<div className="space-y-3">
		{reminders.map((reminder) => (
			<ReminderCard
				key={reminder.id}
				reminder={reminder}
				medicine={reminder.medicines}
				onTaken={() => onTaken(reminder)}
				onMissed={() => onMissed(reminder)}
				onRemindLater={() => onRemindLater(reminder)}
				isBusy={isBusy}
			/>
		))}
	</div>
);

export default ReminderList;
