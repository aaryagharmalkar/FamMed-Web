import { Copy } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const MessageBubble = ({ message }) => {
	const isUser = message.role === 'user';

	return (
		<div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
			<div className={`max-w-[82%] rounded-2xl px-4 py-3 ${isUser ? 'text-white' : ''}`} style={isUser ? { background: 'var(--primary)' } : { background: 'var(--surface)', border: '1px solid var(--border)' }}>
				<p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ opacity: 0.75 }}>{isUser ? 'You' : 'MedTrack AI'}</p>
				<p className="whitespace-pre-wrap text-sm">{message.content}</p>
				<div className="mt-1 flex items-center justify-between gap-3 text-[10px] opacity-70">
					<span>{formatDate(message.createdAt || new Date(), 'p')}</span>
					{!isUser && (
						<button type="button" className="rounded p-1 hover:bg-black/10" onClick={() => navigator.clipboard.writeText(message.content)} aria-label="Copy assistant reply">
							<Copy size={12} />
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default MessageBubble;
