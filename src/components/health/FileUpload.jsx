import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const FileUpload = ({ onFileSelected, progress = 0, selectedFile = null }) => {
	const onDrop = useCallback(
		(acceptedFiles) => {
			const file = acceptedFiles?.[0];
			if (file) onFileSelected(file);
		},
		[onFileSelected]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxSize: MAX_SIZE,
		accept: {
			'application/pdf': ['.pdf'],
			'image/jpeg': ['.jpg', '.jpeg'],
			'image/png': ['.png'],
		},
		validator: (file) => (ALLOWED_TYPES.includes(file.type) ? null : { code: 'file-invalid-type' }),
	});

	return (
		<div className="space-y-2">
			<div
				{...getRootProps()}
				className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-300 dark:border-slate-600'}`}
			>
				<input {...getInputProps()} />
				<p className="text-sm">{selectedFile ? `Ready to upload: ${selectedFile.name}` : 'Drop PDF/JPG/PNG file or click to upload (max 10MB)'}</p>
			</div>
			<div className="h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
				<div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
			</div>
		</div>
	);
};

export default FileUpload;
