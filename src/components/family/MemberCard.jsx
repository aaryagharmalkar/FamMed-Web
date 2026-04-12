const MemberCard = ({ member, onRoleChange, onRemove, isAdmin }) => (
	<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
		<p className="font-medium">{member?.profiles?.full_name || 'Member'}</p>
		<span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700">{member?.role}</span>
		{isAdmin && (
			<div className="mt-3 flex gap-2">
				<select className="rounded border px-2 py-1 text-xs" value={member?.role} onChange={(e) => onRoleChange(member?.profile_id, e.target.value)}>
					<option value="member">member</option>
					<option value="caregiver">caregiver</option>
					<option value="admin">admin</option>
				</select>
				<button type="button" className="rounded bg-danger-600 px-2 py-1 text-xs text-white" onClick={() => onRemove(member?.profile_id)}>
					Remove
				</button>
			</div>
		)}
	</article>
);

export default MemberCard;
