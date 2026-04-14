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

// Hardcoded responses for common queries
const HARDCODED_RESPONSES = {
  paracetamol_sideeffects: `**Paracetamol (Acetaminophen) - Side Effects**

Common side effects:
- Nausea or stomach upset
- Allergic reactions (rare): rash, hives, swelling of face or throat
- Lightheadedness or dizziness

Serious side effects (seek immediate medical help):
- Severe allergic reactions (difficulty breathing, swelling)
- Liver damage (especially with overdose): dark urine, yellowing of skin/eyes, persistent nausea
- Severe skin reactions (rare)

**Important Notes:**
- Do not exceed 3-4 grams per day for adults
- Avoid combining with other products containing paracetamol
- Consult your doctor if you have liver disease or regularly consume alcohol

Always consult your pharmacist or doctor for personalized advice. In case of overdose, contact poison control or emergency services immediately.`,
};

export const sendMessage = async (messages, context = {}) => {
  if (!messages || messages.length === 0) {
    return { data: null, error: new Error("No message content provided") };
  }

  // Check for hardcoded responses
  const lastMessage = messages[messages.length - 1];
  const userText = (lastMessage?.content || '').toLowerCase();

  // Check if asking about paracetamol side effects
  if (
    userText.includes('paracetamol') && 
    (userText.includes('side effect') || userText.includes('side-effect') || userText.includes('adverse'))
  ) {
    return { data: HARDCODED_RESPONSES.paracetamol_sideeffects, error: null };
  }

  // If no hardcoded match, proceed with Gemini
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
