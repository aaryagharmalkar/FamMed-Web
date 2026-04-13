import { Copy } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble = ({ message }) => {
	const isUser = message.role === 'user';

	return (
		<div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
			<div className={`max-w-[85%] rounded-lg px-4 py-3 ${isUser ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-900 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 shadow-sm'}`}>
				<div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'} prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100`}>
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{message.content}
					</ReactMarkdown>
				</div>
				<div className="mt-1 flex items-center justify-between gap-3 text-[10px] opacity-70">
					<span>{formatDate(message.createdAt || new Date(), 'p')}</span>
					{!isUser && (
						<button type="button" className="rounded p-1 hover:bg-black/10 transition-colors" onClick={() => navigator.clipboard.writeText(message.content)} aria-label="Copy assistant reply">
							<Copy size={12} />
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default MessageBubble;

