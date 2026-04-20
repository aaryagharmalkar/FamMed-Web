import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import AdminRoute from './routes/AdminRoute';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthContext } from './context/AuthContext';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Medicines = lazy(() => import('./pages/Medicines'));
const MedicineDetail = lazy(() => import('./pages/MedicineDetail'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Family = lazy(() => import('./pages/Family'));
const HealthRecords = lazy(() => import('./pages/HealthRecords'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminFamily = lazy(() => import('./pages/AdminFamily'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
  </div>
);

const RootRoute = () => {
  const { isLoading, isAuthenticated } = useAuthContext();

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );
};

const App = () => (
  <ErrorBoundary>
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/google/callback" element={<GoogleCallback />} />

        <Route path="/" element={<RootRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="medicines" element={<Medicines />} />
          <Route path="medicines/:id" element={<MedicineDetail />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="family" element={<Family />} />
          <Route path="health-records" element={<HealthRecords />} />
          <Route path="chatbot" element={<Chatbot />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route
            path="admin/family"
            element={
              <AdminRoute>
                <AdminFamily />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

export default App;
