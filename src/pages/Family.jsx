import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import {
	useCreateFamily,
	useFamily,
	useFamilyMembers,
	useJoinFamily,
	useRegenerateInviteCode,
	useRemoveMember,
	useUpdateMemberRole,
} from '../hooks/useFamily';

const Family = () => {
	const { familyId } = useAuthContext();
	const { data: family } = useFamily(familyId);
	const { data: members = [] } = useFamilyMembers(familyId);
	const createFamily = useCreateFamily();
	const [invite, setInvite] = useState('');
	const [familyName, setFamilyName] = useState('');
	const joinFamily = useJoinFamily();
	const updateMemberRole = useUpdateMemberRole();
	const removeMember = useRemoveMember();
	const regenerateInviteCode = useRegenerateInviteCode();

	const copyInvite = async () => {
		if (!family?.invite_code) return;
		await navigator.clipboard.writeText(family.invite_code);
		toast.success('Invite code copied');
	};

	const handleCreateFamily = async () => {
		const name = familyName.trim();
		if (!name) {
			toast.error('Please enter a family name');
			return;
		}

		try {
			await createFamily.mutateAsync(name);
			setFamilyName('');
		} catch (error) {
			toast.error(error.message || 'Failed to create family');
		}
	};

	const handleJoinFamily = async () => {
		const code = invite.trim();
		if (!code) {
			toast.error('Please enter an invite code');
			return;
		}

		try {
			await joinFamily.mutateAsync(code);
			setInvite('');
		} catch (error) {
			toast.error(error.message || 'Failed to join family');
		}
	};

	return (
		<section className="space-y-4">
			<h1 className="text-2xl font-semibold">Family</h1>

			{!familyId && (
				<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
					<h3 className="font-semibold">Create a family</h3>
					<div className="mt-2 flex gap-2">
						<input value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Family name" />
						<button type="button" disabled={createFamily.isPending} className="rounded bg-primary-600 px-3 py-2 text-white disabled:opacity-60" onClick={handleCreateFamily}>
							{createFamily.isPending ? 'Creating...' : 'Create'}
						</button>
					</div>
				</article>
			)}

			<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<p className="text-sm text-slate-500">Family Name</p>
				<h2 className="text-xl font-semibold">{family?.name || 'No family selected'}</h2>
				<div className="mt-3 flex items-center gap-2">
					<code className="rounded bg-slate-100 px-2 py-1 text-sm dark:bg-slate-700">{family?.invite_code || 'N/A'}</code>
					<button type="button" className="rounded border p-1.5" onClick={copyInvite} aria-label="Copy invite code">
						<Copy size={14} />
					</button>
					{familyId && (
						<button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => regenerateInviteCode.mutate(familyId)}>
							Regenerate
						</button>
					)}
				</div>
			</article>

			<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<h3 className="mb-3 font-semibold">Join by invite code</h3>
				<div className="flex gap-2">
					<input value={invite} onChange={(e) => setInvite(e.target.value)} className="w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Enter invite code" />
					<button type="button" disabled={joinFamily.isPending} onClick={handleJoinFamily} className="rounded bg-primary-600 px-3 py-2 text-white disabled:opacity-60">
						{joinFamily.isPending ? 'Joining...' : 'Join'}
					</button>
				</div>
			</article>

			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{members.map((member) => (
					<article key={member.id} className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
						<p className="font-medium">{member.profiles?.full_name}</p>
						<div className="mt-2 flex items-center gap-2">
							<select
								value={member.role}
								onChange={(event) => updateMemberRole.mutate({ familyId, profileId: member.profile_id, role: event.target.value })}
								className="rounded border px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
							>
								<option value="member">member</option>
								<option value="caregiver">caregiver</option>
								<option value="admin">admin</option>
							</select>
							<button
								type="button"
								onClick={() => removeMember.mutate({ familyId, profileId: member.profile_id })}
								className="rounded bg-danger-600 px-2 py-1 text-xs text-white"
							>
								Remove
							</button>
						</div>
					</article>
				))}
			</div>
		</section>
	);
};

export default Family;
