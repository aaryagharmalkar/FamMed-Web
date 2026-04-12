import axios from 'axios';

const CHATBOT_BASE_URL = import.meta.env.VITE_CHATBOT_API_URL;
const CHATBOT_API_KEY = import.meta.env.VITE_CHATBOT_API_KEY;

const SYSTEM_PROMPT = `You are FamMed's AI health assistant. You help families understand medicines, dosage schedules, potential side effects, drug interactions, and general wellness. Always recommend consulting a doctor for medical decisions. Keep responses concise, friendly, and evidence-based.`;

const chatbotClient = axios.create({
  baseURL: CHATBOT_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

chatbotClient.interceptors.request.use(
  (config) => {
    if (CHATBOT_API_KEY) {
      config.headers.Authorization = `Bearer ${CHATBOT_API_KEY}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

chatbotClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || error?.message || 'Failed to communicate with AI assistant.';
    return Promise.reject(new Error(message));
  }
);

const sanitizeMessage = (message = '') =>
  String(message)
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 2000);

export const sendMessage = async (messages, context = {}) => {
  const safeMessages = Array.isArray(messages)
    ? messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: sanitizeMessage(m.content),
      }))
    : [];

  try {
    const { data } = await chatbotClient.post('/', {
      model: 'mistral-medium',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        ...(context?.activeMedicines?.length
          ? [
              {
                role: 'system',
                content: `Active medicines context (names only): ${context.activeMedicines.join(', ')}`,
              },
            ]
          : []),
        ...safeMessages,
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.reply ||
      data?.message ||
      'I could not generate a response right now. Please try again.';

    return { data: reply, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export default chatbotClient;
