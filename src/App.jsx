import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import MainLayout from './components/layout/MainLayout';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
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

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/reset-password" element={<ResetPassword />} />

    <Route
      path="/"
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="medicines" element={<Medicines />} />
      <Route path="medicines/:id" element={<MedicineDetail />} />
      <Route path="reminders" element={<Reminders />} />
      <Route path="family" element={<Family />} />
      <Route path="health-records" element={<HealthRecords />} />
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
);

export default App;
