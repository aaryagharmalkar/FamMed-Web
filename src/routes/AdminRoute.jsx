import { Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthContext } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
	const { profile } = useAuthContext();

	return (
		<ProtectedRoute>
			{profile?.role === 'admin' ? children : <Navigate to="/" replace />}
		</ProtectedRoute>
	);
};

export default AdminRoute;
