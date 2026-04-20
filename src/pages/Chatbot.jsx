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
		<section className="grid min-h-[75vh] gap-4 lg:grid-cols-[300px_1fr]">
			<aside className="card overflow-hidden p-0">
				<div className="p-4 text-white" style={{ background: 'linear-gradient(145deg, var(--primary), #0f766e)' }}>
					<p className="badge" style={{ background: 'rgba(255,255,255,0.24)', color: '#fff' }}>Support</p>
					<h2 className="mt-2 text-2xl text-white">Need help? Ask me.</h2>
					<p className="mt-1 text-sm text-blue-100">I can explain medicines, suggest routines, and help with simple care planning.</p>
				</div>
				<div className="p-4">
				<p className="text-sm" style={{ color: 'var(--muted)' }}>Active medicines</p>
				<ul className="mt-2 space-y-1 text-sm">
					{context.activeMedicines.map((name) => (
						<li key={name} className="rounded-lg px-2 py-1" style={{ background: 'var(--surface-2)' }}>{name}</li>
					))}
					{context.activeMedicines.length === 0 && <li className="text-xs" style={{ color: 'var(--muted)' }}>No active medicines yet.</li>}
				</ul>
				<p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
					For emergencies, call local emergency services. This assistant does not replace your doctor.
				</p>
				</div>
			</aside>

			<div className="flex h-[75vh] flex-col overflow-hidden rounded-[16px] border bg-white" style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
				<ChatWindow messages={messages} isTyping={isTyping} />
				<ChatInput onSend={sendMessage} onClear={clearHistory} suggestions={suggestedPrompts} />
			</div>
		</section>
	);
};

export default Chatbot;
