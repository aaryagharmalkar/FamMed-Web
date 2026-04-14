import { Copy } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const MessageBubble = ({ message }) => {
	const isUser = message.role === 'user';

	return (
		<div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
			<div className={`max-w-[80%] rounded-lg px-3 py-2 ${isUser ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-50'}`}>
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
