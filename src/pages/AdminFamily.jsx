import { useAuthContext } from '../context/AuthContext';
import Family from './Family';

const AdminFamily = () => {
  const { profile } = useAuthContext();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Family Admin Panel</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">Managing as {profile?.full_name || 'Admin'}.</p>
      <Family />
    </section>
  );
};

export default AdminFamily;
