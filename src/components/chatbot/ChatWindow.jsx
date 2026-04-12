import MessageBubble from './MessageBubble';

const ChatWindow = ({ messages, isTyping }) => (
	<div className="flex-1 space-y-3 overflow-y-auto p-3">
		{messages.map((message, idx) => (
			<MessageBubble key={`${message.role}-${idx}`} message={message} />
		))}
		{isTyping && (
			<div className="flex justify-start">
				<div className="rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-700">
					<span className="inline-block animate-pulse-slow">Assistant is typing...</span>
				</div>
			</div>
		)}
	</div>
);

export default ChatWindow;
