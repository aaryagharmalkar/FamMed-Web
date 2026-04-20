import { useMemo, useState } from 'react';
import { CalendarCheck2, Clock3, Sparkles } from 'lucide-react';
import GoogleCalendarConnect from './GoogleCalendarConnect';
import { useGoogleConnectionStatus } from '../../hooks/useGoogleCalendar';

const GoogleReminderToggle = ({ value, onChange }) => {
  const { data: status } = useGoogleConnectionStatus();
  const [timeSlotInput, setTimeSlotInput] = useState('09:00');

  const model = useMemo(
    () => ({
      enabled: value?.enabled || false,
      frequency: Number(value?.frequency || 1),
      duration: Number(value?.duration || 7),
      timeSlots: value?.timeSlots || ['09:00'],
      timezone: value?.timezone || 'UTC',
    }),
    [value]
  );

  const update = (patch) => onChange({ ...model, ...patch });
  const scheduleDisabled = !status?.connected;

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Google Calendar reminders</p>
          <p className="mt-1 text-xs text-slate-500">Create calendar reminders automatically when medicine is added.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
          <input
            type="checkbox"
            checked={model.enabled}
            onChange={(event) => update({ enabled: event.target.checked })}
          />
          Enable
        </label>
      </div>

      {model.enabled && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CalendarCheck2 size={14} />
              Step 1 - Connect Google Calendar
            </div>
            <GoogleCalendarConnect />
          </div>

          <div className="rounded-lg border p-3 dark:border-slate-700">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Clock3 size={14} />
              Step 2 - Choose reminder schedule
            </div>

            {scheduleDisabled && (
              <p className="mb-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                Connect Google Calendar to unlock schedule controls.
              </p>
            )}

            <div className="grid gap-2 md:grid-cols-2">
              <label className="text-xs text-slate-600">
                Frequency (times/day)
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={model.frequency}
                  disabled={scheduleDisabled}
                  onChange={(event) => update({ frequency: Number(event.target.value || 1) })}
                  className="mt-1 w-full rounded border p-2 disabled:opacity-60"
                />
              </label>
              <label className="text-xs text-slate-600">
                Duration (days)
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={model.duration}
                  disabled={scheduleDisabled}
                  onChange={(event) => update({ duration: Number(event.target.value || 1) })}
                  className="mt-1 w-full rounded border p-2 disabled:opacity-60"
                />
              </label>
            </div>

            <label className="block text-xs text-slate-600">
              Timezone
              <input
                type="text"
                value={model.timezone}
                disabled={scheduleDisabled}
                onChange={(event) => update({ timezone: event.target.value || 'UTC' })}
                placeholder="UTC"
                className="mt-1 w-full rounded border p-2 disabled:opacity-60"
              />
            </label>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={timeSlotInput}
                  disabled={scheduleDisabled}
                  onChange={(event) => setTimeSlotInput(event.target.value)}
                  className="rounded border p-2 disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={scheduleDisabled}
                  className="rounded border px-3 py-2 text-sm disabled:opacity-60"
                  onClick={() => {
                    if (!timeSlotInput || model.timeSlots.includes(timeSlotInput)) return;
                    update({ timeSlots: [...model.timeSlots, timeSlotInput] });
                  }}
                >
                  Add Time Slot
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {model.timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    disabled={scheduleDisabled}
                    className="rounded-full border px-3 py-1 text-xs disabled:opacity-60"
                    onClick={() => update({ timeSlots: model.timeSlots.filter((item) => item !== slot) })}
                  >
                    {slot} x
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
              <div className="mb-1 inline-flex items-center gap-1 font-medium">
                <Sparkles size={12} />
                Reminder summary
              </div>
              <p>
                {model.frequency} reminder(s) per day for {model.duration} day(s) at {model.timeSlots.join(', ')} ({model.timezone}).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleReminderToggle;
