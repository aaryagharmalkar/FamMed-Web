import HealthRecordCard from './HealthRecordCard';

const HealthRecordList = ({ records, onPreview, onDownload, onDelete }) => (
	<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
		{records.map((record) => (
			<HealthRecordCard
				key={record.id}
				record={record}
				onPreview={onPreview}
				onDownload={onDownload}
				onDelete={onDelete}
			/>
		))}
	</div>
);

export default HealthRecordList;
