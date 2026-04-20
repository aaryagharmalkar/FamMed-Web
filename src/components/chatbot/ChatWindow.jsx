import MessageBubble from './MessageBubble';

const ChatWindow = ({ messages, isTyping }) => (
	<div className="flex-1 space-y-4 overflow-y-auto p-4" style={{ background: 'linear-gradient(180deg, #f9fbff 0%, #f2f7ff 100%)' }}>
		{messages.map((message, idx) => (
			<MessageBubble key={`${message.role}-${idx}`} message={message} />
		))}
		{isTyping && (
			<div className="flex justify-start">
				<div className="rounded-2xl px-3 py-2 text-sm" style={{ background: 'var(--surface)' }}>
					<span className="inline-block animate-pulse-soft">Assistant is typing...</span>
				</div>
			</div>
		)}
	</div>
);

export default ChatWindow;
