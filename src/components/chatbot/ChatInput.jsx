import { useState } from 'react';

const ChatInput = ({ onSend, onClear, suggestions = [] }) => {
	const [text, setText] = useState('');

	const submit = () => {
		if (!text.trim()) return;
		onSend(text);
		setText('');
	};

	return (
		<div className="space-y-3 border-t border-slate-200 p-3 dark:border-slate-700">
			<div className="flex flex-wrap gap-2">
				{suggestions.map((prompt) => (
					<button key={prompt} type="button" onClick={() => onSend(prompt)} className="rounded-full border px-3 py-1 text-xs dark:border-slate-600">
						{prompt}
					</button>
				))}
			</div>
			<div className="flex gap-2">
				<textarea
					className="min-h-[44px] flex-1 rounded border p-2 dark:border-slate-600 dark:bg-slate-900"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							submit();
						}
					}}
					placeholder="Ask a medicine or wellness question..."
				/>
				<button type="button" className="rounded bg-primary-600 px-3 py-2 text-white" onClick={submit}>Send</button>
				<button type="button" className="rounded border px-3 py-2" onClick={onClear}>Clear</button>
			</div>
		</div>
	);
};

export default ChatInput;
