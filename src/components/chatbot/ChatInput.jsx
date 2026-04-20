import { useState } from 'react';

const ChatInput = ({ onSend, onClear, suggestions = [] }) => {
	const [text, setText] = useState('');

	const submit = () => {
		if (!text.trim()) return;
		onSend(text);
		setText('');
	};

	return (
		<div className="space-y-3 border-t p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
			<div className="flex flex-wrap gap-2">
				{suggestions.map((prompt) => (
					<button key={prompt} type="button" onClick={() => onSend(prompt)} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
						{prompt}
					</button>
				))}
			</div>
			<div className="flex gap-2">
				<textarea
					className="min-h-[44px] flex-1 rounded-xl p-3"
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
				<button type="button" className="btn-primary px-4 py-2" onClick={submit}>Send</button>
				<button type="button" className="btn-ghost px-4 py-2" onClick={onClear}>Clear</button>
			</div>
		</div>
	);
};

export default ChatInput;
