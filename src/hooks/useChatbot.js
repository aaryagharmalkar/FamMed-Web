import { useCallback, useMemo, useState } from 'react';
import { sendMessage as sendToChatbot } from '../lib/chatbotClient';

const SUGGESTED = [
  'What are the side effects of Paracetamol?',
  'Can I take ibuprofen with blood pressure medication?',
  'Remind me what medicines are due today',
  "What's the recommended dosage for amoxicillin for children?",
];

export const useChatbot = (context = {}) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [lastSentAt, setLastSentAt] = useState(0);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = String(text || '').trim();
      if (!trimmed) return;

      const now = Date.now();
      if (now - lastSentAt < 2000) {
        setError(new Error('Please wait before sending another message.'));
        return;
      }

      setLastSentAt(now);
      setError(null);
      const userMessage = { role: 'user', content: trimmed, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      const res = await sendToChatbot([...messages, userMessage], context);
      if (res.error) {
        setError(res.error);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.data, createdAt: new Date().toISOString() },
        ]);
      }

      setIsTyping(false);
    },
    [context, lastSentAt, messages]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return useMemo(
    () => ({
      messages,
      isTyping,
      sendMessage,
      clearHistory,
      error,
      suggestedPrompts: SUGGESTED,
    }),
    [messages, isTyping, sendMessage, clearHistory, error]
  );
};
