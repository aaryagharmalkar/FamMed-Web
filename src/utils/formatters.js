import { format } from 'date-fns';

export const formatDate = (value) => (value ? format(new Date(value), 'PP') : '--');
export const formatDateTime = (value) => (value ? format(new Date(value), 'PP p') : '--');
export const capitalize = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);
