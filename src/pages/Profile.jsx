import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { updateProfile } from '../services/authService';

const Profile = () => {
	const { profile, user } = useAuthContext();
	const [form, setForm] = useState({
		full_name: profile?.full_name || '',
		date_of_birth: profile?.date_of_birth || '',
		phone: profile?.phone || '',
		emergency_contact: profile?.emergency_contact || '',
	});
	const [inAppNotifications, setInAppNotifications] = useState(true);
	const [browserNotifications, setBrowserNotifications] = useState(false);

	const handleSave = async () => {
		const { error } = await updateProfile({ ...form, id: user.id });
		if (error) toast.error(error.message || 'Update failed');
		else toast.success('Profile updated');
	};

	const handleDeleteAccount = async () => {
		const approved = window.confirm('Delete your account? This cannot be undone.');
		if (!approved) return;

		const { error } = await supabase.functions.invoke('delete-account');
		if (error) {
			toast.error('Account deletion function is not deployed yet.');
			return;
		}

		toast.success('Account deleted.');
	};

	return (
		<section className="space-y-4">
			<h1 className="text-2xl font-semibold">Profile</h1>

			<article className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2 dark:border-slate-700 dark:bg-slate-800">
				<input className="rounded border p-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Full name" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
				<input className="rounded border p-2 dark:border-slate-600 dark:bg-slate-900" type="date" value={form.date_of_birth || ''} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
				<input className="rounded border p-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
				<input className="rounded border p-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Emergency contact" value={form.emergency_contact} onChange={(e) => setForm((p) => ({ ...p, emergency_contact: e.target.value }))} />
			</article>

			<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<h2 className="font-semibold">Notification preferences</h2>
				<label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={inAppNotifications} onChange={(e) => setInAppNotifications(e.target.checked)} /> In-app notifications</label>
				<label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={browserNotifications} onChange={(e) => setBrowserNotifications(e.target.checked)} /> Browser notifications</label>
			</article>

			<article className="rounded-lg border border-danger-300 bg-danger-50 p-4 dark:border-danger-700 dark:bg-danger-900/10">
				<h2 className="font-semibold text-danger-700 dark:text-danger-300">Danger zone</h2>
				<button type="button" onClick={handleDeleteAccount} className="mt-3 rounded bg-danger-600 px-3 py-2 text-sm text-white">Delete account</button>
			</article>

			<button onClick={handleSave} type="button" className="rounded bg-primary-600 px-4 py-2 text-white">Save profile</button>
		</section>
	);
};

export default Profile;
