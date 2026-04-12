import { addMinutes, format, isAfter, isBefore } from 'date-fns';

export const formatDateTime = (date, pattern = 'PP p') => format(new Date(date), pattern);

export const isOverdue = (date) => isBefore(new Date(date), new Date());

export const isUpcomingWithin = (date, minutes = 60) => {
	const now = new Date();
	const threshold = addMinutes(now, minutes);
	const target = new Date(date);
	return isAfter(target, now) && isBefore(target, threshold);
};
