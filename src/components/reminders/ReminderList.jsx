import ReminderCard from './ReminderCard';

const ReminderList = ({ reminders, onTaken, onSkip, onSnooze }) => (
	<div className="space-y-3">
		{reminders.map((reminder) => (
			<ReminderCard
				key={reminder.id}
				reminder={reminder}
				onTaken={onTaken}
				onSkip={onSkip}
				onSnooze={onSnooze}
			/>
		))}
	</div>
);

export default ReminderList;
