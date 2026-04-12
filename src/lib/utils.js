import { format } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (date, pattern = 'PP') => {
  if (!date) return '--';
  try {
    return format(new Date(date), pattern);
  } catch {
    return '--';
  }
};

export const formatTime = (date, pattern = 'p') => {
  if (!date) return '--';
  try {
    return format(new Date(date), pattern);
  } catch {
    return '--';
  }
};

export const formatFileSize = (bytes = 0) => {
  if (!bytes || Number.isNaN(Number(bytes))) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = Number(bytes);
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  return `${size.toFixed(size > 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

export const generateAvatarInitials = (name = '') => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'FM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const debounce = (fn, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};
