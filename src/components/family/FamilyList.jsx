import MemberCard from './MemberCard';

const FamilyList = ({ members, isAdmin, onRoleChange, onRemove }) => (
	<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
		{members.map((member) => (
			<MemberCard
				key={member.id}
				member={member}
				isAdmin={isAdmin}
				onRoleChange={onRoleChange}
				onRemove={onRemove}
			/>
		))}
	</div>
);

export default FamilyList;
