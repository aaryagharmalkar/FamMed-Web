export const isValidPhone = (value = '') => /^\+?[0-9\s()-]{7,20}$/.test(value.trim());

export const isAllowedUploadType = (type) => ['application/pdf', 'image/jpeg', 'image/png'].includes(type);

export const isAllowedUploadSize = (bytes, max = 10 * 1024 * 1024) => Number(bytes) <= max;
