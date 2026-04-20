
import { useMemo, useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useMedicines } from '../../hooks/useMedicines';
import { useReminders } from '../../hooks/useReminders';
import { useHealthRecords } from '../../hooks/useHealthRecords';
import { useChatbot } from '../../hooks/useChatbot';
import ChatInput from './ChatInput';
import ChatWindow from './ChatWindow';
import { MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getReminderTime } from '../../utils/reminderHelpers';

const ChatbotSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, familyId } = useAuthContext();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handleOpen);
    return () => window.removeEventListener('open-chatbot', handleOpen);
  }, []);
  
  // Fetch Context
  const { data: medicines = [] } = useMedicines(familyId);
  const { data: reminders = [] } = useReminders(familyId);
  const { data: healthRecords = [] } = useHealthRecords(user?.id);

  const context = useMemo(() => ({
    activeMedicines: medicines?.filter((m) => m?.is_active).map((m) => ({ name: m.name, dose: m.dosage, time: m.timing })),
    reminders: reminders?.map(r => ({ time: getReminderTime(r), message: r.message, is_taken: r.is_taken })),
    healthRecords: healthRecords?.map(h => ({ title: h.title, type: h.record_type, date: h.recorded_date }))
  }), [medicines, reminders, healthRecords]);

  const { messages, isTyping, sendMessage, clearHistory, suggestedPrompts } = useChatbot(context);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-500/30 transition hover:scale-105 active:scale-95"
      >
        <MessageCircle size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[420px] flex-col bg-slate-50/95 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.15)] dark:border-l dark:border-slate-800 dark:bg-slate-900/95"
            >
              {/* Premium Gradient Header */}
              <div className="flex items-center justify-between border-b border-transparent bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4 text-white shadow-sm dark:from-slate-800 dark:to-slate-900">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">AI Health Assistant</h2>
                  <p className="text-xs text-primary-200 dark:text-slate-400 font-medium">Powered by Gemini AI</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Window Area */}
              <div className="flex-1 overflow-hidden flex flex-col relative w-full h-full bg-white dark:bg-slate-950">
                <ChatWindow messages={messages} isTyping={isTyping} />
              </div>

              {/* Input Area */}
              <div className="z-10 relative mt-auto border-t border-slate-200 bg-white px-2 py-1 dark:border-slate-800 dark:bg-slate-900 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <ChatInput onSend={sendMessage} onClear={clearHistory} suggestions={suggestedPrompts} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotSidebar;