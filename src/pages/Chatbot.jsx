import { useMemo } from 'react';
import ChatInput from '../components/chatbot/ChatInput';
import ChatWindow from '../components/chatbot/ChatWindow';
import { useAuthContext } from '../context/AuthContext';
import { useMedicines } from '../hooks/useMedicines';
import { useChatbot } from '../hooks/useChatbot';

const Chatbot = () => {
	const { familyId } = useAuthContext();
	const { data: medicines = [] } = useMedicines(familyId);
	const context = useMemo(() => ({ activeMedicines: medicines.filter((m) => m.is_active).map((m) => m.name) }), [medicines]);
	const { messages, isTyping, sendMessage, clearHistory, suggestedPrompts } = useChatbot(context);

	return (
		<section className="grid min-h-[75vh] gap-4 lg:grid-cols-[280px_1fr]">
			<aside className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<h2 className="font-semibold">Session context</h2>
				<p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Active medicines</p>
				<ul className="mt-2 space-y-1 text-sm">
					{context.activeMedicines.map((name) => (
						<li key={name} className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-700">{name}</li>
					))}
				</ul>
			</aside>

			<div className="flex h-[75vh] flex-col rounded-lg border bg-white dark:border-slate-700 dark:bg-slate-800">
				<ChatWindow messages={messages} isTyping={isTyping} />
				<ChatInput onSend={sendMessage} onClear={clearHistory} suggestions={suggestedPrompts} />
			</div>
		</section>
	);
};

export default Chatbot;
