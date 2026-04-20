const stripCodeFences = (value) => value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

const findJsonObject = (value) => {
  const firstBrace = value.indexOf('{');
  const lastBrace = value.lastIndexOf('}');

  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }

  return value.slice(firstBrace, lastBrace + 1);
};

export const safeJsonParse = (value) => {
  if (!value || typeof value !== 'string') {
    throw new Error('Gemini response was empty.');
  }

  const cleaned = stripCodeFences(value);
  const candidate = findJsonObject(cleaned) || cleaned;

  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error('Gemini returned invalid JSON.');
  }
};
