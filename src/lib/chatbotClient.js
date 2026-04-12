import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

const SYSTEM_PROMPT = `You are FamMed's AI health assistant. You help families understand medicines, dosage schedules, potential side effects, drug interactions, and general wellness.
Always recommend consulting a doctor for medical decisions. Keep responses concise, friendly, and evidence-based.

You have access to the user's data (medicines, reminders, and health records) provided in the context. Use this context to personalize your answers.
If the user asks about their medicines, reminders, or uploaded health records, answer using the provided context.
`;

export const sendMessage = async (messages, context = {}) => {
  if (!genAI) {
    return { data: null, error: new Error('Gemini API key is missing. Please set VITE_GEMINI_API_KEY in .env.local') };
  }

  // Format the context
  let contextString = "User Context:\n";
  if (context.activeMedicines && context.activeMedicines.length > 0) {
    contextString += `- Active Medicines: ${JSON.stringify(context.activeMedicines)}\n`;
  }
  if (context.reminders && context.reminders.length > 0) {
    contextString += `- Scheduled Reminders: ${JSON.stringify(context.reminders)}\n`;
  }
  if (context.healthRecords && context.healthRecords.length > 0) {
    contextString += `- Uploaded Health Records (Metadata): ${JSON.stringify(context.healthRecords)}\n`;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT + '\n\n' + contextString,
    });

    // Format history for GoogleGenerativeAI
    const safeHistory = Array.isArray(messages) ? [...messages] : [];
    const lastMessage = safeHistory.pop();

    if (!lastMessage) {
      return { data: null, error: new Error("No message content provided") };
    }

    const history = safeHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.4,
      },
    });

    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();

    return { data: responseText || "I couldn't generate a response. Please try again.", error: null };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { data: null, error };
  }
};
