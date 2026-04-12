import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const Spinner = () => (
	<div className="flex min-h-[40vh] items-center justify-center">
		<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
	</div>
);

const ProtectedRoute = ({ children }) => {
	const { isLoading, isAuthenticated, authError } = useAuthContext();

	if (isLoading) return <Spinner />;
	if (authError && !isAuthenticated) {
		return (
			<div className="mx-auto mt-10 max-w-md rounded-lg border border-danger-300 bg-danger-50 p-4 text-sm text-danger-700 dark:border-danger-700 dark:bg-danger-900/20 dark:text-danger-200">
				Authentication failed. Check Supabase connection and refresh.
			</div>
		);
	}
	if (!isAuthenticated) return <Navigate to="/login" replace />;

	return <Suspense fallback={<Spinner />}>{children}</Suspense>;
};

export default ProtectedRoute;
