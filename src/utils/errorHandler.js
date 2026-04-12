export const normalizeError = (error) => {
	if (!error) return 'Unexpected error';
	if (typeof error === 'string') return error;
	if (error.message) return error.message;
	return 'Unexpected error';
};

export const isUnauthorizedError = (error) => {
	const status = error?.status || error?.response?.status;
	return status === 401;
};
