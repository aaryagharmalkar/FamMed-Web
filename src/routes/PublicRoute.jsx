import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const Spinner = () => (
	<div className="flex min-h-[40vh] items-center justify-center">
		<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
	</div>
);

const PublicRoute = ({ children }) => {
	const { isLoading, isAuthenticated } = useAuthContext();

	if (isLoading) return <Spinner />;
	if (isAuthenticated) return <Navigate to="/" replace />;

	return children;
};

export default PublicRoute;